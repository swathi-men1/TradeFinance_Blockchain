import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useDocuments, useCreateDocument } from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Search, FileText, Download, Eye, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLedger } from "@/hooks/use-documents";

// Mock implementation of SHA-256 for browser
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const docFormSchema = z.object({
  docType: z.enum(["LOC", "INVOICE", "BILL_OF_LADING", "PO"]),
  docNumber: z.string().min(1, "Document number is required"),
  fileUrl: z.string().url("Must be a valid URL"), // In real app, this would be file upload
});

export default function DocumentsPage() {
  const { data: documents, isLoading } = useDocuments();
  const createMutation = useCreateDocument();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof docFormSchema>>({
    resolver: zodResolver(docFormSchema),
    defaultValues: {
      docType: "INVOICE",
      docNumber: "",
      fileUrl: "https://example.com/document.pdf",
    },
  });

  const onSubmit = async (values: z.infer<typeof docFormSchema>) => {
    // Simulate hash calculation based on document content
    const hash = await sha256(JSON.stringify(values) + Date.now());
    
    createMutation.mutate({
      ...values,
      hash,
    }, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  const filteredDocs = documents?.filter(doc => 
    doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.docType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage and verify your trade documents on the blockchain.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                This will create a hash of your document and store it on the ledger.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="docType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INVOICE">Invoice</SelectItem>
                          <SelectItem value="LOC">Letter of Credit</SelectItem>
                          <SelectItem value="BILL_OF_LADING">Bill of Lading</SelectItem>
                          <SelectItem value="PO">Purchase Order</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="docNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File URL (Simulated)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Hashing & Uploading..." : "Upload to Ledger"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border/50 max-w-md">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search by ID or Type..." 
          className="border-none shadow-none focus-visible:ring-0 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">Loading documents...</div>
        ) : filteredDocs?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
            No documents found. Upload your first document to get started.
          </div>
        ) : (
          filteredDocs?.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))
        )}
      </div>
    </LayoutShell>
  );
}

function DocumentRow({ doc }: { doc: any }) {
  const [showLedger, setShowLedger] = useState(false);
  const { data: ledger } = useLedger(doc.id);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{doc.docType}</h3>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-1">Ref: {doc.docNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Issued: {format(new Date(doc.issuedAt), "PPP")}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <div className="text-xs font-mono bg-slate-100 p-2 rounded border border-slate-200 max-w-[200px] truncate" title={doc.hash}>
            Hash: {doc.hash}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowLedger(!showLedger)}>
              <Activity className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button variant="default" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </div>
        </div>
      </div>

      {showLedger && (
        <div className="bg-muted/30 p-6 border-t border-border animate-in slide-in-from-top-2">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Blockchain Ledger History
          </h4>
          
          <div className="relative border-l-2 border-primary/20 ml-3 space-y-8 pb-2">
            {ledger?.map((entry: any, i: number) => (
              <div key={entry.id} className="relative pl-8">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <span className="font-semibold text-primary">{entry.action}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(entry.timestamp), "PP p")}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Performed by <span className="font-medium text-foreground">{entry.actorName}</span>
                </p>
                {entry.metadata && (
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            
            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary/40" />
              <span className="font-medium text-muted-foreground">Document Created</span>
              <p className="text-xs text-muted-foreground mt-1">{format(new Date(doc.issuedAt), "PP p")}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
