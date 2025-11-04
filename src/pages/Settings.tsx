/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Building, Plug, Users, Upload, MessageSquare } from 'lucide-react';
import { AsaasIntegration } from '@/components/financial/AsaasIntegration';
import { Integrations } from '@/components/settings/Integrations';
import { UserManagement } from '@/components/settings/UserManagement';
import { MessageTemplates } from '@/components/settings/MessageTemplates';

export default function Settings() {
  const { tenantId, profile, email, isAdmin, isSaasAdmin, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });

  const [tenantData, setTenantData] = useState({
    name: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      setTenantData({ name: data.name });
      setLogoPreview((data as unknown as { logo_url?: string })?.logo_url);
      return data;
    },
    enabled: !!tenantId,
  });

  const updateLogoMutation = useMutation({
    mutationFn: async (data: { logo_url: string }) => {
      const { error } = await supabase
        .from('locacoes_veicular_tenants' as any)
        .update(data)
        .eq('id', tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Logo atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar logo: ' + error.message);
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (data: Partial<{ name: string; cnpj: string; email: string; phone: string; logo_url: string }>) => {
      const { error } = await supabase
        .from('locacoes_veicular_tenants')
        .update(data)
        .eq('id', tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Empresa atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar empresa: ' + error.message);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string; phone?: string }) => {
      const { error } = await supabase
        .from('locacoes_veicular_profiles')
        .update(data)
        .eq('id', profile?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      toast.success('Perfil atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onSuccess: async (logoUrl) => {
      await updateLogoMutation.mutateAsync({ logo_url: logoUrl });
      toast.success('Logo enviada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar logo: ' + error.message);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantData.name) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    updateTenantMutation.mutate({ name: tenantData.name });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências e informações</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Meu Perfil */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Meu Perfil</CardTitle>
              </div>
              <CardDescription>Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={email || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Input value={profile?.role || 'user'} disabled className="bg-muted" />
                </div>
                {profile?.is_saas_admin && (
                  <div className="p-3 bg-primary/10 rounded-md">
                    <p className="text-sm font-medium text-primary">⭐ Administrador SaaS</p>
                  </div>
                )}
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Card 2: Empresa */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Minha Empresa</CardTitle>
              </div>
              <CardDescription>Dados da organização</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTenantSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={tenantData.name}
                    onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                    disabled={!isAdmin && !isSaasAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo da Empresa</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain border rounded"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        disabled={!isAdmin && !isSaasAdmin}
                      />
                      {logoFile && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleLogoUpload}
                          disabled={uploadLogoMutation.isPending}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadLogoMutation.isPending ? 'Enviando...' : 'Enviar Logo'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={tenant?.status || ''} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Data de Criação</Label>
                  <Input
                    value={tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString('pt-BR') : ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {(isAdmin || isSaasAdmin) && (
                  <Button type="submit" disabled={updateTenantMutation.isPending}>
                    {updateTenantMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Card 3: Integrações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-primary" />
                <CardTitle>Integrações</CardTitle>
              </div>
              <CardDescription>APIs e serviços externos</CardDescription>
            </CardHeader>
            <CardContent>
                <Integrations />
              </CardContent>
          </Card>

          {/* Card 4: Templates de Mensagens */}
          {(isAdmin || isSaasAdmin) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle>Templates de Mensagens</CardTitle>
                </div>
                <CardDescription>Configure mensagens personalizadas para envio automático</CardDescription>
              </CardHeader>
              <CardContent>
                <MessageTemplates />
              </CardContent>
            </Card>
          )}

          {/* Card 5: Usuários do Sistema (só para admin) */}
          {(isAdmin || isSaasAdmin) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Usuários do Sistema</CardTitle>
                </div>
                <CardDescription>Gerencie os funcionários que têm acesso ao sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
