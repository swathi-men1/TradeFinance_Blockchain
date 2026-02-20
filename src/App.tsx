import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BankHome from "./pages/BankHome";
import CorporateHome from "./pages/CorporateHome";
import AuditorHome from "./pages/AuditorHome";
import AdminHome from "./pages/AdminHome";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/bank/home"
              element={
                <ProtectedRoute allowedRoles={['bank']}>
                  <BankHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/corporate/home"
              element={
                <ProtectedRoute allowedRoles={['corporate']}>
                  <CorporateHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auditor/home"
              element={
                <ProtectedRoute allowedRoles={['auditor']}>
                  <AuditorHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/home"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
