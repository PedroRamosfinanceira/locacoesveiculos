# Guia de Implementação - Venda de Veículos com Contas Bancárias

## 📋 Resumo
Esta implementação adiciona:
- ✅ Sistema de contas bancárias
- ✅ Venda de veículos com registro financeiro completo
- ✅ Crédito automático em conta bancária
- ✅ Cancelamento opcional de parcelas pendentes
- ✅ Cálculo automático de lucro/prejuízo

## 🔧 Passo 1: Executar Migration no Supabase

### 1.1 Acesse o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### 1.2 Execute a Migration
1. Copie **TODO O CONTEÚDO** do arquivo:
   ```
   supabase/migrations/20251104180000_sell_vehicle_complete.sql
   ```

2. Cole no SQL Editor do Supabase

3. Clique em **Run** (ou pressione `Ctrl+Enter`)

4. **Resultado esperado:**
   ```
   Success. No rows returned
   ```

### 1.3 Verifique a Instalação
Execute este SQL para confirmar:

```sql
-- Verificar tabela de contas bancárias
SELECT COUNT(*) as contas FROM locacoes_veicular_bank_accounts;

-- Verificar função de venda
SELECT proname FROM pg_proc WHERE proname = 'sell_vehicle_complete';

-- Resultado esperado:
-- contas: 0 (tabela vazia mas criada)
-- proname: sell_vehicle_complete
```

## 🏦 Passo 2: Criar Contas Bancárias Padrão

### 2.1 Encontre seu Tenant ID
```sql
SELECT id, name FROM tenants;
```

### 2.2 Crie as Contas Padrão
**Substitua `SEU_TENANT_ID_AQUI` pelo ID encontrado acima:**

```sql
SELECT create_default_bank_accounts('SEU_TENANT_ID_AQUI');
```

### 2.3 Verifique as Contas Criadas
```sql
SELECT 
  name,
  bank_name,
  account_type,
  balance,
  is_active
FROM locacoes_veicular_bank_accounts
WHERE tenant_id = 'SEU_TENANT_ID_AQUI';
```

**Resultado esperado (3 contas):**
```
name              | bank_name | account_type | balance | is_active
------------------+-----------+--------------+---------+----------
Conta Corrente    | NULL      | corrente     | 0.00    | true
Poupança          | NULL      | poupanca     | 0.00    | true
Caixa             | NULL      | corrente     | 0.00    | true
```

## 🎨 Passo 3: Atualizar Interface (Frontend)

### 3.1 Backup do arquivo atual
```powershell
Copy-Item "src\components\vehicles\SellVehicleDialog.tsx" "src\components\vehicles\SellVehicleDialog.tsx.bak"
```

### 3.2 Substituir o conteúdo
Abra o arquivo:
```
src/components/vehicles/SellVehicleDialog.tsx
```

**Substitua TODO O CONTEÚDO** por:

```tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Trash2, Building2 } from "lucide-react";

interface SellVehicleDialogProps {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    valor_aquisicao_sem_encargos: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const SellVehicleDialog = ({ vehicle, isOpen, onClose }: SellVehicleDialogProps) => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [saleValue, setSaleValue] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [cancelInstallments, setCancelInstallments] = useState(false);

  // Buscar contas bancárias
  const { data: bankAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['bank-accounts', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_bank_accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && isOpen,
  });

  // Buscar parcelas pendentes
  const { data: pendingInstallments } = useQuery({
    queryKey: ['pending-installments', vehicle.id, saleDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('type', 'despesa')
        .eq('status', 'pendente')
        .gt('due_date', saleDate)
        .order('due_date');

      if (error) throw error;
      return data;
    },
    enabled: !!vehicle.id && isOpen,
  });

  const sellMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("sell_vehicle_complete", {
        p_vehicle_id: vehicle.id,
        p_sale_value: parseFloat(saleValue),
        p_sale_date: saleDate,
        p_bank_account_id: bankAccountId && bankAccountId !== 'none' ? bankAccountId : null,
        p_cancel_pending_installments: cancelInstallments,
      });

      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      return result;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      
      toast.success("Veículo vendido com sucesso!", {
        description: data.message,
      });
      
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Erro ao vender veículo", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setSaleValue("");
    setSaleDate(new Date().toISOString().split('T')[0]);
    setBankAccountId("");
    setCancelInstallments(false);
  };

  const estimatedGainLoss = saleValue 
    ? parseFloat(saleValue) - (vehicle.valor_aquisicao_sem_encargos || 0)
    : 0;

  const isProfit = estimatedGainLoss > 0;
  const totalPendingInstallments = pendingInstallments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const selectedAccount = bankAccounts?.find(acc => acc.id === bankAccountId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vender Veículo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Informações do Veículo */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="font-semibold text-lg">{vehicle.brand} {vehicle.model}</p>
            <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
          </div>

          {/* Resumo Financeiro */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Resumo Financeiro</h3>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor de Aquisição:</span>
              <span className="font-semibold">
                R$ {(vehicle.valor_aquisicao_sem_encargos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {saleValue && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor de Venda:</span>
                  <span className="font-semibold">
                    R$ {parseFloat(saleValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="font-medium">Resultado:</span>
                  <div className="flex items-center gap-2">
                    {isProfit ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {isProfit ? 'Lucro' : 'Prejuízo'}: R$ {Math.abs(estimatedGainLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Formulário de Venda */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saleValue">Valor de Venda *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="saleValue"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={saleValue}
                  onChange={(e) => setSaleValue(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saleDate">Data da Venda *</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
          </div>

          {/* Seleção de Conta Bancária */}
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Conta Bancária</Label>
            <Select 
              value={bankAccountId} 
              onValueChange={setBankAccountId}
              disabled={loadingAccounts}
            >
              <SelectTrigger id="bankAccount">
                <SelectValue placeholder={loadingAccounts ? "Carregando contas..." : "Selecione a conta para receber o valor"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não creditar em conta bancária</SelectItem>
                {bankAccounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{account.name}</span>
                      {account.bank_name && (
                        <span className="text-muted-foreground text-xs">- {account.bank_name}</span>
                      )}
                      <span className="text-muted-foreground text-xs ml-auto">
                        Saldo: R$ {(account.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-xs text-muted-foreground">
                Novo saldo: R$ {((selectedAccount.balance || 0) + parseFloat(saleValue || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Alerta de Parcelas Pendentes */}
          {pendingInstallments && pendingInstallments.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    Existem {pendingInstallments.length} parcela(s) pendente(s) após a data de venda
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: R$ {totalPendingInstallments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="cancelInstallments"
                      checked={cancelInstallments}
                      onCheckedChange={(checked) => setCancelInstallments(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label 
                        htmlFor="cancelInstallments" 
                        className="text-sm font-normal cursor-pointer flex items-center gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir parcelas pendentes após a venda
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        As parcelas com vencimento posterior à data de venda serão removidas
                      </p>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Aviso se não houver contas bancárias */}
          {!loadingAccounts && (!bankAccounts || bankAccounts.length === 0) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Nenhuma conta bancária cadastrada. O valor da venda será registrado como receita mas não será creditado automaticamente em nenhuma conta.
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={sellMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => sellMutation.mutate()}
              disabled={!saleValue || sellMutation.isPending}
              className="flex-1"
            >
              {sellMutation.isPending ? "Processando venda..." : "Confirmar Venda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

## ✅ Passo 4: Testar a Implementação

### 4.1 Preparar Ambiente de Teste
1. Certifique-se de ter pelo menos 1 veículo cadastrado
2. Verifique que as contas bancárias foram criadas (Passo 2.3)

### 4.2 Executar Teste de Venda

**Cenário 1: Venda simples sem parcelas**
1. Vá para página de Veículos
2. Clique em "Vender Veículo" em qualquer veículo
3. Preencha:
   - Valor de Venda: R$ 50.000,00
   - Data: hoje
   - Conta: Conta Corrente
4. Clique em "Confirmar Venda"
5. **Resultado esperado:**
   - Toast de sucesso
   - Veículo com status "vendido"
   - Receita criada no financeiro
   - Saldo da Conta Corrente aumentou

**Cenário 2: Venda com parcelas pendentes**
1. Tenha um veículo com parcelas pendentes (use aquisição parcelada)
2. Click em "Vender Veículo"
3. Preencha os dados
4. **Verifique:** Alerta amarelo mostrando parcelas pendentes
5. Marque "Excluir parcelas pendentes após a venda"
6. Confirme
7. **Resultado esperado:**
   - Venda concluída
   - Parcelas futuras excluídas
   - Lucro/prejuízo calculado

### 4.3 Validar Dados no Banco

```sql
-- Ver transação de venda
SELECT 
  type,
  description,
  amount,
  status,
  bank_account_id
