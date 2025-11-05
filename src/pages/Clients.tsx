import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import type { Client } from '@/hooks/useClients';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, User, Eye } from 'lucide-react';
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
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState('created_at_desc');
  
  const [formData, setFormData] = useState({
    name: '',
    cpf_cnpj: '',
    email: '',
    phone: '',
  });

  const { data: clients, isLoading } = useClients(sortBy);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const resetForm = () => {
    setFormData({
      name: '',
      cpf_cnpj: '',
      email: '',
      phone: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: formData }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingClient(null);
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

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      cpf_cnpj: client.cpf_cnpj,
      email: client.email || '',
      phone: client.phone || '',
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
      'CPF/CNPJ': viewingClient.cpf_cnpj,
      Email: viewingClient.email || '-',
      Telefone: viewingClient.phone || '-',
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
              searchFields={['name', 'email', 'cpf_cnpj']}
              onSelect={handleView}
              placeholder="Buscar cliente..."
              renderItem={(client) => (
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.cpf_cnpj}</div>
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
                      <p className="text-muted-foreground">CPF/CNPJ</p>
                      <p className="font-medium">{client.cpf_cnpj}</p>
                    </div>
                    {client.email && (
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{client.email}</p>
                      </div>
                    )}
                    {client.phone && (
                      <div>
                        <p className="text-muted-foreground">Telefone</p>
                        <p className="font-medium">{client.phone}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
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
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  required
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
