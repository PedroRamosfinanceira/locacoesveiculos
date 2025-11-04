import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Plus, Calendar, DollarSign } from 'lucide-react';

export default function Contracts() {
  const { tenantId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    start_date: '',
    months: 12,
    monthly_value: 0,
  });

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_contracts')
        .select(`
          *,
          client:locacoes_veicular_clients(name),
          vehicle:locacoes_veicular_vehicles(brand, model, plate)
        `)
        .eq('tenant_id', tenantId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: availableVehicles } = useQuery({
    queryKey: ['available-vehicles', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_vehicles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'disponivel');

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && isDialogOpen,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_clients')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && isDialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.rpc(
        'locacoes_veicular_contract_create',
        {
          p_client_id: data.client_id,
          p_vehicle_id: data.vehicle_id,
          p_start_date: data.start_date,
          p_months: data.months,
          p_monthly_value: data.monthly_value,
        }
      );
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['available-vehicles'] });
      toast.success('Contrato criado com sucesso');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar contrato: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      client_id: '',
      vehicle_id: '',
      start_date: '',
      months: 12,
      monthly_value: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const statusColors = {
    ativo: 'bg-green-500/10 text-green-700 dark:text-green-400',
    encerrado: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    cancelado: 'bg-red-500/10 text-red-700 dark:text-red-400',
    draft: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contratos</h1>
            <p className="text-muted-foreground">Gerencie os contratos de locação</p>
          </div>
          
          {hasPermission('create_contract') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Contrato
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Contrato</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Veículo</Label>
                  <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} - {vehicle.plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="months">Duração (meses)</Label>
                  <Input
                    id="months"
                    type="number"
                    min="1"
                    value={formData.months}
                    onChange={(e) => setFormData({ ...formData, months: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_value">Valor Mensal (R$)</Label>
                  <Input
                    id="monthly_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_value}
                    onChange={(e) => setFormData({ ...formData, monthly_value: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Criando...' : 'Criar Contrato'}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando contratos...</div>
        ) : (
          <div className="grid gap-4">
            {contracts?.map((contract: any) => (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{contract.client?.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {contract.vehicle?.brand} {contract.vehicle?.model} - {contract.vehicle?.plate}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[contract.status as keyof typeof statusColors] || ''}`}>
                      {contract.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Início</span>
                      </div>
                      <p className="font-medium">
                        {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Duração</p>
                      <p className="font-medium">{contract.months} meses</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span>Valor Mensal</span>
                      </div>
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(contract.monthly_value || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Valor Total</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format((contract.monthly_value || 0) * contract.months)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && contracts?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum contrato cadastrado</p>
              <p className="text-muted-foreground mb-4">Comece criando seu primeiro contrato</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Contrato
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
