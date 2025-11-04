import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Maintenance {
  id: string;
  vehicle_id: string;
  type: string;
  description: string;
  cost: number;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  notes: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
}

const Maintenance = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    type: "preventiva",
    description: "",
    cost: "",
    scheduled_date: "",
    notes: "",
  });

  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ["maintenances", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes_veicular_maintenances")
        .select(`
          *,
          vehicle:locacoes_veicular_vehicles(id, brand, model, plate)
        `)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles-for-maintenance", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes_veicular_vehicles")
        .select("id, brand, model, plate")
        .in("status", ["disponivel", "alugado"]);

      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!profile?.tenant_id,
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("locacoes_veicular_maintenances").insert({
        tenant_id: profile?.tenant_id,
        vehicle_id: data.vehicle_id,
        type: data.type,
        description: data.description,
        cost: parseFloat(data.cost),
        scheduled_date: data.scheduled_date,
        notes: data.notes,
        status: "agendada",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      toast({ title: "Manutenção agendada com sucesso" });
      setIsDialogOpen(false);
      setFormData({
        vehicle_id: "",
        type: "preventiva",
        description: "",
        cost: "",
        scheduled_date: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao agendar manutenção", description: error.message, variant: "destructive" });
    },
  });

  const completeMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceId: string) => {
      const maintenance = maintenances.find((m: any) => m.id === maintenanceId);
      
      // Atualizar status da manutenção
      const { error: updateError } = await supabase
        .from("locacoes_veicular_maintenances")
        .update({ status: "concluida", completed_at: new Date().toISOString() })
        .eq("id", maintenanceId);

      if (updateError) throw updateError;

      // Gerar despesa na transação
      if (maintenance?.cost) {
        const { error: txError } = await supabase.from("locacoes_veicular_transactions").insert({
          tenant_id: profile?.tenant_id,
          vehicle_id: maintenance.vehicle_id,
          type: "despesa",
          description: `[MANUTENÇÃO] ${maintenance.description}`,
          amount: maintenance.cost,
          due_date: new Date().toISOString().split('T')[0],
          status: "pago",
          paid_at: new Date().toISOString().split('T')[0],
        });

        if (txError) throw txError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      queryClient.invalidateQueries({ queryKey: ["receitas"] });
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast({ title: "Manutenção concluída e despesa registrada" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao concluir manutenção", description: error.message, variant: "destructive" });
    },
  });

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

  const pendingMaintenances = maintenances.filter((m: any) => m.status === "agendada" || m.status === "em_andamento");
  const completedMaintenances = maintenances.filter((m: any) => m.status === "concluida");

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
                <Button onClick={() => createMaintenanceMutation.mutate(formData)} disabled={createMaintenanceMutation.isPending}>
                  Agendar Manutenção
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manutenções Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingMaintenances.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas Este Mês</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedMaintenances.filter((m: any) => 
                  new Date(m.completed_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total (Mês)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  completedMaintenances
                    .filter((m: any) => new Date(m.completed_at).getMonth() === new Date().getMonth())
                    .reduce((sum: number, m: any) => sum + (m.cost || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Manutenções Agendadas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingMaintenances.map((maintenance: any) => (
              <Card key={maintenance.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {maintenance.vehicle.brand} {maintenance.vehicle.model}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{maintenance.vehicle.plate}</p>
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
                  {maintenance.status === "agendada" && (
                    <Button
                      className="w-full mt-4"
                      size="sm"
                      onClick={() => completeMaintenanceMutation.mutate(maintenance.id)}
                      disabled={completeMaintenanceMutation.isPending}
                    >
                      Marcar como Concluída
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {pendingMaintenances.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma manutenção pendente
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Histórico de Manutenções</h2>
          <div className="space-y-2">
            {completedMaintenances.slice(0, 10).map((maintenance: any) => (
              <Card key={maintenance.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {maintenance.vehicle.brand} {maintenance.vehicle.model} - {maintenance.vehicle.plate}
                      </p>
                      <p className="text-sm text-muted-foreground">{maintenance.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Concluída em {formatDate(maintenance.completed_at)}
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Maintenance;
