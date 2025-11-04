import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const Reports = () => {
  const { profile } = useAuth();

  const { data: transactions = [] } = useQuery({
    queryKey: ["all-transactions", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes_veicular_transactions")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: roiData = [] } = useQuery({
    queryKey: ["roi-frota", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes_veicular_v_roi_frota")
        .select("*");

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  // DRE (Demonstração de Resultado)
  const dreData = transactions.reduce((acc: any, tx: any) => {
    const month = new Date(tx.due_date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (!acc[month]) {
      acc[month] = { month, receitas: 0, despesas: 0, lucro: 0 };
    }
    if (tx.status === "pago") {
      if (tx.type === "receita") {
        acc[month].receitas += tx.amount;
      } else {
        acc[month].despesas += tx.amount;
      }
      acc[month].lucro = acc[month].receitas - acc[month].despesas;
    }
    return acc;
  }, {});

  const dreChartData = Object.values(dreData).slice(-6);

  // Fluxo de Caixa Projetado (próximos 90 dias)
  const today = new Date();
  const next90Days = new Date(today);
  next90Days.setDate(today.getDate() + 90);

  const cashFlowData = transactions
    .filter((tx: any) => {
      const dueDate = new Date(tx.due_date);
      return dueDate >= today && dueDate <= next90Days;
    })
    .reduce((acc: any, tx: any) => {
      const date = new Date(tx.due_date).toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
      if (!acc[date]) {
        acc[date] = { date, receitas: 0, despesas: 0, saldo: 0 };
      }
      if (tx.type === "receita") {
        acc[date].receitas += tx.amount;
      } else {
        acc[date].despesas += tx.amount;
      }
      return acc;
    }, {});

  const cashFlowChartData = Object.values(cashFlowData).map((item: any, index, arr) => {
    const prevSaldo = index > 0 ? (arr[index - 1] as any).saldo : 0;
    item.saldo = prevSaldo + item.receitas - item.despesas;
    return item;
  });

  // Rentabilidade por Veículo
  const profitabilityData = roiData.map((vehicle: any) => ({
    name: `${vehicle.plate}`,
    lucro: vehicle.lucro_mensal || 0,
    receitas: vehicle.receitas_mes || 0,
    despesas: vehicle.despesas_mes || 0,
  }));

  // Totalizadores DRE
  const totalReceitas = (dreChartData as any[]).reduce((sum: number, item: any) => sum + (item.receitas || 0), 0);
  const totalDespesas = (dreChartData as any[]).reduce((sum: number, item: any) => sum + (item.despesas || 0), 0);
  const totalLucro = totalReceitas - totalDespesas;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
          <p className="text-muted-foreground">Análises financeiras e projeções</p>
        </div>

        <Tabs defaultValue="dre" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dre">DRE</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="rentabilidade">Rentabilidade</TabsTrigger>
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
                  <AreaChart data={cashFlowChartData}>
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

            {cashFlowChartData.some((item: any) => item.saldo < 0) && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <TrendingDown className="h-5 w-5" />
                    <span className="font-semibold">⚠️ Alerta: Saldo projetado negativo detectado!</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Há períodos com saldo negativo nos próximos 90 dias. Considere ajustar seu fluxo de caixa.
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
                    {profitabilityData.map((vehicle: any, index: number) => (
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
