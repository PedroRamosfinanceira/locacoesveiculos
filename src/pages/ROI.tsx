import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Calendar, Target, CheckCircle, XCircle } from 'lucide-react';

export default function ROI() {
  const { tenantId } = useAuth();

  const { data: roiData, isLoading } = useQuery({
    queryKey: ['roi', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_v_roi_frota')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatPayback = (months: number) => {
    if (!months || months === Infinity) return 'N/A';
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    
    if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''} e ${remainingMonths} mês${remainingMonths !== 1 ? 'es' : ''}`;
    }
    return `${remainingMonths} mês${remainingMonths !== 1 ? 'es' : ''}`;
  };

  const totalInvestimento = roiData?.reduce((sum, item) => sum + (item.investimento_inicial || 0), 0) || 0;
  const totalReceitasMes = roiData?.reduce((sum, item) => sum + (item.receitas_mes || 0), 0) || 0;
  const totalDespesasMes = roiData?.reduce((sum, item) => sum + (item.despesas_mes || 0), 0) || 0;
  const totalLucroMensal = totalReceitasMes - totalDespesasMes;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Análise de ROI</h1>
          <p className="text-muted-foreground">Retorno sobre investimento da frota</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalInvestimento)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Soma de todos os veículos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalReceitasMes)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de aluguéis/mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesa Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDespesasMes)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Custos operacionais/mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Mensal</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalLucroMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalLucroMensal)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Receitas - Despesas
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando análise de ROI...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {roiData?.map((item: any) => (
              <Card key={item.vehicle_id} className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {item.brand} {item.model}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{item.plate}</p>
                    </div>
                    {item.lucro_mensal >= 0 ? (
                      <Badge variant="default" className="bg-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Lucrativo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Prejuízo
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Investimento Inicial</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(item.investimento_inicial)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Payback
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatPayback(item.payback_meses)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Receita/mês:</span>
                      <span className="font-medium text-success">
                        {formatCurrency(item.receitas_mes)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Despesa/mês:</span>
                      <span className="font-medium text-destructive">
                        {formatCurrency(item.despesas_mes)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <span className="font-medium">Lucro/mês:</span>
                      <span className={`font-bold ${item.lucro_mensal >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(item.lucro_mensal)}
                      </span>
                    </div>
                  </div>

                  {/* Status do veículo */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Status: <span className="font-medium capitalize">{item.status}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && roiData?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum dado de ROI disponível</p>
              <p className="text-muted-foreground">
                Cadastre veículos e contratos para visualizar a análise de ROI
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
