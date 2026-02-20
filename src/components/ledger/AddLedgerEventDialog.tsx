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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { LedgerAction, MANUAL_ACTIONS, LEDGER_ACTION_LABELS } from '@/types/ledger';

interface AddLedgerEventDialogProps {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded: () => void;
}

export const AddLedgerEventDialog = ({
  documentId,
  open,
  onOpenChange,
  onEventAdded
}: AddLedgerEventDialogProps) => {
  const [action, setAction] = useState<LedgerAction | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!action) {
      toast({
        title: 'Action required',
        description: 'Please select an action type.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-ledger-event`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            document_id: documentId,
            action,
            metadata: notes ? { notes } : {}
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add event');
      }

      toast({
        title: 'Event added',
        description: `${LEDGER_ACTION_LABELS[action]} event recorded in ledger.`
      });

      // Reset form
      setAction('');
      setNotes('');
      onOpenChange(false);
      onEventAdded();
    } catch (error) {
      console.error('Add event error:', error);
      toast({
        title: 'Failed to add event',
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
          <DialogTitle>Add Ledger Event</DialogTitle>
          <DialogDescription>
            Record a lifecycle event for this document. Events are immutable and cannot be modified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="action">Action Type</Label>
            <Select value={action} onValueChange={(v) => setAction(v as LedgerAction)}>
              <SelectTrigger>
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {LEDGER_ACTION_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !action}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
