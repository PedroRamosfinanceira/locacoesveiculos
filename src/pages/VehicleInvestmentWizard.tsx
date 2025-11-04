import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Car } from 'lucide-react';

type Step = 1 | 2 | 3;

interface VehicleData {
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  category: string;
  valor_aquisicao_sem_encargos: number;
}

interface AcquisitionData {
  type: 'cash' | 'financing';
  amount?: number;
  financed_amount?: number;
  installments_count?: number;
  installment_value?: number;
  institution?: string;
}

interface ExpensesData {
  ipva: number;
  seguro: number;
  licenciamento: number;
}

export default function VehicleInvestmentWizard() {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vehicleData, setVehicleData] = useState<VehicleData>({
    brand: '',
    model: '',
    plate: '',
    year: new Date().getFullYear(),
    color: '',
    category: 'economico',
    valor_aquisicao_sem_encargos: 0,
  });

  const [acquisitionData, setAcquisitionData] = useState<AcquisitionData>({
    type: 'cash',
    amount: 0,
  });

  const [expensesData, setExpensesData] = useState<ExpensesData>({
    ipva: 0,
    seguro: 0,
    licenciamento: 0,
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!vehicleData.brand || !vehicleData.model || !vehicleData.plate) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
    }
    if (currentStep === 2) {
      if (acquisitionData.type === 'financing') {
        if (!acquisitionData.installments_count || !acquisitionData.installment_value) {
          toast.error('Preencha os dados do financiamento');
          return;
        }
      }
    }
    setCurrentStep((prev) => (prev + 1) as Step);
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_vehicle_with_investment', {
        p_tenant_id: tenantId,
        p_vehicle: vehicleData as any,
        p_acquisition: acquisitionData as any,
        p_expenses: expensesData as any,
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string };
      if (result?.success) {
        toast.success('Veículo cadastrado com sucesso! Parcelas geradas automaticamente.');
        navigate('/vehicles');
      } else {
        throw new Error(result?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      toast.error(error.message || 'Erro ao cadastrar veículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Cadastrar Veículo</h1>
            <p className="text-muted-foreground mt-1">
              Passo {currentStep} de 3
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/vehicles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-smooth ${
                step <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Dados do Veículo */}
        {currentStep === 1 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Dados do Veículo
              </CardTitle>
              <CardDescription>Informe os dados básicos do veículo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={vehicleData.brand}
                    onChange={(e) => setVehicleData({ ...vehicleData, brand: e.target.value })}
                    placeholder="Ex: Toyota"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                    placeholder="Ex: Corolla"
                  />
                </div>
                <div>
                  <Label htmlFor="plate">Placa *</Label>
                  <Input
                    id="plate"
                    value={vehicleData.plate}
                    onChange={(e) => setVehicleData({ ...vehicleData, plate: e.target.value.toUpperCase() })}
                    placeholder="Ex: ABC1D23"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData({ ...vehicleData, year: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    value={vehicleData.color}
                    onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                    placeholder="Ex: Preto"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={vehicleData.category}
                    onValueChange={(value) => setVehicleData({ ...vehicleData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economico">Econômico</SelectItem>
                      <SelectItem value="compacto">Compacto</SelectItem>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="valor">Valor de Aquisição *</Label>
                  <Input
                    id="valor"
                    type="number"
                    value={vehicleData.valor_aquisicao_sem_encargos}
                    onChange={(e) => setVehicleData({ ...vehicleData, valor_aquisicao_sem_encargos: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Forma de Aquisição */}
        {currentStep === 2 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Forma de Aquisição</CardTitle>
              <CardDescription>Como você está adquirindo este veículo?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={acquisitionData.type}
                onValueChange={(value: 'cash' | 'financing') => {
                  setAcquisitionData({ type: value });
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">À Vista</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="financing" id="financing" />
                  <Label htmlFor="financing">Financiamento</Label>
                </div>
              </RadioGroup>

              {acquisitionData.type === 'cash' && (
                <div>
                  <Label htmlFor="amount">Valor Pago</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={acquisitionData.amount}
                    onChange={(e) => setAcquisitionData({ ...acquisitionData, amount: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              )}

              {acquisitionData.type === 'financing' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="institution">Instituição Financeira</Label>
                    <Input
                      id="institution"
                      value={acquisitionData.institution || ''}
                      onChange={(e) => setAcquisitionData({ ...acquisitionData, institution: e.target.value })}
                      placeholder="Ex: Banco Itaú"
                    />
                  </div>
                  <div>
                    <Label htmlFor="financed_amount">Valor Financiado</Label>
                    <Input
                      id="financed_amount"
                      type="number"
                      value={acquisitionData.financed_amount}
                      onChange={(e) => setAcquisitionData({ ...acquisitionData, financed_amount: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="installments">Número de Parcelas</Label>
                      <Input
                        id="installments"
                        type="number"
                        value={acquisitionData.installments_count}
                        onChange={(e) => setAcquisitionData({ ...acquisitionData, installments_count: parseInt(e.target.value) })}
                        placeholder="36"
                      />
                    </div>
                    <div>
                      <Label htmlFor="installment_value">Valor da Parcela</Label>
                      <Input
                        id="installment_value"
                        type="number"
                        value={acquisitionData.installment_value}
                        onChange={(e) => setAcquisitionData({ ...acquisitionData, installment_value: parseFloat(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Despesas Anuais */}
        {currentStep === 3 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Despesas Anuais</CardTitle>
              <CardDescription>Informe as despesas anuais estimadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ipva">IPVA Anual</Label>
                <Input
                  id="ipva"
                  type="number"
                  value={expensesData.ipva}
                  onChange={(e) => setExpensesData({ ...expensesData, ipva: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="seguro">Seguro Anual</Label>
                <Input
                  id="seguro"
                  type="number"
                  value={expensesData.seguro}
                  onChange={(e) => setExpensesData({ ...expensesData, seguro: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="licenciamento">Licenciamento Anual</Label>
                <Input
                  id="licenciamento"
                  type="number"
                  value={expensesData.licenciamento}
                  onChange={(e) => setExpensesData({ ...expensesData, licenciamento: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>

              {/* Resumo */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-2">
                <h3 className="font-semibold text-lg">Resumo do Investimento</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Veículo:</span>
                    <span className="font-medium">{vehicleData.brand} {vehicleData.model} ({vehicleData.plate})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor de Aquisição:</span>
                    <span className="font-medium">{formatCurrency(vehicleData.valor_aquisicao_sem_encargos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forma de Pagamento:</span>
                    <span className="font-medium">
                      {acquisitionData.type === 'cash' ? 'À Vista' : `Financiado em ${acquisitionData.installments_count}x`}
                    </span>
                  </div>
                  {acquisitionData.type === 'financing' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parcelas:</span>
                      <span className="font-medium">
                        {acquisitionData.installments_count}x de {formatCurrency(acquisitionData.installment_value || 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Despesas Anuais:</span>
                    <span className="font-medium">
                      {formatCurrency(expensesData.ipva + expensesData.seguro + expensesData.licenciamento)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Check className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Finalizando...' : 'Finalizar'}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
