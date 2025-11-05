import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, FileText, DollarSign, Calendar, FileSignature, Phone, Mail, MapPin } from 'lucide-react';
import { useClient, useClientContracts, useClientProposals, useClientPayments } from '@/hooks/useClients';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: loadingClient } = useClient(id);
  const { data: contracts, isLoading: loadingContracts } = useClientContracts(id);
  const { data: proposals, isLoading: loadingProposals } = useClientProposals(id);
  const { data: payments, isLoading: loadingPayments } = useClientPayments(id);

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

  const formatCPFCNPJ = (value?: string) => {
    if (!value) return '-';
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 11) {
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (cleanValue.length === 14) {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const formatPhone = (value?: string) => {
    if (!value) return '-';
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 11) {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (cleanValue.length === 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  if (loadingClient) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <User className="h-16 w-16 text-muted-foreground opacity-50" />
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Cliente não encontrado</h2>
            <p className="text-muted-foreground">O cliente solicitado não existe ou foi removido.</p>
          </div>
          <Button onClick={() => navigate('/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalReceived = payments?.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const totalPending = payments?.filter(p => p.status === 'pendente').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const activeContracts = contracts?.filter(c => c.status === 'ativo').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/clients')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <p className="text-muted-foreground">
                {client.is_legal_entity ? 'Pessoa Jurídica' : 'Pessoa Física'} • {formatCPFCNPJ(client.document)}
              </p>
            </div>
          </div>
          <Badge variant={activeContracts > 0 ? 'default' : 'secondary'}>
            {activeContracts > 0 ? `${activeContracts} Contrato(s) Ativo(s)` : 'Sem Contratos Ativos'}
          </Badge>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(totalReceived)}</div>
              <p className="text-xs text-muted-foreground">
                {payments?.filter(p => p.status === 'pago').length || 0} pagamentos
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-muted-foreground">
                {payments?.filter(p => p.status === 'pendente').length || 0} pendentes
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
                {activeContracts} ativos
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propostas</CardTitle>
              <FileSignature className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proposals?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {proposals?.filter(p => p.status === 'pendente').length || 0} pendentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Cliente */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Informações Cadastrais</CardTitle>
            <CardDescription>Dados pessoais e de contato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </p>
                  <p className="font-medium">{client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium">{formatCPFCNPJ(client.document)}</p>
                </div>
                {client.rg && (
                  <div>
                    <p className="text-sm text-muted-foreground">RG</p>
                    <p className="font-medium">{client.rg}</p>
                  </div>
                )}
                {client.birth_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">{formatDate(client.birth_date)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {client.email && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </p>
                    <p className="font-medium">{formatPhone(client.phone)}</p>
                  </div>
                )}
                {client.cnh && (
                  <div>
                    <p className="text-sm text-muted-foreground">CNH</p>
                    <p className="font-medium">{client.cnh}</p>
                  </div>
                )}
                {client.cnh_expiry && (
                  <div>
                    <p className="text-sm text-muted-foreground">Validade CNH</p>
                    <p className="font-medium">{formatDate(client.cnh_expiry)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {client.address && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </p>
                    <p className="font-medium">{client.address}</p>
                    {(client.city || client.state) && (
                      <p className="text-sm text-muted-foreground">
                        {client.city}{client.city && client.state && ' - '}{client.state}
                      </p>
                    )}
                    {client.zip_code && (
                      <p className="text-sm text-muted-foreground">CEP: {client.zip_code}</p>
                    )}
                  </div>
                )}
                {client.profession && (
                  <div>
                    <p className="text-sm text-muted-foreground">Profissão</p>
                    <p className="font-medium">{client.profession}</p>
                  </div>
                )}
              </div>
            </div>

            {client.is_legal_entity && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Dados da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {client.company_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Razão Social</p>
                      <p className="font-medium">{client.company_name}</p>
                    </div>
                  )}
                  {client.state_registration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Inscrição Estadual</p>
                      <p className="font-medium">{client.state_registration}</p>
                    </div>
                  )}
                  {client.municipal_registration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Inscrição Municipal</p>
                      <p className="font-medium">{client.municipal_registration}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {client.observacoes && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-2">Observações</p>
                <p className="text-sm">{client.observacoes}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Cliente desde {formatDate(client.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Histórico */}
        <Tabs defaultValue="contracts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contracts">
              <FileText className="mr-2 h-4 w-4" />
              Contratos ({contracts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="proposals">
              <FileSignature className="mr-2 h-4 w-4" />
              Propostas ({proposals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="mr-2 h-4 w-4" />
              Pagamentos ({payments?.length || 0})
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
                            {contract.vehicle?.brand} {contract.vehicle?.model} - {contract.vehicle?.plate}
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

          <TabsContent value="proposals" className="space-y-4">
            {loadingProposals ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando propostas...</p>
              </div>
            ) : proposals && proposals.length > 0 ? (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <Card key={proposal.id} className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">
                            {proposal.vehicle?.brand} {proposal.vehicle?.model} - {proposal.vehicle?.plate}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(proposal.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(proposal.valor_total)}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            proposal.status === 'aprovada' ? 'default' : 
                            proposal.status === 'rejeitada' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card p-12">
                <div className="text-center space-y-2">
                  <FileSignature className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhuma proposta encontrada</p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {loadingPayments ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando pagamentos...</p>
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id} className="glass-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{payment.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Venc: {formatDate(payment.due_date)}
                            </span>
                            {payment.payment_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Pago: {formatDate(payment.payment_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                          <Badge variant={payment.status === 'pago' ? 'default' : 'destructive'}>
                            {payment.status}
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
                  <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
