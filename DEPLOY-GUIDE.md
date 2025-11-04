# 🚀 Guia de Deploy e Configuração - Sistema Multi-Canal

## 📋 Índice
1. [Migrations do Banco de Dados](#migrations)
2. [Edge Functions (Supabase)](#edge-functions)
3. [Variáveis de Ambiente](#variaveis-ambiente)
4. [Testes](#testes)
5. [Instruções SaaS para Clientes](#saas)

---

## 1. Migrations do Banco de Dados {#migrations}

### Aplicar Migrations

Execute as migrations na seguinte ordem:

```bash
# 1. Migration de Integrações (tabelas principais)
supabase migration up 20251105120000_create_tenant_integrations.sql

# 2. Migration de Logs de Notificações
supabase migration up 20251105130000_create_notification_logs.sql

# 3. Migration de IA de Previsões (se ainda não aplicada)
supabase migration up 20251104050000_ai_payment_predictions.sql
```

### Verificar Migrations

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'locacoes_veicular_%integrations%';

-- Deve retornar:
-- locacoes_veicular_integrations
-- locacoes_veicular_integration_templates
-- locacoes_veicular_notification_logs
```

### Regenerar Types do Supabase

Após aplicar as migrations, regenere os tipos TypeScript:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

---

## 2. Edge Functions (Supabase) {#edge-functions}

### Funções Criadas

1. **upsert-tenant-integration** - Salva integrações com chaves criptografadas
2. **send-notification** - Envia notificações multi-canal (WhatsApp/Email/SMS)
3. **create-tenant-user** - Cria usuários (já existente, atualizado para suportar 'owner')

### Deploy das Functions

```bash
# Deploy individual
supabase functions deploy upsert-tenant-integration
supabase functions deploy send-notification

# Ou deploy de todas
supabase functions deploy
```

### Configurar Secrets

As edge functions precisam de variáveis de ambiente. Configure via CLI ou Supabase Dashboard:

```bash
# Via CLI
supabase secrets set INTEGRATION_ENCRYPTION_KEY="sua-chave-super-secreta-32-chars-minimo"

# Verificar secrets
supabase secrets list
```

**⚠️ IMPORTANTE:** A `INTEGRATION_ENCRYPTION_KEY` deve ser:
- Pelo menos 32 caracteres
- Gerada de forma segura (use `openssl rand -base64 32`)
- NUNCA commitada no repositório
- Mesma em todos os ambientes (dev/staging/prod) se quiser compartilhar dados criptografados

---

## 3. Variáveis de Ambiente {#variaveis-ambiente}

### Servidor (Supabase Edge Functions)

Configure estas variáveis no Supabase Dashboard > Settings > Edge Functions > Secrets:

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJh... # sua anon key
SUPABASE_SERVICE_ROLE_KEY=eyJh... # sua service role key (PRIVADA!)
INTEGRATION_ENCRYPTION_KEY=... # chave de 32+ chars para criptografia
```

### Cliente (Frontend - .env.local)

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh... # sua anon key
```

---

## 4. Testes {#testes}

### Testar Integração (via UI)

1. Faça login como admin/owner
2. Vá em **Settings** > **Integrações**
3. Clique em "Adicionar Integração"
4. Preencha:
   - **Provider:** twilio (para WhatsApp/SMS)
   - **Nome:** "WhatsApp Produção"
   - **API Key:** sua chave do Twilio
   - **Config JSON:** 
     ```json
     {
       "account_sid": "ACxxxxxx",
       "from_number": "+5511999999999"
     }
     ```
5. Salvar

### Testar Envio de Notificação (via código/console)

```javascript
// No console do browser (com usuário logado):
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    tenantId: 'seu-tenant-id',
    channel: 'whatsapp',
    recipient: '+5511999998888',
    templateKey: null,
    variables: {
      message: 'Teste de envio via WhatsApp!'
    }
  }
});

console.log({ data, error });
```

### Verificar Logs

```sql
-- Verificar logs de notificações
SELECT * FROM locacoes_veicular_notification_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 5. Instruções SaaS para Clientes {#saas}

### Como o Cliente Configura suas Próprias Integrações

#### Para WhatsApp (via Twilio):

1. Criar conta no [Twilio](https://www.twilio.com/)
2. Obter:
   - **Account SID** (painel principal)
   - **Auth Token** (Settings > API Credentials)
   - **Número WhatsApp** (comprar número com WhatsApp habilitado)
3. No sistema, ir em **Settings > Integrações**
4. Adicionar integração:
   - Provider: `twilio`
   - API Key: `Auth Token`
   - Config JSON:
     ```json
     {
       "account_sid": "ACxxxxxx",
       "from_number": "+5511999999999"
     }
     ```

#### Para SMS (via Twilio):

Mesmo processo do WhatsApp, mas:
- Não precisa de número WhatsApp (qualquer número Twilio serve)
- Na hora de enviar, o sistema usa o canal `sms`

#### Para Email (via SendGrid):

1. Criar conta no [SendGrid](https://sendgrid.com/)
2. Criar API Key (Settings > API Keys)
3. No sistema, adicionar integração:
   - Provider: `sendgrid`
   - API Key: `SG.xxxxxx`
   - Config JSON:
     ```json
     {
       "from_email": "noreply@suaempresa.com",
       "from_name": "Sua Empresa"
     }
     ```

#### Para Pagamentos (Asaas):

1. Criar conta no [Asaas](https://www.asaas.com/)
2. Obter API Key (Config > Integrações > API Key)
3. Adicionar integração:
   - Provider: `asaas`
   - API Key: `$aact_...`
   - Config: vazio ou `{}`

---

## 🔐 Segurança

### Chaves Criptografadas

- Todas as API keys são armazenadas **criptografadas** no banco de dados
- Criptografia AES-GCM server-side
- Descriptografia só acontece nas edge functions (servidor)
- Frontend nunca vê a chave real, só preview mascarado (ex: `****abcd`)

### Permissões

- Apenas **admin** e **owner** podem adicionar/editar integrações
- SaaS Admin pode gerenciar integrações de qualquer tenant
- Usuários comuns não vêem a tela de integrações

---

## 📊 Próximos Passos

1. ✅ Aplicar migrations
2. ✅ Deploy edge functions
3. ✅ Configurar secrets
4. ⏳ Criar templates de mensagens (tabela `locacoes_veicular_integration_templates`)
5. ⏳ Atualizar `daily-routine` para usar as novas integrações
6. ⏳ Criar UI de teste de envio
7. ⏳ Criar scheduler automático (D-3, D-1, D+1, D+7)

---

## ❓ Troubleshooting

### "Server misconfiguration" ao salvar integração

- Verificar se `INTEGRATION_ENCRYPTION_KEY` está configurada
- Verificar se a edge function foi deployada

### "No active integration found"

- Verificar se a integração está marcada como `is_active = true`
- Verificar se o `provider` está correto para o canal

### Erro de criptografia

- Verificar se a mesma `INTEGRATION_ENCRYPTION_KEY` está em todos os ambientes
- Se mudou a chave, precisará re-cadastrar todas as integrações

---

## 📞 Suporte

Para dúvidas:
- Docs do Twilio: https://www.twilio.com/docs/whatsapp
- Docs do SendGrid: https://docs.sendgrid.com/
- Docs do Asaas: https://docs.asaas.com/

---

**Versão:** 2.0  
**Última atualização:** Novembro 2025
