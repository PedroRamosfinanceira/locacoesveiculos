import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Building,
  Wrench,
  BarChart3,
  Brain,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, tenantId, isSaasAdmin, email, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Buscar dados do tenant para logo e nome
  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data } = await supabase
        .from('locacoes_veicular_tenants')
        .select('name, logo_url')
        .eq('id', tenantId)
        .single();
      return data;
    },
    enabled: !!tenantId,
  });

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Car, label: "Veículos", path: "/vehicles" },
    { icon: Users, label: "Clientes", path: "/clients" },
    { icon: FileText, label: "Contratos", path: "/contracts" },
    { icon: DollarSign, label: "Financeiro", path: "/financial" },
    { icon: TrendingUp, label: "ROI da Frota", path: "/roi" },
    { icon: Brain, label: "Predições IA", path: "/ai-predictions" },
    { icon: Wrench, label: "Manutenções", path: "/maintenance" },
    { icon: BarChart3, label: "Relatórios", path: "/reports" },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  // Verificação dupla: flag + email específico do Pedro
  const isPedroSaasAdmin = isSaasAdmin && email === 'pedrohenrique@ramosfinanceira.com.br';
  
  if (isPedroSaasAdmin) {
    menuItems.push({
      icon: Shield,
      label: "Admin SaaS",
      path: "/admin",
    });
  }

  if (!user && !loading) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 glass-card p-2 rounded-lg"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full glass-card border-r border-primary/20 z-40 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 w-64`}
      >
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center gap-3">
            {(tenant as unknown as { logo_url?: string })?.logo_url ? (
              <img src={(tenant as unknown as { logo_url?: string }).logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-contain" />
            ) : (
              <Building className="w-12 h-12 text-primary" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold gradient-text truncate">
                {(tenant as unknown as { name?: string })?.name || 'Carregando...'}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {email}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive ? "glow-primary" : "hover:glass"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <Button
            variant="outline"
            className="w-full glass"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-6 md:p-8">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
