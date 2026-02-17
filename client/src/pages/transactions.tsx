import { LayoutShell } from "@/components/layout-shell";
import { useTransactions } from "@/hooks/use-analytics";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions();

  return (
    <LayoutShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">View all settlement and trade activities.</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {format(new Date(tx.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{tx.id.toString().padStart(6, '0')}
                      </TableCell>
                      <TableCell>Buyer #{tx.buyerId}</TableCell>
                      <TableCell>Seller #{tx.sellerId}</TableCell>
                      <TableCell className="font-bold">
                        {new Intl.NumberFormat('en-IN', { 
                          style: 'currency', 
                          currency: 'INR' 
                        }).format(Number(tx.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            tx.status === "completed" ? "default" : 
                            tx.status === "pending" ? "secondary" : "destructive"
                          }
                          className={
                            tx.status === "completed" ? "bg-green-100 text-green-700 hover:bg-green-200" :
                            tx.status === "pending" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : ""
                          }
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
