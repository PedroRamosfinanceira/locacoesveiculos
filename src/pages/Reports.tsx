import { useReports, useCashFlowProjection } from "@/hooks/useReports";
import { useROI } from "@/hooks/useROI";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Download, FileText, BarChart3 } from "lucide-react";
import { AgingReport } from "@/components/financial/AgingReport";

const Reports = () => {
  const { dre, isLoading } = useReports();
  const { data: roiData = [] } = useROI();
  const { data: cashFlowData = [] } = useCashFlowProjection(90);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // DRE já vem do hook
  const dreChartData = dre.data || [];

  // Rentabilidade por Veículo
  const profitabilityData = roiData.map((vehicle) => ({
    name: `${vehicle.placa || 'S/P'}`,
    receitas: vehicle.receitas_mes || 0,
    despesas: vehicle.despesas_mes || 0,
    lucro: vehicle.lucro_mensal || 0,
    roi: vehicle.roi_anual_pct || 0,
  }));

  // Totalizadores DRE
  const totalReceitas = dreChartData.reduce((sum: number, item) => sum + (item.receitas || 0), 0);
  const totalDespesas = dreChartData.reduce((sum: number, item) => sum + (item.despesas || 0), 0);
  const totalLucro = totalReceitas - totalDespesas;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatórios Gerenciais</h1>
            <CardDescription className="mt-2">
              Análise financeira completa com demonstrativos, projeções e indicadores de desempenho
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dre" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dre">DRE</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="rentabilidade">Rentabilidade</TabsTrigger>
            <TabsTrigger value="aging">Inadimplência</TabsTrigger>
          </TabsList>

          <TabsContent value="dre" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receitas Totais (6 meses)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{formatCurrency(totalReceitas)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas Totais (6 meses)</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{formatCurrency(totalDespesas)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido (6 meses)</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalLucro >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(totalLucro)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Demonstração de Resultado (Últimos 6 Meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dreChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="receitas" fill="hsl(var(--chart-1))" name="Receitas" />
                    <Bar dataKey="despesas" fill="hsl(var(--chart-2))" name="Despesas" />
                    <Bar dataKey="lucro" fill="hsl(var(--chart-3))" name="Lucro Líquido" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fluxo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Caixa Projetado (Próximos 90 Dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Area type="monotone" dataKey="receitas" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" name="Receitas Previstas" />
                    <Area type="monotone" dataKey="despesas" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" name="Despesas Previstas" />
                    <Line type="monotone" dataKey="saldo" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Saldo Projetado" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {cashFlowData.some((item) => item.saldo < 0) && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <TrendingDown className="h-5 w-5" />
                    <span className="font-semibold">ATENÇÃO: Saldo projetado negativo detectado</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Identificados períodos com saldo negativo nos próximos 90 dias. Recomenda-se revisão imediata do planejamento financeiro e ajustes no fluxo de caixa.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rentabilidade" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lucro Mensal por Veículo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={profitabilityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="lucro" fill="hsl(var(--chart-3))" name="Lucro Mensal" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Receitas vs Despesas por Veículo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={profitabilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="receitas" fill="hsl(var(--chart-1))" name="Receitas" />
                      <Bar dataKey="despesas" fill="hsl(var(--chart-2))" name="Despesas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Rentabilidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profitabilityData.map((vehicle, index: number) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{vehicle.name}</p>
                          <p className="text-xs text-muted-foreground">
                            R: {formatCurrency(vehicle.receitas)} | D: {formatCurrency(vehicle.despesas)}
                          </p>
                        </div>
                        <div className={`font-bold ${vehicle.lucro >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(vehicle.lucro)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="aging" className="space-y-4">
            <AgingReport />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
