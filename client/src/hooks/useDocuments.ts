import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Document {
  id: number;
  doc_type: string;
  doc_number: string;
  hash: string;
  issued_at: string;
  created_at: string;
}

export function useDocuments() {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/api/documents/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

  const createDocument = useMutation({
    mutationFn: async (data: {
      doc_type: string;
      doc_number: string;
      file_url: string;
      issued_at: string;
    }) => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/api/documents/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    documents: documentsQuery.data,
    isLoading: documentsQuery.isLoading,
    createDocument,
  };
}
