import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { TradeTransaction, TransactionStatus, TRANSACTION_STATUS_LABELS } from '@/types/transaction';

interface UpdateTransactionStatusDialogProps {
  transaction: TradeTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const STATUSES: TransactionStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED'];

export const UpdateTransactionStatusDialog = ({
  transaction,
  open,
  onOpenChange,
  onUpdated
}: UpdateTransactionStatusDialogProps) => {
  const [status, setStatus] = useState<TransactionStatus>(transaction.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-transaction-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ transaction_id: transaction.id, status })
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({ title: 'Transaction status updated' });
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Transaction Status</DialogTitle>
          <DialogDescription>
            Current status: {TRANSACTION_STATUS_LABELS[transaction.status]}
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label>New Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{TRANSACTION_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
