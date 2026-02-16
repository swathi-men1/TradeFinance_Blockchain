import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  trendValue,
  className 
}: StatCardProps) {
  return (
    <Card className={cn("glass-card overflow-hidden group", className)}>
      <CardContent className="p-6 relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon className="w-24 h-24 transform rotate-12" />
        </div>
        
        <div className="flex items-start justify-between">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {trend && (
            <div className={cn(
              "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
              trend === "up" ? "bg-green-500/10 text-green-600" : 
              trend === "down" ? "bg-red-500/10 text-red-600" : "bg-gray-500/10 text-gray-600"
            )}>
              <span>{trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}</span>
              {trendValue}
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
