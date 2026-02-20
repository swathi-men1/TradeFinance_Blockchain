import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { TradeTransaction, TRANSACTION_STATUS_LABELS } from '@/types/transaction';
import { format } from 'date-fns';
import { CreateTransactionDialog } from './CreateTransactionDialog';
import { UpdateTransactionStatusDialog } from './UpdateTransactionStatusDialog';

interface TransactionListProps {
  userRole: string;
}

export const TransactionList = ({ userRole }: TransactionListProps) => {
  const [transactions, setTransactions] = useState<TradeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TradeTransaction | null>(null);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-transactions`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setTransactions(result.transactions || []);
    } catch (error) {
      toast({
        title: 'Failed to load transactions',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const canCreate = userRole === 'corporate';
  const canUpdateStatus = ['bank', 'admin'].includes(userRole);

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'COMPLETED': return 'default';
      case 'DISPUTED': return 'destructive';
      case 'IN_PROGRESS': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Trade Transactions
            </CardTitle>
            <CardDescription>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {canCreate && (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                New Transaction
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created</TableHead>
                  {canUpdateStatus && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant={getStatusVariant(tx.status)}>
                        {TRANSACTION_STATUS_LABELS[tx.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.description || '—'}</TableCell>
                    <TableCell>
                      {tx.amount ? `${tx.currency} ${Number(tx.amount).toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell>{format(new Date(tx.created_at), 'MMM d, yyyy')}</TableCell>
                    {canUpdateStatus && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTx(tx)}
                        >
                          Update Status
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CreateTransactionDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={fetchTransactions}
      />

      {selectedTx && (
        <UpdateTransactionStatusDialog
          transaction={selectedTx}
          open={!!selectedTx}
          onOpenChange={(open) => !open && setSelectedTx(null)}
          onUpdated={fetchTransactions}
        />
      )}
    </Card>
  );
};
