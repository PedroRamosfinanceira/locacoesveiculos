/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Edit, UserX, Shield } from 'lucide-react';

const PERMISSIONS = {
  'Dashboard': ['view_dashboard'],
  'Veículos': ['view_vehicles', 'create_vehicle', 'edit_vehicle', 'delete_vehicle'],
  'Clientes': ['view_clients', 'create_client', 'edit_client', 'delete_client'],
  'Contratos': ['view_contracts', 'create_contract', 'edit_contract', 'delete_contract'],
  'Financeiro': ['view_financial', 'create_transaction', 'edit_transaction', 'delete_transaction'],
  'ROI': ['view_roi'],
  'Configurações': ['view_settings', 'manage_users', 'manage_integrations'],
};

const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: 'Visualizar',
  view_vehicles: 'Visualizar',
  create_vehicle: 'Criar',
  edit_vehicle: 'Editar',
  delete_vehicle: 'Excluir',
  view_clients: 'Visualizar',
  create_client: 'Criar',
  edit_client: 'Editar',
  delete_client: 'Excluir',
  view_contracts: 'Visualizar',
  create_contract: 'Criar',
  edit_contract: 'Editar',
  delete_contract: 'Excluir',
  view_financial: 'Visualizar',
  create_transaction: 'Criar',
  edit_transaction: 'Editar',
  delete_transaction: 'Excluir',
  view_roi: 'Visualizar',
  view_settings: 'Visualizar',
  manage_users: 'Gerenciar Usuários',
  manage_integrations: 'Gerenciar Integrações',
};

export function UserManagement() {
  const { tenantId, isAdmin, isSaasAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    role: 'user',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_profiles')
        .select(`
          id,
          name,
          phone,
          is_active,
          created_at,
          locacoes_veicular_user_roles!inner(role)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar emails do auth.users
      const userIds = data?.map(u => u.id) || [];
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const emailMap = new Map(
        (authUsers?.users || []).map((u: any) => [u.id, u.email || 'N/A'])
      );

      return data?.map(user => ({
        ...user,
        email: emailMap.get(user.id) || 'N/A',
        role: (user.locacoes_veicular_user_roles as any)?.[0]?.role || 'user',
      })) || [];
    },
    enabled: !!tenantId && (isAdmin || isSaasAdmin),
  });

  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', editUserId, tenantId],
    queryFn: async () => {
      if (!editUserId) return [];
      const { data } = await supabase
        .from('locacoes_veicular_user_permissions' as any)
        .select('permission')
        .eq('user_id', editUserId)
        .eq('tenant_id', tenantId);
      return (data as any)?.map((p: any) => p.permission) || [];
    },
    enabled: !!editUserId && !!tenantId,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.functions.invoke('create-tenant-user', {
        body: {
          ...data,
          tenantId,
          permissions: selectedPermissions,
        },
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      setOpen(false);
      resetForm();
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      // Deletar permissões antigas
      await supabase
        .from('locacoes_veicular_user_permissions' as any)
        .delete()
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);

      // Inserir novas permissões
      if (permissions.length > 0) {
        const { error } = await supabase
          .from('locacoes_veicular_user_permissions' as any)
          .insert(
            permissions.map(permission => ({
              user_id: userId,
              tenant_id: tenantId,
              permission,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      setEditUserId(null);
      setSelectedPermissions([]);
      toast.success('Permissões atualizadas!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar permissões: ' + error.message);
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('locacoes_veicular_profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      toast.success('Usuário desativado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao desativar usuário: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      phone: '',
      password: '',
      role: 'user',
    });
    setSelectedPermissions([]);
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleEditPermissions = (userId: string) => {
    setEditUserId(userId);
    setSelectedPermissions(userPermissions || []);
  };

  const handleSavePermissions = () => {
    if (editUserId) {
      updatePermissionsMutation.mutate({
        userId: editUserId,
        permissions: selectedPermissions,
      });
    }
  };

  if (!isAdmin && !isSaasAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Gerencie os funcionários que têm acesso ao sistema
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Crie um novo usuário para acessar o sistema
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha Temporária</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={role => setFormData({ ...formData, role })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {/* Allow creating an owner only for SaaS admins (tenant-level owners are powerful) */}
                    {isSaasAdmin && <SelectItem value="owner">Proprietário (Owner)</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base">Permissões</Label>
                {Object.entries(PERMISSIONS).map(([section, perms]) => (
                  <div key={section} className="space-y-2">
                    <p className="text-sm font-medium">{section}</p>
                    <div className="grid grid-cols-2 gap-2 ml-4">
                      {perms.map(perm => (
                        <div key={perm} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm}
                            checked={selectedPermissions.includes(perm)}
                            onCheckedChange={() => handlePermissionToggle(perm)}
                          />
                          <Label htmlFor={perm} className="text-sm font-normal cursor-pointer">
                            {PERMISSION_LABELS[perm]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createUserMutation.mutate(formData)}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando usuários...</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || 'Sem nome'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' || user.role === 'owner' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Administrador' : user.role === 'owner' ? 'Proprietário' : 'Usuário'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleEditPermissions(user.id);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Permissões
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Permissões</DialogTitle>
                            <DialogDescription>
                              Gerencie as permissões de {user.name}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-3">
                            {Object.entries(PERMISSIONS).map(([section, perms]) => (
                              <div key={section} className="space-y-2">
                                <p className="text-sm font-medium">{section}</p>
                                <div className="grid grid-cols-2 gap-2 ml-4">
                                  {perms.map(perm => (
                                    <div key={perm} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`edit-${perm}`}
                                        checked={selectedPermissions.includes(perm)}
                                        onCheckedChange={() => handlePermissionToggle(perm)}
                                      />
                                      <Label
                                        htmlFor={`edit-${perm}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {PERMISSION_LABELS[perm]}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditUserId(null)}>
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleSavePermissions}
                              disabled={updatePermissionsMutation.isPending}
                            >
                              {updatePermissionsMutation.isPending ? 'Salvando...' : 'Salvar'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {user.is_active && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deactivateUserMutation.mutate(user.id)}
                          disabled={deactivateUserMutation.isPending}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Desativar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
