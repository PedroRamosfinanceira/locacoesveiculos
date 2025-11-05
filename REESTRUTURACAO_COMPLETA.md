# 🔄 REESTRUTURAÇÃO COMPLETA DO SISTEMA

**Data:** 04/11/2025  
**Objetivo:** Separar área operacional de área administrativa

---

## 📋 ANÁLISE DA ESTRUTURA ATUAL

### ❌ Problemas Identificados:

1. **Menu Lateral expõe dados financeiros para todos**
   - Financeiro, ROI, Relatórios, Predições IA → devem ser ADMIN only

2. **Dashboard inicial mostra finanças**
   - Deve mostrar CARROSSEL DE VEÍCULOS DISPONÍVEIS

3. **Veículos mostra dados financeiros**
   - Deve mostrar apenas CADASTRO para operação

4. **Falta página de Propostas**
   - Gerar Proposta
   - Preencher Proposta

---

## ✅ NOVA ESTRUTURA

### 🎯 MENU LATERAL - Usuários Operacionais

```
📊 Dashboard (Carrossel de Veículos)
🚗 Veículos (Cadastro - SEM finanças)
👥 Clientes
📝 Propostas
  ├─ Gerar Proposta
  └─ Preencher Proposta
📄 Contratos
🔧 Manutenções
⚙️ Configurações
```

### 🔐 MENU LATERAL - Administradores

```
📊 Dashboard (Carrossel de Veículos)
🚗 Veículos (Cadastro - SEM finanças)
👥 Clientes
📝 Propostas
  ├─ Gerar Proposta
  └─ Preencher Proposta
📄 Contratos
🔧 Manutenções
📊 Administrativo ← NOVA ABA
  ├─ 💰 Financeiro
  ├─ 📈 ROI da Frota
  ├─ 🤖 Predições IA
  └─ 📊 Relatórios
⚙️ Configurações
```

---

## 🚀 IMPLEMENTAÇÃO

### 1. Criar Página de Propostas

**Arquivo:** `src/pages/Proposals.tsx`

**Features:**
- Tab 1: Gerar Proposta (formulário vazio)
- Tab 2: Preencher Proposta (lista de propostas pendentes)
- Campos:
  - Cliente (select)
  - Veículo (select - apenas disponíveis)
  - Período (data início/fim)
  - Valor mensal
  - Observações
  - Gerar PDF da proposta

### 2. Modificar Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

**Mudanças:**
- ❌ Remover KPIs financeiros
- ✅ Adicionar carrossel de veículos disponíveis
- ✅ Cards com: foto, modelo, ano, status "DISPONÍVEL"
- ✅ Botão "Alugar" → redireciona para Propostas

### 3. Modificar Veículos

**Arquivo:** `src/pages/Vehicles.tsx`

**Mudanças:**
- ❌ Ocultar coluna "Investimento"
- ❌ Ocultar coluna "Parcelas"
- ❌ Ocultar ROI
- ✅ Mostrar apenas: Placa, Modelo, Ano, Status, Ações
- ✅ Botão "Cadastrar Novo Veículo"
- ✅ Botão "Editar" (dados básicos)
- ✅ Botão "Alugar" (se disponível)

### 4. Criar Página Administrativo

**Arquivo:** `src/pages/Administrative.tsx`

**Layout:**
```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="financial">Financeiro</TabsTrigger>
    <TabsTrigger value="roi">ROI da Frota</TabsTrigger>
    <TabsTrigger value="ai">Predições IA</TabsTrigger>
    <TabsTrigger value="reports">Relatórios</TabsTrigger>
  </TabsList>

  <TabsContent value="financial">
    <Financial /> {/* Componente existente */}
  </TabsContent>

  <TabsContent value="roi">
    <ROI /> {/* Componente existente */}
  </TabsContent>

  <TabsContent value="ai">
    <AIPredictions /> {/* Componente existente */}
  </TabsContent>

  <TabsContent value="reports">
    <Reports /> {/* Componente existente */}
  </TabsContent>
</Tabs>
```

