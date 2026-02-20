import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.get("/api/documents/");
      return res.data;
    },
  });
}
