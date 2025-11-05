import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, tenantId, isSaasAdmin, email, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

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

  // Verificar se é admin (pode ver dados financeiros)
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || isSaasAdmin;

  // Menu operacional (todos os usuários)
  const operationalMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Clientes", path: "/clients" },
    { icon: Car, label: "Veículos", path: "/vehicles" },
    { icon: Sparkles, label: "Propostas", path: "/proposals" },
    { icon: FileText, label: "Contratos", path: "/contracts" },
    { icon: Wrench, label: "Manutenções", path: "/maintenance" },
  ];

  // Menu administrativo (apenas admins)
  const adminMenuItems = [
    { icon: DollarSign, label: "Financeiro", path: "/financial" },
    { icon: TrendingUp, label: "ROI da Frota", path: "/roi" },
    { icon: Brain, label: "Predições IA", path: "/ai-predictions" },
    { icon: BarChart3, label: "Relatórios", path: "/reports" },
  ];

  // Verificação dupla: flag + email específico do Pedro
  const isPedroSaasAdmin = isSaasAdmin && email === 'pedrohenrique@ramosfinanceira.com.br';

  // Checar se algum item do submenu admin está ativo
  const isAdminPathActive = adminMenuItems.some(item => location.pathname === item.path);

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

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {/* Menu Operacional */}
          {operationalMenuItems.map((item) => {
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
                  className={`w-full justify-start group transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${
                      isActive ? "animate-pulse" : ""
                    }`}
                  />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          {/* Menu Administrativo (apenas para admins) */}
          {isAdmin && (
            <>
              <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
              
              <Collapsible open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start group transition-all duration-300 ${
                      isAdminPathActive
                        ? "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 text-orange-600 dark:text-orange-400"
                        : "hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950/50 dark:hover:to-red-950/50"
                    }`}
                  >
                    <Shield className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                    <span className="flex-1 text-left">Administrativo</span>
                    {adminMenuOpen ? (
                      <ChevronDown className="h-4 w-4 transition-transform" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-1 mt-1">
                  {adminMenuItems.map((item) => {
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
                          className={`w-full justify-start pl-12 group transition-all duration-300 ${
                            isActive
                              ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
                              : "hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950/50 dark:hover:to-red-950/50"
                          }`}
                          size="sm"
                        >
                          <Icon
                            className={`mr-3 h-4 w-4 transition-transform group-hover:scale-110 ${
                              isActive ? "animate-pulse" : ""
                            }`}
                          />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* SaaS Admin (apenas Pedro) */}
          {isPedroSaasAdmin && (
            <>
              <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
              <Link to="/saas" onClick={() => setSidebarOpen(false)}>
                <Button
                  variant={location.pathname === "/saas" ? "default" : "ghost"}
                  className={`w-full justify-start group transition-all duration-300 ${
                    location.pathname === "/saas"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                      : "hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/50 dark:hover:to-emerald-950/50"
                  }`}
                >
                  <Shield className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                  Admin SaaS
                </Button>
              </Link>
            </>
          )}

          {/* Configurações */}
          <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
          <Link to="/settings" onClick={() => setSidebarOpen(false)}>
            <Button
              variant={location.pathname === "/settings" ? "default" : "ghost"}
              className={`w-full justify-start group transition-all duration-300 ${
                location.pathname === "/settings"
                  ? "bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-lg"
                  : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-950/50 dark:hover:to-slate-950/50"
              }`}
            >
              <Settings className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
              Configurações
            </Button>
          </Link>
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