### 5. Atualizar Menu Lateral

**Arquivo:** `src/components/layout/DashboardLayout.tsx`

**Mudanças:**
```typescript
const operationalMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Car, label: "Veículos", path: "/vehicles" },
  { icon: Users, label: "Clientes", path: "/clients" },
  { icon: FileText, label: "Propostas", path: "/proposals" },
  { icon: FileText, label: "Contratos", path: "/contracts" },
  { icon: Wrench, label: "Manutenções", path: "/maintenance" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

const adminMenuItems = [
  ...operationalMenuItems,
  { 
    icon: Building, 
    label: "Administrativo", 
    path: "/administrative",
    badge: "Admin" // Badge vermelho
  },
];

// Usar adminMenuItems se isAdmin || isSaasAdmin
// Caso contrário, usar operationalMenuItems
```

### 6. Atualizar Rotas

**Arquivo:** `src/App.tsx`

**Adicionar:**
```typescript
<Route path="/proposals" element={<ProtectedRoute><Proposals /></ProtectedRoute>} />
<Route path="/administrative" element={<ProtectedRoute requireAdmin><Administrative /></ProtectedRoute>} />
```

**Remover das rotas públicas:**
```typescript
// Estas rotas só estarão acessíveis via /administrative
// <Route path="/financial" ... />
// <Route path="/roi" ... />
// <Route path="/ai-predictions" ... />
// <Route path="/reports" ... />
```

---

## 📊 CONTROLE DE ACESSO

### Permissões por Nível

| Página | Operacional | Admin | SaaS Admin |
|--------|-------------|-------|------------|
| Dashboard (Carrossel) | ✅ | ✅ | ✅ |
| Veículos (Cadastro) | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | ✅ |
| Propostas | ✅ | ✅ | ✅ |
| Contratos | ✅ | ✅ | ✅ |
| Manutenções | ✅ | ✅ | ✅ |
| Configurações | ❌ | ✅ | ✅ |
| **Administrativo** | ❌ | ✅ | ✅ |
| ├─ Financeiro | ❌ | ✅ | ✅ |
| ├─ ROI | ❌ | ✅ | ✅ |
| ├─ Predições IA | ❌ | ✅ | ✅ |
| └─ Relatórios | ❌ | ✅ | ✅ |
| Painel SaaS | ❌ | ❌ | ✅ |

---

## 🎨 DASHBOARD - Nova Estrutura

### Carrossel de Veículos

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  🚗 VEÍCULOS DISPONÍVEIS PARA LOCAÇÃO          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ 🚗   │  │ 🚗   │  │ 🚗   │  │ 🚗   │      │
│  │ Gol  │  │ Uno  │  │ Celta│  │ HB20 │      │
│  │ 2020 │  │ 2019 │  │ 2021 │  │ 2022 │      │
│  │      │  │      │  │      │  │      │      │
│  │[Alugar]│[Alugar]│[Alugar]│[Alugar]│      │
│  └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                 │
│           ← → (navegação)                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📊 ESTATÍSTICAS OPERACIONAIS                  │
├─────────────────────────────────────────────────┤
│  Veículos Alugados: 12                          │
│  Veículos Disponíveis: 8                        │
│  Contratos Ativos: 12                           │
│  Manutenções Pendentes: 3                       │
└─────────────────────────────────────────────────┘
```

---

## 📝 PÁGINA DE PROPOSTAS

### Tab 1: Gerar Nova Proposta

```
┌─────────────────────────────────────────────────┐
│  GERAR NOVA PROPOSTA                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Cliente: [Select ▼]                            │
│                                                 │
│  Veículo: [Select ▼] (apenas disponíveis)      │
│                                                 │
│  Período:                                       │
│  Data Início: [📅 DD/MM/AAAA]                   │
│  Data Fim:    [📅 DD/MM/AAAA]                   │
│                                                 │
│  Valor Mensal: R$ [_______]                     │
│                                                 │
│  Observações:                                   │
│  [___________________________________]          │
│  [___________________________________]          │
│                                                 │
│  [Gerar PDF] [Enviar por Email]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tab 2: Propostas Pendentes

