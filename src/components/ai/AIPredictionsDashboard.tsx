/**
 * AI Payment Predictions Dashboard
 * Shows risk scores, payment predictions, and recommended actions
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Target,
  Zap,
} from 'lucide-react';
import AIPaymentPredictionService from '@/lib/aiPredictionService';

export function AIPredictionsDashboard() {
  const { tenantId } = useAuth();

  // Load predictions
  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['ai-predictions', tenantId],
    queryFn: () => AIPaymentPredictionService.getLatePaymentPredictions(tenantId!),
    enabled: !!tenantId,
  });

  // Load risk scores
  const { data: riskScores, isLoading: loadingRiskScores } = useQuery({
    queryKey: ['ai-risk-scores', tenantId],
    queryFn: () => AIPaymentPredictionService.getAllClientRiskScores(tenantId!),
    enabled: !!tenantId,
  });

  // Load stats
  const { data: stats } = useQuery({
    queryKey: ['ai-prediction-stats', tenantId],
    queryFn: () => AIPaymentPredictionService.getStatistics(tenantId!),
    enabled: !!tenantId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loadingPredictions || loadingRiskScores) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Analisando padrões de pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Predições de Pagamento com IA</h2>
          <p className="text-muted-foreground">
            Análise preditiva e score de risco baseados em Machine Learning
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Próximos</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingPayments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alto Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.highRiskCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes com risco elevado
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(stats?.averageRiskScore || 0)}
            </div>
            <Progress value={(stats?.averageRiskScore || 0) / 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Baixo Risco</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.lowRiskCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Score {'<'} 400</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predictions">Predições de Pagamento</TabsTrigger>
          <TabsTrigger value="risk-scores">Scores de Risco</TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4 mt-6">
          {predictions && predictions.length > 0 ? (
            predictions.map((prediction) => (
              <Card
                key={prediction.transaction_id}
                className={`glass-card hover:scale-[1.01] transition-all ${
                  prediction.risk_score < 500 ? 'border-red-500/30' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{prediction.client_name}</CardTitle>
                        <Badge
                          className={
                            prediction.risk_score >= 700
                              ? 'bg-green-500/10 text-green-700'
                              : prediction.risk_score >= 500
                              ? 'bg-yellow-500/10 text-yellow-700'
                              : prediction.risk_score >= 300
                              ? 'bg-orange-500/10 text-orange-700'
                              : 'bg-red-500/10 text-red-700'
                          }
                        >
                          {AIPaymentPredictionService.getRiskEmoji(
                            prediction.risk_score >= 700
                              ? 'low'
                              : prediction.risk_score >= 500
                              ? 'medium'
                              : prediction.risk_score >= 300
                              ? 'high'
                              : 'critical'
                          )}{' '}
                          Score: {prediction.risk_score}
                        </Badge>
                      </div>
                      <CardDescription>
                        Vencimento: {formatDate(prediction.due_date)} • Valor:{' '}
                        {formatCurrency(prediction.amount)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Confiança</div>
                      <div className="text-xl font-bold">{prediction.confidence}%</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Prediction Details */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Previsão de pagamento:{' '}
                        <strong>{formatDate(prediction.predicted_payment_date)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  {prediction.recommended_actions.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Ações Recomendadas:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prediction.recommended_actions.map((action, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {prediction.risk_score < 500 && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="default">
                        Enviar Lembrete
                      </Button>
                      <Button size="sm" variant="outline">
                        Ver Histórico
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">Sem predições no momento</p>
                <p className="text-sm text-muted-foreground">
                  Nenhuma transação prevista para os próximos 30 dias
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Risk Scores Tab */}
        <TabsContent value="risk-scores" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {riskScores && riskScores.length > 0 ? (
              riskScores.map((client) => (
                <Card
                  key={client.client_id}
                  className={`glass-card ${
                    client.risk_level === 'critical' ? 'border-red-500/30' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{client.client_name}</CardTitle>
                        <CardDescription>
                          Probabilidade de inadimplência: {client.probability_of_default}%
                        </CardDescription>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{client.score}</div>
                        <Badge className={AIPaymentPredictionService.getRiskBadgeColor(client.risk_level)}>
                          {client.risk_level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={client.score / 10} className="h-2" />
                      {client.predicted_delay_days > 0 && (
                        <Alert className="border-orange-500/30">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Atraso previsto: {client.predicted_delay_days} dias
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhum cliente cadastrado</p>
                  <p className="text-sm text-muted-foreground">
                    Cadastre clientes para visualizar scores de risco
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
