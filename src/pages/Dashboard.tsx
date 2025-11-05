import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { VehicleCarousel } from "@/components/dashboard/VehicleCarousel";
import {
  Car,
  FileText,
  Wrench,
  Users,
  TrendingUp,
  PlusCircle,
} from "lucide-react";

const Dashboard = () => {
  const { tenantId } = useAuth();
  const navigate = useNavigate();

  // Query simples para stats operacionais (sem dados financeiros)
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ["dashboard-stats", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Contar veículos por status
      const { data: vehicles } = await supabase
        .from("locacoes_veicular_vehicles")
        .select("status")
        .eq("tenant_id", tenantId);

      // Contar contratos ativos
      const { data: contracts } = await supabase
        .from("locacoes_veicular_contracts")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      // Contar clientes
      const { data: clients } = await supabase
        .from("locacoes_veicular_clients")
        .select("id")
        .eq("tenant_id", tenantId);

      const available = vehicles?.filter(v => v.status === 'available').length || 0;
      const rented = vehicles?.filter(v => v.status === 'rented').length || 0;
      const maintenance = vehicles?.filter(v => v.status === 'maintenance').length || 0;

      return {
        totalVehicles: vehicles?.length || 0,
        available,
        rented,
        maintenance,
        activeContracts: contracts?.length || 0,
        totalClients: clients?.length || 0,
      };
    },
    enabled: !!tenantId,
  });

  // Cards de estatísticas (SEM dados financeiros)
  const quickStats = [
    {
      title: "Total de Veículos",
      value: stats?.totalVehicles || 0,
      icon: Car,
      color: "text-blue-600",
      bgColor: "from-blue-500/20 to-blue-500/5",
      action: () => navigate('/vehicles'),
    },
    {
      title: "Veículos Disponíveis",
      value: stats?.available || 0,
      icon: Car,
      color: "text-green-600",
      bgColor: "from-green-500/20 to-green-500/5",
      action: () => navigate('/vehicles?status=available'),
    },
    {
      title: "Contratos Ativos",
      value: stats?.activeContracts || 0,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "from-purple-500/20 to-purple-500/5",
      action: () => navigate('/contracts'),
    },
    {
      title: "Total de Clientes",
      value: stats?.totalClients || 0,
      icon: Users,
      color: "text-orange-600",
      bgColor: "from-orange-500/20 to-orange-500/5",
      action: () => navigate('/clients'),
    },
    {
      title: "Em Manutenção",
      value: stats?.maintenance || 0,
      icon: Wrench,
      color: "text-red-600",
      bgColor: "from-red-500/20 to-red-500/5",
      action: () => navigate('/maintenance'),
    },
    {
      title: "Veículos Alugados",
      value: stats?.rented || 0,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "from-indigo-500/20 to-indigo-500/5",
      action: () => navigate('/vehicles?status=rented'),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Section com busca */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <h1 className="text-5xl font-bold mb-4">
              Sistema de Gestão de Frotas
            </h1>
            <p className="text-xl text-blue-100 mb-6">
              Gestão completa e eficiente da sua frota de veículos
            </p>
            
            {/* Ações Rápidas */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => navigate('/proposals')}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Nova Proposta
              </Button>
              <Button
                onClick={() => navigate('/contracts')}
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 shadow-lg"
              >
                <FileText className="mr-2 h-5 w-5" />
                Novo Contrato
              </Button>
              <Button
                onClick={() => navigate('/vehicles')}
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 shadow-lg"
              >
                <Car className="mr-2 h-5 w-5" />
                Gerenciar Veículos
              </Button>
            </div>
          </div>
          
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        {/* Stats Cards - SEM dados financeiros */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                onClick={stat.action}
                className="cursor-pointer hover:scale-105 transition-all duration-300 border-none shadow-lg hover:shadow-xl"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Carrossel de Veículos Disponíveis */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Veículos Disponíveis para Locação</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Confira os veículos prontos para alugar
              </p>
            </div>
          </div>
          <VehicleCarousel />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