```
┌─────────────────────────────────────────────────┐
│  PROPOSTAS PENDENTES                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Proposta #001 - João Silva                     │
│  Veículo: Gol 2020 (ABC-1234)                   │
│  Valor: R$ 1.200/mês                            │
│  Status: Aguardando                             │
│  [Ver] [Editar] [Aprovar] [Rejeitar]           │
│  ─────────────────────────────────────────      │
│                                                 │
│  Proposta #002 - Maria Santos                   │
│  Veículo: Uno 2019 (DEF-5678)                   │
│  Valor: R$ 1.000/mês                            │
│  Status: Aguardando                             │
│  [Ver] [Editar] [Aprovar] [Rejeitar]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ BANCO DE DADOS

### Nova Tabela: locacoes_veicular_proposals

```sql
CREATE TABLE locacoes_veicular_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES locacoes_veicular_tenants(id),
  client_id UUID NOT NULL REFERENCES locacoes_veicular_clients(id),
  vehicle_id UUID NOT NULL REFERENCES locacoes_veicular_vehicles(id),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_value DECIMAL(10, 2) NOT NULL,
  
  observations TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, converted
  
  created_by UUID REFERENCES locacoes_veicular_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Se aprovada, vira contrato
  contract_id UUID REFERENCES locacoes_veicular_contracts(id)
);

CREATE INDEX idx_proposals_tenant ON locacoes_veicular_proposals(tenant_id);
CREATE INDEX idx_proposals_status ON locacoes_veicular_proposals(status);
```

---

## 🔧 ARQUIVOS A MODIFICAR

### Criar:
1. ✅ `src/pages/Proposals.tsx` (nova página)
2. ✅ `src/pages/Administrative.tsx` (nova página)
3. ✅ `supabase/migrations/[timestamp]_create_proposals.sql`

### Modificar:
1. ✅ `src/pages/Dashboard.tsx` (carrossel)
2. ✅ `src/pages/Vehicles.tsx` (remover finanças)
3. ✅ `src/components/layout/DashboardLayout.tsx` (novo menu)
4. ✅ `src/App.tsx` (novas rotas)

### Manter:
- ✅ `src/pages/Financial.tsx` (vira tab de Administrative)
- ✅ `src/pages/ROI.tsx` (vira tab de Administrative)
- ✅ `src/pages/AIPredictions.tsx` (vira tab de Administrative)
- ✅ `src/pages/Reports.tsx` (vira tab de Administrative)

---

## 📦 ORDEM DE IMPLEMENTAÇÃO

### Fase 1: Estrutura Base (1h)
1. Criar migration de proposals
2. Criar página Administrative (tabs)
3. Atualizar DashboardLayout (novo menu)
4. Atualizar App.tsx (rotas)

### Fase 2: Dashboard Carrossel (30min)
1. Modificar Dashboard.tsx
2. Adicionar carrossel de veículos
3. Cards de estatísticas operacionais

### Fase 3: Propostas (1h)
1. Criar Proposals.tsx
2. Tab "Gerar Proposta"
3. Tab "Propostas Pendentes"
4. Integração com banco

### Fase 4: Ajuste Veículos (30min)
1. Modificar Vehicles.tsx
2. Ocultar colunas financeiras
3. Adicionar botão "Alugar"

### Fase 5: Testes (30min)
1. Testar como usuário operacional
2. Testar como admin
3. Validar permissões

---

## ✅ CHECKLIST

- [ ] Migration de proposals executada
- [ ] Página Administrative criada
- [ ] Menu lateral atualizado
- [ ] Dashboard com carrossel
- [ ] Página de Propostas funcional
- [ ] Veículos sem dados financeiros
- [ ] Testes de permissão OK
- [ ] Documentação atualizada

---

**Tempo Estimado Total:** 3-4 horas  
**Prioridade:** ALTA  
**Impacto:** Toda a navegação do sistema
