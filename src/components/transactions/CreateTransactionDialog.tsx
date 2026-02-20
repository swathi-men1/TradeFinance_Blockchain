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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export const CreateTransactionDialog = ({
  open,
  onOpenChange,
  onCreated
}: CreateTransactionDialogProps) => {
  const [counterpartyId, setCounterpartyId] = useState('');
  const [txRole, setTxRole] = useState<'buyer' | 'seller'>('buyer');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!counterpartyId) {
      toast({ title: 'Counterparty ID is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-transaction`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            counterparty_id: counterpartyId,
            role: txRole,
            description: description || null,
            amount: amount ? parseFloat(amount) : null,
            currency
          })
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({ title: 'Transaction created successfully' });
      onCreated();
      onOpenChange(false);
      setCounterpartyId('');
      setDescription('');
      setAmount('');
    } catch (error) {
      toast({
        title: 'Failed to create transaction',
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
          <DialogTitle>Create Trade Transaction</DialogTitle>
          <DialogDescription>Set up a new trade between parties.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Your Role</Label>
            <Select value={txRole} onValueChange={(v) => setTxRole(v as 'buyer' | 'seller')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Counterparty User ID</Label>
            <Input
              value={counterpartyId}
              onChange={(e) => setCounterpartyId(e.target.value)}
              placeholder="UUID of the other party"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Trade description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
