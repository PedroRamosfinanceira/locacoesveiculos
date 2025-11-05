/**
 * 📊 DASHBOARD PRINCIPAL - NOVO (Baseado em Views Materializadas)
 * 
 * Usa as views do Supabase para dados em tempo real:
 * - locacoes_veicular_v_kpis_mensais
 * - locacoes_veicular_v_aging
 * - locacoes_veicular_v_roi_frota
 * - locacoes_veicular_v_evolucao_temporal
 */

import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Car,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  AlertCircle,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentMonthKPIs } from '@/hooks/useKPIs';
import { useUnreadAlerts } from '@/hooks/useAlerts';
import { useAgingTotals } from '@/hooks/useAging';
import { useVehiclesAvailable, useVehiclesRented, useVehiclesMaintenance } from '@/hooks/useVehicleViews';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPage() {
  const { tenantId } = useAuth();
  const navigate = useNavigate();

  // Dados do mês atual
  const { data: kpis, isLoading: loadingKPIs } = useCurrentMonthKPIs(tenantId);

  // Alertas não lidos
  const { data: alerts, count: alertCount } = useUnreadAlerts(tenantId);

  // Inadimplência
  const { totals: agingTotals } = useAgingTotals(tenantId);

  // Veículos por status
  const { data: vehiclesAvailable } = useVehiclesAvailable(tenantId);
  const { data: vehiclesRented } = useVehiclesRented(tenantId);
  const { data: vehiclesMaintenance } = useVehiclesMaintenance(tenantId);

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formatar percentual
  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  // KPI Cards
  const kpiCards = [
    {
      title: 'Veículos Disponíveis',
      value: kpis?.veiculos_disponiveis || 0,
      icon: Car,
      color: 'text-green-600',
      bgColor: 'from-green-500/20 to-green-500/5',
      action: () => navigate('/vehicles?status=disponivel'),
    },
    {
      title: 'Veículos Alugados',
      value: kpis?.veiculos_alugados || 0,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'from-blue-500/20 to-blue-500/5',
      action: () => navigate('/vehicles?status=alugado'),
    },
    {
      title: 'Receitas Pagas (Mês)',
      value: formatCurrency(kpis?.receitas_pagas || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'from-green-500/20 to-green-500/5',
      action: () => navigate('/financial/receivable'),
    },
    {
      title: 'Despesas Pagas (Mês)',
      value: formatCurrency(kpis?.despesas_pagas || 0),
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'from-red-500/20 to-red-500/5',
      action: () => navigate('/financial/payable'),
    },
    {
      title: 'Lucro Líquido (Mês)',
      value: formatCurrency(kpis?.lucro_liquido_pagos || 0),
      icon: kpis && kpis.lucro_liquido_pagos && kpis.lucro_liquido_pagos >= 0 ? TrendingUp : TrendingDown,
      color: kpis && kpis.lucro_liquido_pagos && kpis.lucro_liquido_pagos >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor:
        kpis && kpis.lucro_liquido_pagos && kpis.lucro_liquido_pagos >= 0
          ? 'from-green-500/20 to-green-500/5'
          : 'from-red-500/20 to-red-500/5',
      action: () => navigate('/financial'),
    },
    {
      title: 'Receitas Pendentes',
      value: formatCurrency(kpis?.receitas_pendentes || 0),
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'from-purple-500/20 to-purple-500/5',
      action: () => navigate('/financial/receivable'),
    },
  ];

  // Ações rápidas
  const quickActions = [
    {
      label: 'Cadastrar Veículo',
      icon: PlusCircle,
      action: () => navigate('/vehicles/new'),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      label: 'Cadastrar Cliente',
      icon: Users,
      action: () => navigate('/clients/new'),
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      label: 'Criar Contrato',
      icon: FileText,
      action: () => navigate('/contracts/new'),
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      label: 'Agendar Manutenção',
      icon: Wrench,
      action: () => navigate('/maintenance/new'),
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  if (loadingKPIs) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Sistema de Gestão de Frotas</p>
          </div>
          {alertCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {alertCount} {alertCount === 1 ? 'Alerta' : 'Alertas'}
            </Badge>
          )}
        </div>

      {/* Alertas Críticos */}
      {alerts && alerts.length > 0 && (
        <Alert variant={alerts[0].severity === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{alerts[0].title}</strong>: {alerts[0].message}
            {alerts[0].action_url && (
              <Button
                variant="link"
                className="ml-2 p-0 h-auto"
                onClick={() => navigate(alerts[0].action_url!)}
              >
                Ver detalhes
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={card.action}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div
                  className={`p-2 rounded-full bg-gradient-to-br ${card.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inadimplência (Aging) */}
      {agingTotals && agingTotals.total > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">0-30 dias</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(agingTotals['0-30'] || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">31-60 dias</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(agingTotals['31-60'] || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">61-90 dias</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(agingTotals['61-90'] || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mais de 90 dias</p>
                <p className="text-xl font-bold text-red-800">
                  {formatCurrency(agingTotals['>90'] || 0)}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="mt-4 w-full"
              onClick={() => navigate('/reports/aging')}
            >
              Ver Relatório Completo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`${action.color} text-white flex flex-col items-center justify-center h-24 gap-2`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Adicionais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Veículos em Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehiclesMaintenance?.length || 0}</div>
            <Button
              variant="link"
              className="p-0 h-auto mt-1"
              onClick={() => navigate('/maintenance')}
            >
              Ver detalhes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receitas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.receitas_pendentes || 0)}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto mt-1"
              onClick={() => navigate('/financial/receivable?status=pendente')}
            >
              Contas a receber
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.despesas_pendentes || 0)}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto mt-1"
              onClick={() => navigate('/financial/payable?status=pendente')}
            >
              Contas a pagar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
