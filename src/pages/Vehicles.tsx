import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, VehicleFormData } from '@/hooks/useVehicles';
import type { Vehicle } from '@/hooks/useVehicles';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Car, Eye } from 'lucide-react';
import { SortDropdown } from '@/components/common/SortDropdown';
import { SearchDropdown } from '@/components/common/SearchDropdown';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ViewDialog } from '@/components/common/ViewDialog';
import { generateVehiclePDF } from '@/lib/pdfGenerator';
import { sendVehicleWhatsApp } from '@/lib/whatsappHelper';
import { SellVehicleDialog } from '@/components/vehicles/SellVehicleDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  category: string;
  status: string;
  valor_aquisicao_sem_encargos: number;
  created_at: string;
}

const sortOptions = [
  { label: 'A-Z (Marca)', value: 'brand_asc' },
  { label: 'Z-A (Marca)', value: 'brand_desc' },
  { label: 'A-Z (Modelo)', value: 'model_asc' },
  { label: 'Z-A (Modelo)', value: 'model_desc' },
  { label: 'Data ↑ (Mais antigo)', value: 'created_at_asc' },
  { label: 'Data ↓ (Mais recente)', value: 'created_at_desc' },
];

export default function Vehicles() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [sellingVehicle, setSellingVehicle] = useState<Vehicle | null>(null);
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [activeTab, setActiveTab] = useState('active');
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    plate: '',
    year: new Date().getFullYear(),
    color: '',
    category: 'economico' as const,
    status: 'disponivel',
    valor_aquisicao_sem_encargos: 0,
  });

  const { data: vehicles, isLoading } = useVehicles(sortBy);
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      plate: '',
      year: new Date().getFullYear(),
      color: '',
      category: 'economico' as const,
      status: 'disponivel',
      valor_aquisicao_sem_encargos: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data: formData }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingVehicle(null);
          resetForm();
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        }
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      year: vehicle.year,
      color: vehicle.color,
      category: vehicle.category as string,
      status: vehicle.status,
      valor_aquisicao_sem_encargos: vehicle.valor_aquisicao_sem_encargos,
    });
    setDialogOpen(true);
  };

  const handleView = (vehicle: Vehicle) => {
    setViewingVehicle(vehicle);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const viewData = useMemo(() => {
    if (!viewingVehicle) return {};
    return {
      Marca: viewingVehicle.brand,
      Modelo: viewingVehicle.model,
      Placa: viewingVehicle.plate,
      Ano: viewingVehicle.year,
      Cor: viewingVehicle.color,
      Categoria: viewingVehicle.category,
      Status: viewingVehicle.status,
      'Valor de Aquisição': formatCurrency(viewingVehicle.valor_aquisicao_sem_encargos),
      'Criado em': new Date(viewingVehicle.created_at).toLocaleDateString('pt-BR'),
    };
  }, [viewingVehicle]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Veículos</h1>
            <p className="text-muted-foreground">Gerencie a frota de veículos</p>
          </div>
          <div className="flex gap-2">
            <SearchDropdown
              items={vehicles || []}
              searchFields={['brand', 'model', 'plate']}
              onSelect={handleView}
              placeholder="Buscar veículo..."
              renderItem={(vehicle) => (
                <div>
                  <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                  <div className="text-sm text-muted-foreground">{vehicle.plate}</div>
                </div>
              )}
            />
            <SortDropdown value={sortBy} onValueChange={setSortBy} options={sortOptions} />
            {hasPermission('create_vehicle') && (
              <>
                <Button onClick={() => navigate('/vehicles/new')} variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Veículo (Wizard)
                </Button>
                <Button onClick={() => setDialogOpen(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastro Rápido
                </Button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando veículos...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="sold">Vendidos</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {vehicles && vehicles.filter(v => v.status !== 'vendido').length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vehicles.filter(v => v.status !== 'vendido').map((vehicle) => (
                    <Card key={vehicle.id} className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" />
                            <span>{vehicle.brand} {vehicle.model}</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Placa</p>
                            <p className="font-medium">{vehicle.plate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ano</p>
                            <p className="font-medium">{vehicle.year}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cor</p>
                            <p className="font-medium">{vehicle.color}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium capitalize">{vehicle.status}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Valor de Aquisição</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(vehicle.valor_aquisicao_sem_encargos)}
                          </p>
                        </div>
                        <div className="pt-4 space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Button>
                          <ActionButtons
                            onView={() => handleView(vehicle)}
                            onEdit={() => handleEdit(vehicle)}
                            onDelete={() => handleDelete(vehicle.id)}
                          />
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              setSellingVehicle(vehicle);
                              setSellDialogOpen(true);
                            }}
                          >
                            Vender Veículo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="glass-card p-12">
                  <div className="text-center space-y-4">
                    <Car className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                    <div>
                      <h3 className="text-lg font-semibold">Nenhum veículo ativo</h3>
                      <p className="text-muted-foreground">Clique no botão acima para adicionar o primeiro veículo.</p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sold" className="mt-6">
              {vehicles && vehicles.filter(v => v.status === 'vendido').length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vehicles.filter(v => v.status === 'vendido').map((vehicle) => (
                    <Card key={vehicle.id} className="glass-card opacity-75">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-muted-foreground" />
                            <span>{vehicle.brand} {vehicle.model}</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Placa</p>
                            <p className="font-medium">{vehicle.plate}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ano</p>
                            <p className="font-medium">{vehicle.year}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cor</p>
                            <p className="font-medium">{vehicle.color}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium capitalize text-muted-foreground">Vendido</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Valor de Aquisição</p>
                          <p className="text-lg font-bold text-muted-foreground">
                            {formatCurrency(vehicle.valor_aquisicao_sem_encargos)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="glass-card p-12">
                  <div className="text-center space-y-4">
                    <Car className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                    <div>
                      <h3 className="text-lg font-semibold">Nenhum veículo vendido</h3>
                      <p className="text-muted-foreground">Veículos vendidos aparecerão aqui.</p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa</Label>
                  <Input
                    id="plate"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value: string) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economico">Econômico</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="executivo">Executivo</SelectItem>
                      <SelectItem value="luxo">Luxo</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="alugado">Alugado</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor de Aquisição</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor_aquisicao_sem_encargos}
                    onChange={(e) => setFormData({ ...formData, valor_aquisicao_sem_encargos: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVehicle ? 'Salvar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {viewingVehicle && (
          <ViewDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            title={`${viewingVehicle.brand} ${viewingVehicle.model}`}
            data={viewData}
            onDownloadPDF={() => generateVehiclePDF(viewingVehicle)}
            onSendWhatsApp={(phone) => sendVehicleWhatsApp(viewingVehicle, phone)}
          />
        )}

        {sellingVehicle && (
          <SellVehicleDialog
            vehicle={sellingVehicle}
            isOpen={sellDialogOpen}
            onClose={() => {
              setSellDialogOpen(false);
              setSellingVehicle(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
