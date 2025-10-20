import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import JobMixFormula from "./pages/admin/JobMixFormula";
import MixingSequence from "./pages/admin/MixingSequence";
import RelaySettings from "./pages/admin/RelaySettings";
import UserManagement from "./pages/admin/UserManagement";
import MaterialJogging from "./pages/admin/MaterialJogging";
import ProductionDatabase from "./pages/admin/ProductionDatabase";
import PrintTicket from "./pages/admin/PrintTicket";

const queryClient = new QueryClient();

const App = () => {
  const isElectron = typeof window !== "undefined" && (window as any).env?.isElectron;
  const Router = isElectron ? HashRouter : BrowserRouter;
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* Toast notifications disabled for cleaner HMI display */}
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="job-mix-formula" element={<JobMixFormula />} />
              <Route path="mixing-sequence" element={<MixingSequence />} />
              <Route path="relay-settings" element={<RelaySettings />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="material-jogging" element={<MaterialJogging />} />
              <Route path="production-database" element={<ProductionDatabase />} />
              <Route path="print-ticket" element={<PrintTicket />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
};

export default App;
