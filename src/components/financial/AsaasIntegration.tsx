import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function AsaasIntegration() {
  const { tenantId } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Informe a API Key do Asaas');
      return;
    }

    if (!tenantId) {
      toast.error('Tenant não encontrado');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('locacoes_veicular_integration_settings')
        .upsert({
          tenant_id: tenantId,
          asaas_api_key: apiKey,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('API Key salva com sucesso');
      setIsConfigured(true);
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Erro ao salvar API Key');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!tenantId) {
      toast.error('Tenant não encontrado');
      return;
    }

    setTesting(true);
    try {
      // Chamar edge function para testar conexão
      const { data, error } = await supabase.functions.invoke('asaas-webhook', {
        body: { action: 'test', tenant_id: tenantId },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Conexão testada com sucesso!');
      } else {
        toast.error('Falha no teste de conexão');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Erro ao testar conexão com Asaas');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Integração Asaas</CardTitle>
            <CardDescription>
              Configure a API Key do Asaas para gerar cobranças automaticamente
            </CardDescription>
          </div>
          {isConfigured && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="asaas-key">API Key Asaas</Label>
          <Input
            id="asaas-key"
            type="password"
            placeholder="$aact_YTU5YTE0M..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Obtenha sua API Key em{' '}
            <a
              href="https://www.asaas.com/config/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Asaas → Integrações → API Key
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveApiKey} disabled={loading || !apiKey.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar API Key
          </Button>

          {isConfigured && (
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar Conexão
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="font-medium mb-2">Como funciona?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Configure a API Key acima</li>
            <li>• Vá em Financeiro e clique em "Gerar Link Asaas" nas contas a receber</li>
            <li>• O sistema criará a cobrança no Asaas automaticamente</li>
            <li>• Você receberá o link de pagamento para enviar ao cliente</li>
            <li>• Pagamentos são atualizados automaticamente via webhook</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
