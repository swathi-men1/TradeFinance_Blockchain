import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Eye, Loader2, Copy, Check } from 'lucide-react';
import { Document, DOC_TYPE_LABELS } from '@/types/document';
import { LedgerTimeline } from '@/components/ledger/LedgerTimeline';
import { AddLedgerEventDialog } from '@/components/ledger/AddLedgerEventDialog';
import { format } from 'date-fns';

interface DocumentDetailsProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string;
}

export const DocumentDetails = ({
  document,
  open,
  onOpenChange,
  userRole
}: DocumentDetailsProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const canVerify = ['auditor', 'admin'].includes(userRole);
  const canAddEvents = ['bank', 'admin'].includes(userRole);

  const handleView = async () => {
    if (!document) return;
    
    setIsDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-document-file?id=${document.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get file');
      }

      window.open(result.signedUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Failed to open document',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyHash = async () => {
    if (!document) return;
    
    try {
      await navigator.clipboard.writeText(document.hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      toast({
        title: 'Hash copied',
        description: 'SHA-256 hash copied to clipboard.'
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy hash to clipboard.',
        variant: 'destructive'
      });
    }
  };

  if (!document) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge>{DOC_TYPE_LABELS[document.doc_type] || document.doc_type}</Badge>
              {document.doc_number}
            </DialogTitle>
            <DialogDescription>
              Uploaded on {format(new Date(document.created_at), 'MMMM d, yyyy HH:mm')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">{format(new Date(document.issued_at), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Document Type</p>
                <p className="font-medium">{DOC_TYPE_LABELS[document.doc_type]}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-1">SHA-256 Hash</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 overflow-hidden text-ellipsis">
                    {document.hash}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={handleCopyHash}
                  >
                    {copiedHash ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* View Document Button */}
            <Button onClick={handleView} disabled={isDownloading} className="w-full">
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              View Document
            </Button>

            {/* Ledger Timeline */}
            <LedgerTimeline
              documentId={document.id}
              canVerify={canVerify}
              canAddEvents={canAddEvents}
              onAddEvent={() => setShowAddEvent(true)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <AddLedgerEventDialog
        documentId={document.id}
        open={showAddEvent}
        onOpenChange={setShowAddEvent}
        onEventAdded={() => setRefreshKey(k => k + 1)}
      />
    </>
  );
};
