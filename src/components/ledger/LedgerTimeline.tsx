import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Loader2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import { 
  LedgerEntry, 
  LedgerAction,
  LEDGER_ACTION_LABELS, 
  LEDGER_ACTION_COLORS 
} from '@/types/ledger';
import { format } from 'date-fns';

interface LedgerTimelineProps {
  documentId: string;
  canVerify: boolean;
  canAddEvents: boolean;
  onAddEvent?: () => void;
}

export const LedgerTimeline = ({ 
  documentId, 
  canVerify, 
  canAddEvents,
  onAddEvent 
}: LedgerTimelineProps) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-document-ledger?document_id=${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch ledger');
      }

      setEntries(result.entries || []);
    } catch (error) {
      console.error('Fetch ledger error:', error);
      toast({
        title: 'Failed to load ledger',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchLedger();
    }
  }, [documentId]);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ document_id: documentId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      toast({
        title: result.verification_result ? 'Verification Passed' : 'Verification Failed',
        description: result.verification_result 
          ? 'Document integrity verified. Hash matches.' 
          : 'Document may have been tampered with. Hash mismatch detected.',
        variant: result.verification_result ? 'default' : 'destructive'
      });

      // Refresh ledger to show new verification entry
      await fetchLedger();
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const renderMetadata = (metadata: Record<string, unknown>, action: LedgerAction) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    if (action === 'VERIFIED') {
      const result = metadata.verification_result as boolean;
      return (
        <div className="mt-2 p-3 rounded-md bg-muted/50 space-y-2">
          <div className="flex items-center gap-2">
            {result ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={`font-medium ${result ? 'text-green-600' : 'text-red-600'}`}>
              {result ? 'Integrity Verified' : 'Integrity Check Failed'}
            </span>
          </div>
          <div className="text-xs space-y-1">
            <div>
              <span className="text-muted-foreground">Stored Hash: </span>
              <code className="bg-muted px-1 rounded">{String(metadata.stored_hash).substring(0, 16)}...</code>
            </div>
            <div>
              <span className="text-muted-foreground">Recomputed: </span>
              <code className="bg-muted px-1 rounded">{String(metadata.recomputed_hash).substring(0, 16)}...</code>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 rounded-md bg-muted/50">
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Document Ledger
            </CardTitle>
            <CardDescription>
              {entries.length} event{entries.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {canVerify && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-1" />
                )}
                Verify Integrity
              </Button>
            )}
            {canAddEvents && onAddEvent && (
              <Button variant="outline" size="sm" onClick={onAddEvent}>
                Add Event
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={fetchLedger}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No ledger entries yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const isExpanded = expandedEntries.has(entry.id);
                const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;
                
                return (
                  <div key={entry.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div 
                      className={`absolute left-2.5 w-3 h-3 rounded-full ${LEDGER_ACTION_COLORS[entry.action]} border-2 border-background`}
                    />
                    
                    <div className="bg-card border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {LEDGER_ACTION_LABELS[entry.action]}
                            </Badge>
                            {entry.action === 'VERIFIED' && entry.metadata?.verification_result && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {entry.action === 'VERIFIED' && !entry.metadata?.verification_result && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">{entry.actor?.name || 'Unknown'}</span>
                            {entry.actor?.org_name && (
                              <span className="text-muted-foreground"> ({entry.actor.org_name})</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm:ss')}
                          </p>
                        </div>
                        
                        {hasMetadata && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => toggleExpanded(entry.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {isExpanded && hasMetadata && renderMetadata(entry.metadata, entry.action)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
