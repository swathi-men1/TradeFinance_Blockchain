import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskScore, RISK_CATEGORY_COLORS } from '@/types/transaction';

interface RiskScoreCardProps {
  userRole: string;
}

export const RiskScoreCard = ({ userRole }: RiskScoreCardProps) => {
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRiskScores = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-risk-scores`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRiskScores(result.risk_scores || []);
    } catch (error) {
      console.error('Risk score fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRiskScores(); }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (riskScores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No risk scores available yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Corporate users see their own score, others see all
  const isCorporate = userRole === 'corporate';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5" />
              {isCorporate ? 'Your Risk Score' : 'Risk Scores'}
            </CardTitle>
            <CardDescription>
              {isCorporate ? 'Based on your document and transaction history' : `${riskScores.length} corporate user(s)`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRiskScores}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {riskScores.map((rs) => (
            <div key={rs.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-bold ${RISK_CATEGORY_COLORS[rs.category]}`}>
                    {rs.score}
                  </span>
                  <Badge variant={rs.category === 'HIGH' ? 'destructive' : rs.category === 'MEDIUM' ? 'secondary' : 'outline'}>
                    {rs.category}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(rs.last_updated).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rs.rationale}</p>
              {!isCorporate && (
                <p className="text-xs font-mono text-muted-foreground">User: {rs.user_id}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
