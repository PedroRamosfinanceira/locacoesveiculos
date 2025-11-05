import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, FileText, Sparkles, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const ProposalPage = () => {
  const [searchParams] = useSearchParams();
  const { tenantId, user } = useAuth();
  const navigate = useNavigate();
  const [wizardMode, setWizardMode] = useState<'generate' | 'manual' | null>(null);
  const [step, setStep] = useState(1);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>(searchParams.get('client') || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(searchParams.get('vehicle') || '');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [monthlyValue, setMonthlyValue] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentDay, setPaymentDay] = useState<string>('');
  const [observations, setObservations] = useState<string>('');

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ['clients', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Fetch available vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['available-vehicles', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_vehicles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'available')
        .order('model');

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);

  const handleGenerateProposal = async () => {
    if (!tenantId || !user) return;

    if (!selectedClientId || !selectedVehicleId || !startDate || !endDate || !monthlyValue) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios para gerar a proposta.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // TODO: Após criar a migration, descomentar o código de criação de proposta
      toast({
        title: 'Recurso em desenvolvimento',
        description: 'A funcionalidade de propostas será ativada após a migração do banco de dados.',
      });

      // Resetar form
      setWizardMode(null);
      setStep(1);
      setSelectedClientId('');
      setSelectedVehicleId('');
      setStartDate(undefined);
      setEndDate(undefined);
      setMonthlyValue('');
      setPaymentMethod('');
      setPaymentDay('');
      setObservations('');
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: 'Erro ao gerar proposta',
        description: 'Ocorreu um erro ao criar a proposta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Wizard de geração automática
  const renderWizardStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Selecione o Cliente *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Escolha um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.document}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWizardMode(null)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep(2)} disabled={!selectedClientId}>
                Próximo
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicle">Selecione o Veículo *</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Escolha um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedVehicle && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Informações do veículo:</p>
                <p className="text-sm">
                  <strong>Veículo:</strong> {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                </p>
                <p className="text-sm">
                  <strong>Placa:</strong> {selectedVehicle.plate}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} disabled={!selectedVehicleId}>
                Próximo
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data de Término *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={ptBR}
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="monthlyValue">Valor Mensal (R$) *</Label>
              <Input
                id="monthlyValue"
                type="number"
                step="0.01"
                placeholder="2500.00"
                value={monthlyValue}
                onChange={(e) => setMonthlyValue(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentDay">Dia de Pagamento</Label>
                <Input
                  id="paymentDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="5"
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Informações adicionais sobre a proposta..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                onClick={handleGenerateProposal}
                disabled={!startDate || !endDate || !monthlyValue}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Gerar Proposta
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Gestão de Propostas Comerciais
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema integrado para geração e gerenciamento de propostas de locação
          </p>
        </div>

        {!wizardMode && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Card: Gerar Proposta Automaticamente */}
            <Card
              className="cursor-pointer hover:scale-105 transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
              onClick={() => setWizardMode('generate')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Gerar Proposta</CardTitle>
                    <CardDescription>Wizard guiado passo a passo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Utilize o assistente automatizado para criar propostas de forma padronizada e eficiente, seguindo as melhores práticas comerciais.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Processo guiado em etapas sequenciais
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Cálculos e valores sugeridos automaticamente
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Sistema de numeração automática de propostas
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Card: Preencher Manualmente */}
            <Card
              className="cursor-pointer hover:scale-105 transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
              onClick={() => setWizardMode('manual')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Preencher Manual</CardTitle>
                    <CardDescription>Controle total sobre os dados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Modo avançado para preenchimento manual de propostas personalizadas, com controle total sobre todos os parâmetros comerciais.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Controle completo sobre valores e condições
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Campos totalmente customizáveis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Opção de salvar como rascunho
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Wizard de Geração Automática */}
        {wizardMode === 'generate' && (
          <Card className="border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Gerar Proposta Automaticamente - Passo {step} de 3
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Selecione o cliente que receberá a proposta'}
                {step === 2 && 'Escolha o veículo que será locado'}
                {step === 3 && 'Defina as condições da locação'}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderWizardStep()}</CardContent>
          </Card>
        )}

        {/* Form Manual (implementação similar ao wizard) */}
        {wizardMode === 'manual' && (
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Preencher Proposta Manualmente
              </CardTitle>
              <CardDescription>
                Preencha todos os campos necessários para criar a proposta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Formulário manual em desenvolvimento...
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setWizardMode(null)}>
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProposalPage;
