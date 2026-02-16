import { LayoutShell } from "@/components/layout-shell";
import { useRiskScores } from "@/hooks/use-analytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";

export default function RiskPage() {
  const { data: riskScores, isLoading } = useRiskScores();

  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: "Low Risk", color: "text-green-600", bg: "bg-green-500" };
    if (score < 70) return { label: "Medium Risk", color: "text-yellow-600", bg: "bg-yellow-500" };
    return { label: "High Risk", color: "text-red-600", bg: "bg-red-500" };
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Analysis</h1>
          <p className="text-muted-foreground">AI-driven risk assessment for trade partners.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center">Loading risk profiles...</div>
          ) : (
            riskScores?.map((risk) => {
              const level = getRiskLevel(risk.score);
              return (
                <Card key={risk.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      User #{risk.userId}
                    </CardTitle>
                    <Shield className={`h-4 w-4 ${level.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{risk.score}/100</div>
                    <p className={`text-xs ${level.color} font-medium mb-4`}>
                      {level.label}
                    </p>
                    <Progress value={risk.score} className={`h-2 ${level.bg}`} />
                    
                    <div className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      <p className="font-medium text-foreground mb-1">AI Rationale:</p>
                      {risk.rationale}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
