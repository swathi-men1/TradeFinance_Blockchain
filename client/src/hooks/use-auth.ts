import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiRequest } from "../api";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  org_name: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // -----------------------
  // Get Current User
  // -----------------------
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return null;

      try {
        return await apiRequest(api.auth.me.path, api.auth.me.method);
      } catch {
        localStorage.removeItem("access_token");
        return null;
      }
    },
  });

  // -----------------------
  // Login
  // -----------------------
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest(
        api.auth.login.path,
        api.auth.login.method,
        credentials,
      );

      // Save JWT
      localStorage.setItem("access_token", response.access_token);

      // Fetch user after login
      return await apiRequest(api.auth.me.path, api.auth.me.method);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user);

      toast({
        title: "Login Successful",
        description: `Welcome ${user.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    },
  });

  // -----------------------
  // Register
  // -----------------------
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(
        api.auth.register.path,
        api.auth.register.method,
        data,
      );
    },
    onSuccess: () => {
      toast({
        title: "Account Created",
        description: "You can now login.",
      });
    },
  });

  // -----------------------
  // Logout
  // -----------------------
  const logout = () => {
    localStorage.removeItem("access_token");
    queryClient.setQueryData(["currentUser"], null);
    toast({ title: "Logged Out" });
  };

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
  };
}
