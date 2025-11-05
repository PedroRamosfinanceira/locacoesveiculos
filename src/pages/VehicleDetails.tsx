import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Car, FileText, Wrench, DollarSign, Calendar, MapPin, Gauge } from 'lucide-react';
import { useVehicle, useVehicleContracts, useVehicleMaintenances, useVehicleExpenses } from '@/hooks/useVehicles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  disponivel: 'bg-green-500',
  alugado: 'bg-blue-500',
  manutencao: 'bg-yellow-500',
  vendido: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  disponivel: 'Disponível',
  alugado: 'Alugado',
  manutencao: 'Em Manutenção',
  vendido: 'Vendido',
};

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehicle, isLoading: loadingVehicle } = useVehicle(id);
  const { data: contracts, isLoading: loadingContracts } = useVehicleContracts(id);
  const { data: maintenances, isLoading: loadingMaintenances } = useVehicleMaintenances(id);
  const { data: expenses, isLoading: loadingExpenses } = useVehicleExpenses(id);

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (loadingVehicle) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Car className="h-16 w-16 text-muted-foreground opacity-50" />
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Veículo não encontrado</h2>
            <p className="text-muted-foreground">O veículo solicitado não existe ou foi removido.</p>
          </div>
          <Button onClick={() => navigate('/vehicles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Veículos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  const totalMaintenances = maintenances?.reduce((sum, mnt) => sum + (mnt.cost || 0), 0) || 0;
  const activeContract = contracts?.find(c => c.status === 'ativo');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/vehicles')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{vehicle.brand} {vehicle.model}</h1>
              <p className="text-muted-foreground">Placa: {vehicle.plate} • Ano: {vehicle.year}</p>
            </div>
          </div>
          <Badge className={statusColors[vehicle.status] || 'bg-gray-500'}>
            {statusLabels[vehicle.status] || vehicle.status}
          </Badge>
        </div>

        {/* Informações Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor de Aquisição</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(vehicle.valor_aquisicao_sem_encargos)}</div>
              {vehicle.valor_aquisicao_com_encargos && (
                <p className="text-xs text-muted-foreground">
                  Com encargos: {formatCurrency(vehicle.valor_aquisicao_com_encargos)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                {expenses?.length || 0} transações
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manutenções</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMaintenances)}</div>
              <p className="text-xs text-muted-foreground">
                {maintenances?.length || 0} registros
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {activeContract ? 'Contrato ativo' : 'Sem contrato ativo'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Veículo */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Detalhes do Veículo</CardTitle>
            <CardDescription>Informações técnicas e cadastrais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-medium">{vehicle.brand}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placa</p>
                <p className="font-medium">{vehicle.plate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ano</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cor</p>
                <p className="font-medium">{vehicle.color}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="font-medium capitalize">{vehicle.category}</p>
              </div>
              {vehicle.chassis && (
                <div>
                  <p className="text-sm text-muted-foreground">Chassi</p>
                  <p className="font-medium">{vehicle.chassis}</p>
                </div>
              )}
              {vehicle.renavam && (
                <div>
                  <p className="text-sm text-muted-foreground">RENAVAM</p>
                  <p className="font-medium">{vehicle.renavam}</p>
                </div>
              )}
              {vehicle.km_inicial && (
                <div>
                  <p className="text-sm text-muted-foreground">KM Inicial</p>
                  <p className="font-medium">{vehicle.km_inicial.toLocaleString('pt-BR')}</p>
                </div>
              )}
              {vehicle.km_atual && (
                <div>
                  <p className="text-sm text-muted-foreground">KM Atual</p>
                  <p className="font-medium">{vehicle.km_atual.toLocaleString('pt-BR')}</p>
                </div>
              )}
              {vehicle.data_aquisicao && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Aquisição</p>
                  <p className="font-medium">{formatDate(vehicle.data_aquisicao)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">{formatDate(vehicle.created_at)}</p>
              </div>
            </div>
            {vehicle.observacoes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Observações</p>
                <p className="text-sm">{vehicle.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs de Histórico */}
        <Tabs defaultValue="contracts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contracts">
              <FileText className="mr-2 h-4 w-4" />
              Contratos ({contracts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="maintenances">
              <Wrench className="mr-2 h-4 w-4" />
              Manutenções ({maintenances?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <DollarSign className="mr-2 h-4 w-4" />
              Despesas ({expenses?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-4">
            {loadingContracts ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando contratos...</p>
              </div>
            ) : contracts && contracts.length > 0 ? (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <Card key={contract.id} className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">
                            {contract.client?.name || 'Cliente não encontrado'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(contract.valor_total)}
                            </span>
                          </div>
                        </div>
                        <Badge variant={contract.status === 'ativo' ? 'default' : 'secondary'}>
                          {contract.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card p-12">
                <div className="text-center space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum contrato encontrado</p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maintenances" className="space-y-4">
            {loadingMaintenances ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando manutenções...</p>
              </div>
            ) : maintenances && maintenances.length > 0 ? (
              <div className="space-y-3">
                {maintenances.map((maintenance) => (
                  <Card key={maintenance.id} className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{maintenance.type}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(maintenance.date)}
                            </span>
                            {maintenance.km && (
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3 w-3" />
                                {maintenance.km.toLocaleString('pt-BR')} km
                              </span>
                            )}
                            {maintenance.workshop && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {maintenance.workshop}
                              </span>
                            )}
                          </div>
                          {maintenance.description && (
                            <p className="text-sm text-muted-foreground">{maintenance.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(maintenance.cost)}</p>
                          <Badge variant={maintenance.status === 'concluido' ? 'default' : 'secondary'}>
                            {maintenance.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card p-12">
                <div className="text-center space-y-2">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhuma manutenção encontrada</p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            {loadingExpenses ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando despesas...</p>
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <Card key={expense.id} className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{expense.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Venc: {formatDate(expense.due_date)}
                            </span>
                            {expense.payment_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Pago: {formatDate(expense.payment_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(expense.amount)}</p>
                          <Badge variant={expense.status === 'pago' ? 'default' : 'destructive'}>
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card p-12">
                <div className="text-center space-y-2">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
