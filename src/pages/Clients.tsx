import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, User } from 'lucide-react';
import { SortDropdown } from '@/components/common/SortDropdown';
import { SearchDropdown } from '@/components/common/SearchDropdown';
import { ActionButtons } from '@/components/common/ActionButtons';
import { ViewDialog } from '@/components/common/ViewDialog';
import { generateClientPDF } from '@/lib/pdfGenerator';
import { sendClientWhatsApp } from '@/lib/whatsappHelper';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  created_at: string;
}

const sortOptions = [
  { label: 'A-Z (Nome)', value: 'name_asc' },
  { label: 'Z-A (Nome)', value: 'name_desc' },
  { label: 'Data ↑ (Mais antigo)', value: 'created_at_asc' },
  { label: 'Data ↓ (Mais recente)', value: 'created_at_desc' },
];

export default function Clients() {
  const { tenantId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState('created_at_desc');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', tenantId, sortBy],
    queryFn: async () => {
      const [field, direction] = sortBy.split('_');
      const { data, error } = await supabase
        .from('locacoes_veicular_clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order(field, { ascending: direction === 'asc' });
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('locacoes_veicular_clients')
        .insert([{ ...data, tenant_id: tenantId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente cadastrado com sucesso');
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating client:', error);
      toast.error('Erro ao cadastrar cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('locacoes_veicular_clients')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente atualizado com sucesso');
      setDialogOpen(false);
      setEditingClient(null);
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locacoes_veicular_clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente excluído com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      document: client.document,
    });
    setDialogOpen(true);
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  const viewData = useMemo(() => {
    if (!viewingClient) return {};
    return {
      Nome: viewingClient.name,
      Email: viewingClient.email,
      Telefone: viewingClient.phone,
      Documento: viewingClient.document,
      'Criado em': new Date(viewingClient.created_at).toLocaleDateString('pt-BR'),
    };
  }, [viewingClient]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes</p>
          </div>
          <div className="flex gap-2">
            <SearchDropdown
              items={clients || []}
              searchFields={['name', 'email', 'document']}
              onSelect={handleView}
              placeholder="Buscar cliente..."
              renderItem={(client) => (
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.email}</div>
                </div>
              )}
            />
            <SortDropdown value={sortBy} onValueChange={setSortBy} options={sortOptions} />
            {hasPermission('create_client') && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando clientes...</p>
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {client.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Telefone</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Documento</p>
                      <p className="font-medium">{client.document}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <ActionButtons
                      onView={() => handleView(client)}
                      onEdit={() => handleEdit(client)}
                      onDelete={() => handleDelete(client.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card p-12">
            <div className="text-center space-y-4">
              <User className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-lg font-semibold">Nenhum cliente cadastrado</h3>
                <p className="text-muted-foreground">Clique no botão acima para adicionar o primeiro cliente.</p>
              </div>
            </div>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">Documento</Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingClient ? 'Salvar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {viewingClient && (
          <ViewDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            title={viewingClient.name}
            data={viewData}
            onDownloadPDF={() => generateClientPDF(viewingClient)}
            onSendWhatsApp={(phone) => sendClientWhatsApp(viewingClient, phone)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
