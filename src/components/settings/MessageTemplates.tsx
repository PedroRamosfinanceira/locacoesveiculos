/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquare, Mail, Phone, Plus, Pencil, Trash2, Eye } from 'lucide-react';

interface MessageTemplate {
  id: string;
  tenant_id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  template_key: string;
  subject?: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

const TEMPLATE_KEYS = [
  { value: 'payment_reminder_3days', label: 'Lembrete D-3 (3 dias antes)' },
  { value: 'payment_reminder_1day', label: 'Lembrete D-1 (1 dia antes)' },
  { value: 'payment_overdue_1day', label: 'Atraso D+1 (1 dia após)' },
  { value: 'payment_overdue_7days', label: 'Atraso D+7 (7 dias após)' },
  { value: 'payment_confirmation', label: 'Confirmação de Pagamento' },
  { value: 'contract_created', label: 'Contrato Criado' },
  { value: 'contract_ending', label: 'Contrato Vencendo' },
  { value: 'maintenance_scheduled', label: 'Manutenção Agendada' },
];

const AVAILABLE_VARIABLES = [
  '{{client_name}}',
  '{{amount}}',
  '{{due_date}}',
  '{{days}}',
  '{{contract_number}}',
  '{{vehicle_plate}}',
  '{{company_name}}',
];

export function MessageTemplates() {
  const { tenantId, isAdmin, isSaasAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState<{
    channel: 'whatsapp' | 'sms' | 'email';
    template_key: string;
    subject: string;
    body: string;
  }>({
    channel: 'whatsapp',
    template_key: 'payment_reminder_3days',
    subject: '',
    body: '',
  });

  // Query templates
  const { data: templates = [], isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ['message-templates', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_integration_templates' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as MessageTemplate[];
    },
    enabled: !!tenantId && (isAdmin || isSaasAdmin),
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      // Extract variables from body
      const variableMatches = payload.body.match(/\{\{([^}]+)\}\}/g) || [];
      const variables = variableMatches.map((v) => v.replace(/\{\{|\}\}/g, ''));

      const data: any = {
        tenant_id: tenantId,
        channel: payload.channel,
        template_key: payload.template_key,
        subject: payload.subject || null,
        body: payload.body,
        variables,
        is_active: true,
      };

      if (payload.id) {
        // Update
        const { error } = await supabase
          .from('locacoes_veicular_integration_templates' as any)
          .update(data)
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('locacoes_veicular_integration_templates' as any)
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      setOpen(false);
      setEditingTemplate(null);
      setForm({
        channel: 'whatsapp',
        template_key: 'payment_reminder_3days',
        subject: '',
        body: '',
      });
      toast.success('Template salvo com sucesso');
    },
    onError: (err: Error) => {
      toast.error('Erro ao salvar template: ' + err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locacoes_veicular_integration_templates' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template removido com sucesso');
    },
    onError: (err: Error) => {
      toast.error('Erro ao remover template: ' + err.message);
    },
  });

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setForm({
      channel: template.channel,
      template_key: template.template_key,
      subject: template.subject || '',
      body: template.body,
    });
    setOpen(true);
  };

  const handlePreview = () => {
    let preview = form.body;
    // Replace variables with sample data
    preview = preview.replace(/\{\{client_name\}\}/g, 'João Silva');
    preview = preview.replace(/\{\{amount\}\}/g, 'R$ 1.500,00');
    preview = preview.replace(/\{\{due_date\}\}/g, '15/11/2025');
    preview = preview.replace(/\{\{days\}\}/g, '3');
    preview = preview.replace(/\{\{contract_number\}\}/g, 'CONTR-001');
    preview = preview.replace(/\{\{vehicle_plate\}\}/g, 'ABC-1234');
    preview = preview.replace(/\{\{company_name\}\}/g, 'Capital FleetFlow');
    setPreviewContent(preview);
    setPreviewOpen(true);
  };

  const handleSave = () => {
    saveMutation.mutate({ ...form, id: editingTemplate?.id });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este template?')) {
      deleteMutation.mutate(id);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'email':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'sms':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default:
        return '';
    }
  };

  if (!isAdmin && !isSaasAdmin) return null;

  if (isLoading) {
    return <div className="text-center py-8">Carregando templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Templates de Mensagens</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize as mensagens automáticas enviadas aos clientes
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setForm({
                  channel: 'whatsapp',
                  template_key: 'payment_reminder_3days',
                  subject: '',
                  body: '',
                });
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar' : 'Novo'} Template de Mensagem
              </DialogTitle>
              <DialogDescription>
                Configure mensagens personalizadas para envio automático
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Channel */}
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select
                  value={form.channel}
                  onValueChange={(value: any) => setForm({ ...form, channel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Key */}
              <div className="space-y-2">
                <Label>Tipo de Template</Label>
                <Select
                  value={form.template_key}
                  onValueChange={(value) => setForm({ ...form, template_key: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_KEYS.map((tk) => (
                      <SelectItem key={tk.value} value={tk.value}>
                        {tk.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject (Email only) */}
              {form.channel === 'email' && (
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Assunto do email"
                  />
                </div>
              )}

              {/* Body */}
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Digite a mensagem. Use variáveis como {{client_name}}, {{amount}}, etc."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {/* Available Variables */}
              <div className="space-y-2">
                <Label>Variáveis Disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => {
                        setForm({ ...form, body: form.body + ' ' + variable });
                      }}
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique para inserir na mensagem
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum template cadastrado</p>
              <p className="text-sm text-muted-foreground">
                Crie templates para automatizar suas mensagens
              </p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getChannelColor(template.channel)}`}>
                      {getChannelIcon(template.channel)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {TEMPLATE_KEYS.find((tk) => tk.value === template.template_key)?.label ||
                          template.template_key}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {template.channel}
                        </Badge>
                        {template.subject && (
                          <span className="text-xs">• {template.subject}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-md p-4 font-mono text-sm whitespace-pre-wrap">
                  {template.body.substring(0, 200)}
                  {template.body.length > 200 && '...'}
                </div>
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.variables.map((variable, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview da Mensagem</DialogTitle>
            <DialogDescription>
              Visualização com dados de exemplo
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-md p-4 whitespace-pre-wrap">
            {previewContent}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
