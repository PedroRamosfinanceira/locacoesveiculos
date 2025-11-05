import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Users, DollarSign, TrendingUp, Activity } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  status: string | null;
  created_at: string | null;
}

const SaaSDashboard = () => {
  const { isSaasAdmin } = useAuth();

  // KPIs Globais do SaaS
  const { data: saasStats, isLoading } = useQuery({
    queryKey: ["saas-stats"],
    queryFn: async () => {
      // Total de tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("locacoes_veicular_tenants")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      // Total de usuários
      const { data: users, error: usersError } = await supabase
        .from("locacoes_veicular_profiles")
        .select("id, tenant_id, is_active");

      if (usersError) throw usersError;

      // Transações totais (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error: transError } = await supabase
        .from("locacoes_veicular_transactions")
        .select("amount, type")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (transError) throw transError;

      const revenue = transactions
        ?.filter(t => t.type === "receita")
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      return {
        totalTenants: tenants?.length || 0,
        activeTenants: tenants?.filter(t => t.status === 'active').length || 0,
        totalUsers: users?.length || 0,
        activeUsers: users?.filter(u => u.is_active).length || 0,
        totalRevenue: revenue,
        tenants: tenants || [],
      };
    },
    enabled: isSaasAdmin,
  });

  if (!isSaasAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="glass-card max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                <p className="text-muted-foreground">
                  Você não tem permissão para acessar o painel SaaS.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const stats = [
    {
      title: "Total de Empresas",
      value: saasStats?.totalTenants || 0,
      subtitle: `${saasStats?.activeTenants || 0} ativas`,
      icon: Building2,
      color: "text-primary",
      bgColor: "from-primary/20 to-primary/5",
    },
    {
      title: "Total de Usuários",
      value: saasStats?.totalUsers || 0,
      subtitle: `${saasStats?.activeUsers || 0} ativos`,
      icon: Users,
      color: "text-accent",
      bgColor: "from-accent/20 to-accent/5",
    },
    {
      title: "Receita Total (30 dias)",
      value: formatCurrency(saasStats?.totalRevenue || 0),
      subtitle: "Todas empresas",
      icon: DollarSign,
      color: "text-success",
      bgColor: "from-success/20 to-success/5",
    },
    {
      title: "Taxa de Crescimento",
      value: "+15%",
      subtitle: "Último mês",
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "from-warning/20 to-warning/5",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Painel Administrativo SaaS
          </h1>
          <p className="text-muted-foreground">
            Visão global de todas as empresas do sistema
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="glass-card hover:scale-105 transition-smooth animate-slide-up border-primary/20"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Lista de Empresas */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Empresas Cadastradas</CardTitle>
            <CardDescription>
              Todas as empresas utilizando o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <div className="space-y-4">
                {saasStats?.tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-4 rounded-lg glass hover:scale-102 transition-smooth"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {tenant.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          tenant.status === 'active'
                            ? "bg-success/20 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tenant.status === 'active' ? "Ativa" : "Inativa"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Desde{" "}
                        {new Date(tenant.created_at || '').toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}

                {(!saasStats?.tenants || saasStats.tenants.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma empresa cadastrada ainda.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SaaSDashboard;
