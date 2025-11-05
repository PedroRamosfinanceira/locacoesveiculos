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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link, ExternalLink, Send } from 'lucide-react';
import type { IntegrationConfig, IntegrationProvider } from '@/types/billing';

export const Integrations = () => {
  const { profile, tenantId, isAdmin, isSaasAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    provider: IntegrationProvider;
    name: string;
    apiKey: string;
    config: string;
  }>({ provider: 'whatsapp', name: '', apiKey: '', config: '{}' });

  const { data: integrations = [], isLoading } = useQuery<IntegrationConfig[]>({
    queryKey: ['tenant-integrations', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_integrations' as any)
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as IntegrationConfig[];
    },
    enabled: !!profile?.tenant_id && (isAdmin || isSaasAdmin),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      // call the edge function which will encrypt and store the key
      const { data, error } = await supabase.functions.invoke('upsert-tenant-integration', {
        body: {
          provider: payload.provider,
          name: payload.name,
          apiKey: payload.apiKey,
          config: JSON.parse(payload.config || '{}'),
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-integrations'] });
      setOpen(false);
      toast.success('Integração salva com sucesso');
      setForm({ provider: 'whatsapp', name: '', apiKey: '', config: '{}' });
    },
    onError: (err: Error) => {
      toast.error('Erro ao salvar integração: ' + (err?.message || String(err)));
    },
  });

  const testMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const integration = integrations.find(i => i.id === integrationId);
      if (!integration) throw new Error('Integração não encontrada');

      // Test by sending a notification via the send-notification edge function
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          tenantId: profile?.tenant_id,
          provider: integration.provider,
          channel: integration.provider === 'asaas' ? 'email' : integration.provider, // map provider to channel
          to: profile?.phone || profile?.email || 'test@example.com', // fallback to user contact
          message: `Teste de integração ${integration.name || integration.provider}.\n\nSe você recebeu esta mensagem, a integração está funcionando corretamente.`,
          templateType: 'test',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Mensagem de teste enviada com sucesso. Verifique seu WhatsApp/Email/SMS.');
    },
    onError: (err: Error) => {
      toast.error('Erro ao testar integração: ' + (err?.message || String(err)));
    },
  });

  if (!isAdmin && !isSaasAdmin) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Integrações</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>Adicionar Integração</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar / Atualizar Integração</DialogTitle>
              <DialogDescription>Configure um provedor (WhatsApp, SMS, Email, Asaas etc.) para este tenant.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v: IntegrationProvider) => setForm({ ...form, provider: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="twilio">Twilio (SMS/Whatsapp)</SelectItem>
                    <SelectItem value="sendgrid">SendGrid (Email)</SelectItem>
                    <SelectItem value="asaas">Asaas (Cobrança)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: (e.target as HTMLInputElement).value })} />
              </div>

              <div>
                <Label>API Key / Token</Label>
                <Input value={form.apiKey} onChange={e => setForm({ ...form, apiKey: (e.target as HTMLInputElement).value })} placeholder="Insira a chave (será armazenada criptografada)" />
                <p className="text-xs text-muted-foreground mt-1">A chave será enviada de forma segura para o servidor e armazenada criptografada. Só será exibido um preview mascarado.</p>
              </div>

              <div>
                <Label>Config JSON (opcional)</Label>
                <Input value={form.config} onChange={e => setForm({ ...form, config: (e.target as HTMLInputElement).value })} placeholder='{"from":"+55..."}' />
                <p className="text-xs text-muted-foreground mt-1">Configuração livre em JSON para parâmetros do provedor.</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Salvando...' : 'Salvar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Carregando integrações...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((it) => (
            <Card key={it.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">{it.name || it.provider}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Provider: {it.provider}</p>
                <p className="text-sm text-muted-foreground">Status: {it.is_active ? 'Ativa' : 'Inativa'}</p>
                <p className="text-sm text-muted-foreground">Preview chave: {it.api_key_preview || '—'}</p>
                <div className="mt-4 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(it.config || {}))}
                  >
                    Copiar config
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={() => testMutation.mutate(it.id)}
                    disabled={testMutation.isPending || !it.is_active}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {testMutation.isPending ? 'Enviando...' : 'Testar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {integrations.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">Nenhuma integração configurada ainda.</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
