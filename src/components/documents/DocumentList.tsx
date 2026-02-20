import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, RefreshCw, Copy, Check, Eye } from 'lucide-react';
import { Document, DOC_TYPE_LABELS } from '@/types/document';
import { DocumentDetails } from './DocumentDetails';
import { format } from 'date-fns';

interface DocumentListProps {
  refreshTrigger?: number;
  userRole: string;
}

export const DocumentList = ({ refreshTrigger, userRole }: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-documents`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch documents');
      }

      setDocuments(result.documents || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Failed to load documents',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
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

  const handleOpenDetails = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDetails(true);
  };

  const getDocTypeBadgeVariant = (docType: string): 'default' | 'secondary' | 'outline' => {
    switch (docType) {
      case 'LOC':
        return 'default';
      case 'INVOICE':
      case 'PO':
        return 'secondary';
      default:
        return 'outline';
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
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              {documents.length} document{documents.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDocuments}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Document Number</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>SHA-256 Hash</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Badge variant={getDocTypeBadgeVariant(doc.doc_type)}>
                        {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{doc.doc_number}</TableCell>
                    <TableCell>{format(new Date(doc.issued_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(doc.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[120px]">
                          {doc.hash.substring(0, 16)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopyHash(doc.hash)}
                        >
                          {copiedHash === doc.hash ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Document Details Dialog with Ledger */}
      <DocumentDetails
        document={selectedDocument}
        open={showDetails}
        onOpenChange={setShowDetails}
        userRole={userRole}
      />
    </Card>
  );
};
