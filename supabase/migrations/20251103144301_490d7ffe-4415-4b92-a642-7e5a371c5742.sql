-- =====================================================================
-- SCRIPT DE CORREÇÃO COMPLETA - SMART APN LOCAÇÕES
-- Autor: Sistema Lovable AI
-- Data: 2025-11-03
-- Descrição: Correção de FKs, RLS policies e funções duplicadas
-- Idempotente: Sim (pode ser executado múltiplas vezes)
-- =====================================================================

-- =====================================================
-- FASE 1: ADICIONAR FOREIGN KEYS AUSENTES
-- =====================================================

DO $$
BEGIN
  -- FK: contracts.client_id -> clients(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_contracts_client'
  ) THEN
    ALTER TABLE public.locacoes_veicular_contracts
    ADD CONSTRAINT fk_contracts_client
    FOREIGN KEY (client_id) 
    REFERENCES public.locacoes_veicular_clients(id) 
    ON DELETE RESTRICT;
    RAISE NOTICE '✅ FK adicionada: contracts.client_id -> clients(id)';
  ELSE
    RAISE NOTICE '⏭️  FK já existe: fk_contracts_client';
  END IF;

  -- FK: transactions.contract_id -> contracts(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tx_contract'
  ) THEN
    ALTER TABLE public.locacoes_veicular_transactions
    ADD CONSTRAINT fk_tx_contract
    FOREIGN KEY (contract_id) 
    REFERENCES public.locacoes_veicular_contracts(id) 
    ON DELETE CASCADE;
    RAISE NOTICE '✅ FK adicionada: transactions.contract_id -> contracts(id)';
  ELSE
    RAISE NOTICE '⏭️  FK já existe: fk_tx_contract';
  END IF;

  -- FK: clients.tenant_id -> tenants(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_clients_tenant'
  ) THEN
    ALTER TABLE public.locacoes_veicular_clients
    ADD CONSTRAINT fk_clients_tenant
    FOREIGN KEY (tenant_id) 
    REFERENCES public.locacoes_veicular_tenants(id) 
    ON DELETE CASCADE;
    RAISE NOTICE '✅ FK adicionada: clients.tenant_id -> tenants(id)';
  ELSE
    RAISE NOTICE '⏭️  FK já existe: fk_clients_tenant';
  END IF;
END$$;

-- =====================================================
-- FASE 2: LIMPAR RLS POLICIES DUPLICADAS
-- =====================================================

-- TRANSACTIONS: Remover 4 policies antigas
DROP POLICY IF EXISTS locacoes_veicular_transactions_all_policy ON public.locacoes_veicular_transactions;
DROP POLICY IF EXISTS locacoes_veicular_transactions_select_policy ON public.locacoes_veicular_transactions;
DROP POLICY IF EXISTS locacoes_veicular_transactions_tenant_all ON public.locacoes_veicular_transactions;
DROP POLICY IF EXISTS tx_tenant_all ON public.locacoes_veicular_transactions;

-- VEHICLES: Remover 4 policies antigas
DROP POLICY IF EXISTS locacoes_veicular_vehicles_all_policy ON public.locacoes_veicular_vehicles;
DROP POLICY IF EXISTS locacoes_veicular_vehicles_select_policy ON public.locacoes_veicular_vehicles;
DROP POLICY IF EXISTS locacoes_veicular_vehicles_tenant_all ON public.locacoes_veicular_vehicles;
DROP POLICY IF EXISTS vehicles_tenant_all ON public.locacoes_veicular_vehicles;

-- CONTRACTS: Remover 4 policies antigas
DROP POLICY IF EXISTS contracts_tenant_all ON public.locacoes_veicular_contracts;
DROP POLICY IF EXISTS locacoes_veicular_contracts_all_policy ON public.locacoes_veicular_contracts;
DROP POLICY IF EXISTS locacoes_veicular_contracts_select_policy ON public.locacoes_veicular_contracts;
DROP POLICY IF EXISTS locacoes_veicular_contracts_tenant_all ON public.locacoes_veicular_contracts;

-- CLIENTS: Remover 1 policy antiga
DROP POLICY IF EXISTS locacoes_veicular_clients_tenant_all ON public.locacoes_veicular_clients;

-- =====================================================
-- FASE 3: REMOVER FUNÇÕES DUPLICADAS
-- =====================================================

-- Remover versão antiga de contract_create
DROP FUNCTION IF EXISTS public.locacoes_veicular_contract_create(
  uuid, uuid, uuid, date, numeric, integer
);

-- Remover versão antiga de transaction_mark_paid
DROP FUNCTION IF EXISTS public.locacoes_veicular_transaction_mark_paid(
  uuid, uuid, timestamptz
);

-- =====================================================
-- FASE 4: VALIDAÇÃO
-- =====================================================

-- Verificar FKs
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conname IN (
    'fk_contracts_client',
    'fk_tx_contract',
    'fk_clients_tenant'
  );
  
  IF fk_count = 3 THEN
    RAISE NOTICE '✅ Validação FKs: 3/3 FKs criadas com sucesso';
  ELSE
    RAISE WARNING '⚠️  Validação FKs: Esperado 3, encontrado %', fk_count;
  END IF;
END$$;

-- Verificar policies
DO $$
DECLARE
  policy_counts RECORD;
BEGIN
  FOR policy_counts IN
    SELECT 
      tablename,
      COUNT(*) as count
    FROM pg_policies
    WHERE tablename IN (
      'locacoes_veicular_transactions',
      'locacoes_veicular_vehicles',
      'locacoes_veicular_contracts',
      'locacoes_veicular_clients'
    )
    GROUP BY tablename
  LOOP
    IF policy_counts.count = 2 THEN
      RAISE NOTICE '✅ Policies %: % policies (correto)', 
        policy_counts.tablename, policy_counts.count;
    ELSE
      RAISE WARNING '⚠️  Policies %: % policies (esperado 2)', 
        policy_counts.tablename, policy_counts.count;
    END IF;
  END LOOP;
END$$;