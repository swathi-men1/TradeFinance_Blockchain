import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      const roleRoutes: Record<AppRole, string> = {
        bank: '/bank/home',
        corporate: '/corporate/home',
        auditor: '/auditor/home',
        admin: '/admin/home'
      };
      navigate(roleRoutes[role], { replace: true });
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="text-center space-y-8 max-w-lg">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Trade Finance Ledger
          </h1>
          <p className="text-lg text-muted-foreground">
            Secure and transparent trade finance management for banks, corporates, and auditors.
          </p>
        </div>

        <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
          Get Started <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
