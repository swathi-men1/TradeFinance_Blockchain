import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Document {
  id: number;
  doc_type: string;
  doc_number: string;
  file_url: string;
  hash: string;
  issued_at: string;
  created_at: string;
}

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/documents/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return res.data;
    },
  });
}