FROM locacoes_veicular_transactions
WHERE vehicle_id = 'ID_DO_VEICULO_VENDIDO'
ORDER BY created_at DESC
LIMIT 5;

-- Ver saldo atualizado da conta
SELECT 
  name,
  balance
FROM locacoes_veicular_bank_accounts
WHERE id = 'ID_DA_CONTA_SELECIONADA';

-- Ver status do veículo
SELECT 
  plate,
  status
FROM locacoes_veicular_vehicles
WHERE id = 'ID_DO_VEICULO_VENDIDO';
```

## 🎯 O que foi Implementado

### Tabela: `locacoes_veicular_bank_accounts`
- **Campos:**
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK → tenants)
  - `name` (TEXT) - Nome da conta
  - `bank_name` (TEXT, opcional) - Nome do banco
  - `account_type` (TEXT) - 'corrente', 'poupanca', 'investimento'
  - `balance` (NUMERIC) - Saldo atual
  - `is_active` (BOOLEAN) - Conta ativa?
  - `created_at`, `updated_at`

### Função: `sell_vehicle_complete()`
**Parâmetros:**
- `p_vehicle_id` - ID do veículo a vender
- `p_sale_value` - Valor de venda
- `p_sale_date` - Data da venda
- `p_bank_account_id` - Conta para creditar (opcional)
- `p_cancel_pending_installments` - Excluir parcelas? (boolean)

**O que ela faz:**
1. ✅ Valida ownership do tenant
2. ✅ Verifica se veículo existe
3. ✅ Impede venda se houver contrato ativo
4. ✅ Atualiza status do veículo para 'vendido'
5. ✅ Cria receita de venda (paga)
6. ✅ Credita valor na conta bancária
7. ✅ Exclui parcelas futuras (se solicitado)
8. ✅ Cria transação de lucro/prejuízo
9. ✅ Retorna JSON com resultado completo

### Interface Atualizada
- ✅ Dropdown de seleção de conta bancária
- ✅ Preview de saldo antes/depois
- ✅ Alerta de parcelas pendentes
- ✅ Checkbox para excluir parcelas
- ✅ Cálculo visual de lucro/prejuízo
- ✅ Mensagens de erro/sucesso com toast

## 🐛 Troubleshooting

### Erro: "function sell_vehicle_complete does not exist"
**Solução:** Execute a migration no Supabase Dashboard (Passo 1)

### Erro: "relation locacoes_veicular_bank_accounts does not exist"
**Solução:** Execute a migration no Supabase Dashboard (Passo 1)

### Contas não aparecem no dropdown
**Solução:** Execute o Passo 2.2 para criar contas padrão

### Erro: "não é possível vender veículo com contrato ativo"
**Ação:** Finalize o contrato antes de vender o veículo

### Frontend não atualiza após venda
**Solução:** Verifique se useQuery está invalidando corretamente:
```tsx
queryClient.invalidateQueries({ queryKey: ["vehicles"] });
queryClient.invalidateQueries({ queryKey: ["transactions"] });
queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
```

## 📊 Próximos Passos (Opcional)

### Página de Gestão de Contas Bancárias
Criar `src/pages/BankAccounts.tsx` com:
- Lista de todas as contas
- Adicionar nova conta
- Editar conta existente
- Desativar conta
- Histórico de transações por conta

### Dashboard com Saldos
Adicionar widget no Dashboard mostrando:
- Total em contas bancárias
- Saldo por conta
- Movimentações recentes

### Transferências entre Contas
Função para transferir valores entre contas:
```sql
transfer_between_accounts(
  from_account_id,
  to_account_id,
  amount,
  description
)
```

---

## 📝 Resumo da Implementação

✅ **Criado:**
- Tabela `locacoes_veicular_bank_accounts`
- Função `sell_vehicle_complete()`
- Função `create_default_bank_accounts()`
- RLS policies (4 políticas)
- Interface completa de venda

✅ **Atualizado:**
- `locacoes_veicular_transactions` (adicionada coluna `bank_account_id`)
- `SellVehicleDialog.tsx` (nova versão com contas bancárias)

✅ **Funcionalidades:**
- Venda de veículo com baixa no estoque
- Registro automático de receita
- Crédito em conta bancária escolhida
- Cancelamento opcional de parcelas futuras
- Cálculo de lucro/prejuízo
- Interface profissional e intuitiva

**Tempo estimado de implementação: 15-20 minutos**
