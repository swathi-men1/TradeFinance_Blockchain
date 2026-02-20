import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { DocumentList } from '@/components/documents/DocumentList';
import { TransactionList } from '@/components/transactions/TransactionList';
import { RiskScoreCard } from '@/components/risk/RiskScoreCard';
import { AuditLogList } from '@/components/audit/AuditLogList';

interface DashboardLayoutProps {
  title: string;
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, children }) => {
  const { user, role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete account');

      toast({ title: 'Account deleted', description: 'Your account has been permanently deleted.' });
      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete account.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const canUpload = role === 'corporate';
  const canViewDocuments = ['corporate', 'bank', 'auditor', 'admin'].includes(role || '');
  const canViewTransactions = ['corporate', 'bank', 'auditor', 'admin'].includes(role || '');
  const canViewRisk = ['corporate', 'bank', 'auditor', 'admin'].includes(role || '');
  const canViewAuditLogs = role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.name && `Welcome, ${profile.name}`}
                {profile?.org_name && ` • ${profile.org_name}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {children}

        {/* Risk Score - shown at top for corporate users */}
        {canViewRisk && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <RiskScoreCard userRole={role || ''} />
            </div>
            <div className="lg:col-span-2">
              {canViewTransactions && (
                <TransactionList userRole={role || ''} />
              )}
            </div>
          </div>
        )}
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload Form - Only for corporate users */}
          {canUpload && (
            <div className="lg:col-span-1">
              <DocumentUploadForm onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {/* Document List */}
          {canViewDocuments && (
            <div className={canUpload ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <DocumentList refreshTrigger={refreshTrigger} userRole={role || ''} />
            </div>
          )}

          {/* Role Info Card */}
          {!canViewDocuments && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Access Restricted</CardTitle>
                <CardDescription>
                  Your current role does not have access to the document management system.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Admin Audit Logs */}
        {canViewAuditLogs && (
          <AuditLogList />
        )}
      </main>
    </div>
  );
};
