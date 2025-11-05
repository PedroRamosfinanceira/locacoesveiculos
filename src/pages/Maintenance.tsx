import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useMaintenances,
  useScheduledMaintenances,
  useOverdueMaintenances,
  useCreateMaintenance,
  useCompleteMaintenance,
  useCancelMaintenance,
} from "@/hooks/useMaintenance";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wrench, Calendar, AlertCircle, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
}

const Maintenance = () => {
  const { hasPermission } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [formData, setFormData] = useState({
    vehicle_id: "",
    type: "preventiva" as "preventiva" | "corretiva" | "inspecao" | "recall",
    description: "",
    cost: 0,
    scheduled_date: "",
    notes: "",
  });

  const { data: maintenances = [], isLoading } = useMaintenances();
  const { data: scheduledMaintenances = [] } = useScheduledMaintenances();
  const { data: overdueMaintenances = [] } = useOverdueMaintenances();
  const createMutation = useCreateMaintenance();
  const completeMutation = useCompleteMaintenance();
  const cancelMutation = useCancelMaintenance();

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles-for-maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes_veicular_vehicles")
        .select("id, brand, model, plate")
        .in("status", ["disponivel", "alugado", "manutencao"]);

      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          vehicle_id: "",
          type: "preventiva",
          description: "",
          cost: 0,
          scheduled_date: "",
          notes: "",
        });
      },
    });
  };

  const handleComplete = (maintenanceId: string) => {
    completeMutation.mutate({ id: maintenanceId });
  };

  const handleCancel = (maintenanceId: string) => {
    cancelMutation.mutate(maintenanceId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      agendada: { label: "Agendada", variant: "default" },
      em_andamento: { label: "Em Andamento", variant: "secondary" },
      concluida: { label: "Concluída", variant: "default" },
      cancelada: { label: "Cancelada", variant: "destructive" },
    };
    const config = variants[status] || variants.agendada;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const pendingMaintenances = maintenances.filter(m => m.status === "agendada" || m.status === "em_andamento");
  const completedMaintenances = maintenances.filter(m => m.status === "concluida");
  const thisMonth = new Date().getMonth();
  const completedThisMonth = completedMaintenances.filter(m => 
    m.completed_at && new Date(m.completed_at).getMonth() === thisMonth
  );
  const totalCostThisMonth = completedThisMonth.reduce((sum, m) => sum + (m.cost || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manutenções</h1>
            <p className="text-muted-foreground">Gerencie a manutenção preventiva e corretiva da frota</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agendar Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agendar Nova Manutenção</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Veículo</Label>
                  <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} - {vehicle.plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                      <SelectItem value="corretiva">Corretiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Troca de óleo e filtro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Custo Estimado</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Data Agendada</Label>
                    <Input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                  />
                </div>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Agendando...' : 'Agendar Manutenção'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manutenções Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingMaintenances.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueMaintenances.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas (Mês)</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedThisMonth.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total (Mês)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCostThisMonth)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
            <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {scheduledMaintenances.map((maintenance) => (
                <Card key={maintenance.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {maintenance.vehicle?.brand} {maintenance.vehicle?.model}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{maintenance.vehicle?.plate}</p>
                      </div>
                      {getStatusBadge(maintenance.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Tipo:</span>
                      <Badge variant="outline">{maintenance.type}</Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Descrição:</span>
                      <p className="text-muted-foreground">{maintenance.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Custo Estimado:</span>
                      <span>{formatCurrency(maintenance.cost || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Data Agendada:</span>
                      <span>{formatDate(maintenance.scheduled_date)}</span>
                    </div>
                    {maintenance.status === "agendada" && hasPermission('maintenance_write') && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          className="flex-1"
                          size="sm"
                          onClick={() => handleComplete(maintenance.id)}
                          disabled={completeMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Concluir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(maintenance.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {scheduledMaintenances.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>Nenhuma manutenção agendada</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {overdueMaintenances.map((maintenance) => (
                <Card key={maintenance.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {maintenance.vehicle?.brand} {maintenance.vehicle?.model}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{maintenance.vehicle?.plate}</p>
                      </div>
                      <Badge variant="destructive">Atrasada</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Tipo:</span>
                      <Badge variant="outline">{maintenance.type}</Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Descrição:</span>
                      <p className="text-muted-foreground">{maintenance.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Custo Estimado:</span>
                      <span>{formatCurrency(maintenance.cost || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Deveria ter sido em:</span>
                      <span className="text-red-600 font-medium">{formatDate(maintenance.scheduled_date)}</span>
                    </div>
                    {hasPermission('maintenance_write') && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          className="flex-1"
                          size="sm"
                          onClick={() => handleComplete(maintenance.id)}
                          disabled={completeMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Concluir Agora
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(maintenance.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {overdueMaintenances.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p>Nenhuma manutenção atrasada!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="space-y-2">
              {completedMaintenances.slice(0, 20).map((maintenance) => (
                <Card key={maintenance.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {maintenance.vehicle?.brand} {maintenance.vehicle?.model} - {maintenance.vehicle?.plate}
                        </p>
                        <p className="text-sm text-muted-foreground">{maintenance.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Concluída em {maintenance.completed_at && formatDate(maintenance.completed_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(maintenance.cost || 0)}</p>
                        <Badge variant="outline" className="mt-1">{maintenance.type}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {completedMaintenances.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>Nenhuma manutenção concluída ainda</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Maintenance;
