import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { DashboardPage as DashboardNew } from "./pages/DashboardNew";
import SaaSDashboard from "./pages/SaaSDashboard";
import Vehicles from "./pages/Vehicles";
import VehicleInvestmentWizard from "./pages/VehicleInvestmentWizard";
import VehicleDetails from "./pages/VehicleDetails";
import Clients from "./pages/Clients";
import Contracts from "./pages/Contracts";
import Financial from "./pages/Financial";
import ROI from "./pages/ROI";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AIPredictions from "./pages/AIPredictions";
import ProposalPage from "./pages/ProposalPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to redirect logged-in users from landing to dashboard
function LandingOrDashboard() {
  const { user, loading, isSaasAdmin } = useAuth();
  
  if (loading) return null;
  if (user && isSaasAdmin) return <Navigate to="/saas" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingOrDashboard />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* SaaS Admin Dashboard */}
            <Route path="/saas" element={<ProtectedRoute requireSaasAdmin><SaaSDashboard /></ProtectedRoute>} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard-new" element={<ProtectedRoute><DashboardNew /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
            <Route path="/vehicles/new" element={<ProtectedRoute><VehicleInvestmentWizard /></ProtectedRoute>} />
            <Route path="/vehicles/:id" element={<ProtectedRoute><VehicleDetails /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/proposals" element={<ProtectedRoute><ProposalPage /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
            
            {/* Administrative routes - require admin role */}
            <Route path="/financial" element={<ProtectedRoute requireAdmin><Financial /></ProtectedRoute>} />
            <Route path="/roi" element={<ProtectedRoute requireAdmin><ROI /></ProtectedRoute>} />
            <Route path="/ai-predictions" element={<ProtectedRoute requireAdmin><AIPredictions /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
            
            {/* Settings requires admin */}
            <Route path="/settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
