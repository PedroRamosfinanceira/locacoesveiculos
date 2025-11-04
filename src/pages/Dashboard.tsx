import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { VehicleStatusChart } from "@/components/charts/VehicleStatusChart";
import {
  TrendingUp,
  TrendingDown,
  Car,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const Dashboard = () => {
  const { tenantId } = useAuth();
  const navigate = useNavigate();

  const { data: kpis, isLoading: loading } = useQuery({
    queryKey: ["kpis", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes_veicular_v_kpis_mensais")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const stats = [
    {
      title: "Receitas Pagas",
      value: formatCurrency(kpis?.receitas_pagas),
      icon: DollarSign,
      color: "text-success",
      bgColor: "from-success/20 to-success/5",
      trend: "+12%",
    },
    {
      title: "Despesas Pagas",
      value: formatCurrency(kpis?.despesas_pagas),
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "from-destructive/20 to-destructive/5",
      trend: "-5%",
    },
    {
      title: "Lucro Líquido",
      value: formatCurrency(kpis?.lucro_liquido_pagos),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "from-primary/20 to-primary/5",
      trend: "+18%",
    },
    {
      title: "Veículos Alugados",
      value: kpis?.veiculos_alugados || 0,
      icon: CheckCircle,
      color: "text-accent",
      bgColor: "from-accent/20 to-accent/5",
    },
    {
      title: "Veículos Disponíveis",
      value: kpis?.veiculos_disponiveis || 0,
      icon: Car,
      color: "text-warning",
      bgColor: "from-warning/20 to-warning/5",
    },
    {
      title: "Receitas Pendentes",
      value: formatCurrency(kpis?.receitas_pendentes),
      icon: AlertCircle,
      color: "text-muted-foreground",
      bgColor: "from-muted/20 to-muted/5",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho da sua frota
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    {stat.trend && (
                      <div className="text-sm text-success font-medium">
                        {stat.trend}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/vehicles')}
                className="glass-card p-6 text-left hover:scale-105 transition-smooth group"
              >
                <Car className="w-8 h-8 mb-3 text-primary group-hover:animate-bounce" />
                <h3 className="font-semibold mb-1">Cadastrar Veículo</h3>
                <p className="text-sm text-muted-foreground">
                  Adicionar novo veículo à frota
                </p>
              </button>
              <button
                onClick={() => navigate('/contracts')}
                className="glass-card p-6 text-left hover:scale-105 transition-smooth group"
              >
                <DollarSign className="w-8 h-8 mb-3 text-success group-hover:animate-bounce" />
                <h3 className="font-semibold mb-1">Novo Contrato</h3>
                <p className="text-sm text-muted-foreground">
                  Criar contrato de locação
                </p>
              </button>
              <button
                onClick={() => navigate('/roi')}
                className="glass-card p-6 text-left hover:scale-105 transition-smooth group"
              >
                <TrendingUp className="w-8 h-8 mb-3 text-accent group-hover:animate-bounce" />
                <h3 className="font-semibold mb-1">Ver ROI</h3>
                <p className="text-sm text-muted-foreground">
                  Análise de retorno da frota
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <RevenueChart />
          <VehicleStatusChart 
            alugados={kpis?.veiculos_alugados}
            disponiveis={kpis?.veiculos_disponiveis}
            manutencao={0}
          />
        </div>

        {/* Recent Activity */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg glass">
                <div className="w-2 h-2 rounded-full bg-success animate-glow-pulse" />
                <div className="flex-1">
                  <p className="font-medium">Pagamento recebido</p>
                  <p className="text-sm text-muted-foreground">
                    Contrato #1234 - R$ 2.500,00
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">Há 2h</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg glass">
                <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
                <div className="flex-1">
                  <p className="font-medium">Novo veículo cadastrado</p>
                  <p className="text-sm text-muted-foreground">
                    Toyota Corolla 2024 - ABC1234
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">Há 5h</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg glass">
                <div className="w-2 h-2 rounded-full bg-accent animate-glow-pulse" />
                <div className="flex-1">
                  <p className="font-medium">Contrato assinado</p>
                  <p className="text-sm text-muted-foreground">
                    Cliente: João Silva - 12 meses
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">Ontem</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
