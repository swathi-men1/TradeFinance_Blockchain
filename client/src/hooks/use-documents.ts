import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  buildUrl,
  type Document,
  type InsertDocument,
  type LedgerEntry,
} from "../api";
import { useToast } from "@/hooks/use-toast";

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: [api.documents.list.path],
    queryFn: async () => {
      const res = await fetch(api.documents.list.path);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return await res.json();
    },
  });
}

export function useDocument(id: number) {
  return useQuery<Document>({
    queryKey: [api.documents.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.documents.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch document");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (doc: Omit<InsertDocument, "ownerId">) => {
      const res = await fetch(api.documents.create.path, {
        method: api.documents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });

      if (!res.ok) throw new Error("Failed to create document");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
      toast({
        title: "Document Uploaded",
        description: "Successfully added to the blockchain ledger",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message,
      });
    },
  });
}

export function useLedger(documentId: number) {
  return useQuery<(LedgerEntry & { actorName: string })[]>({
    queryKey: [api.ledger.list.path, documentId],
    queryFn: async () => {
      const url = buildUrl(api.ledger.list.path, { id: documentId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch ledger");
      return await res.json();
    },
    enabled: !!documentId,
  });
}
