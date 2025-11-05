-- Criar tabela de contas bancárias se não existir
CREATE TABLE IF NOT EXISTS public.locacoes_veicular_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.locacoes_veicular_tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Nome da conta (ex: "Banco Santander - CC", "Nubank", "Caixa")
  bank_name TEXT, -- Nome do banco
  account_type TEXT CHECK (account_type IN ('corrente', 'poupanca', 'investimento')),
  balance NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para contas bancárias
ALTER TABLE public.locacoes_veicular_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant bank accounts"
  ON public.locacoes_veicular_bank_accounts
  FOR SELECT
  USING (tenant_id = public.me_tenant());

CREATE POLICY "Users can insert their tenant bank accounts"
  ON public.locacoes_veicular_bank_accounts
  FOR INSERT
  WITH CHECK (tenant_id = public.me_tenant());

CREATE POLICY "Users can update their tenant bank accounts"
  ON public.locacoes_veicular_bank_accounts
  FOR UPDATE
  USING (tenant_id = public.me_tenant());

CREATE POLICY "Users can delete their tenant bank accounts"
  ON public.locacoes_veicular_bank_accounts
  FOR DELETE
  USING (tenant_id = public.me_tenant());

-- Adicionar coluna bank_account_id nas transações (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locacoes_veicular_transactions' 
    AND column_name = 'bank_account_id'
  ) THEN
    ALTER TABLE public.locacoes_veicular_transactions 
    ADD COLUMN bank_account_id UUID REFERENCES public.locacoes_veicular_bank_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Função completa para vender veículo
CREATE OR REPLACE FUNCTION public.sell_vehicle_complete(
  p_vehicle_id UUID,
  p_sale_value NUMERIC,
  p_sale_date DATE,
  p_bank_account_id UUID,
  p_cancel_pending_installments BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
  v_tenant UUID := public.me_tenant();
  v_vehicle RECORD;
  v_acquisition_value NUMERIC;
  v_gain_loss NUMERIC;
  v_installments_count INT := 0;
  v_installments_total NUMERIC := 0;
BEGIN
  -- Validações
  IF v_tenant IS NULL THEN 
    RAISE EXCEPTION 'Usuário sem tenant'; 
  END IF;

  IF COALESCE(p_sale_value, 0) <= 0 THEN
    RAISE EXCEPTION 'Valor de venda deve ser maior que zero';
  END IF;

  -- Verificar se veículo existe e pertence ao tenant
  SELECT * INTO v_vehicle
  FROM public.locacoes_veicular_vehicles
  WHERE id = p_vehicle_id AND tenant_id = v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Veículo não encontrado ou não pertence ao seu tenant';
  END IF;

  -- Verificar se veículo está em contrato ativo
  IF EXISTS (
    SELECT 1 FROM public.locacoes_veicular_contracts
    WHERE vehicle_id = p_vehicle_id 
    AND status = 'ativo'
    AND tenant_id = v_tenant
  ) THEN
    RAISE EXCEPTION 'Não é possível vender um veículo com contrato ativo. Encerre o contrato primeiro.';
  END IF;

  -- Verificar se conta bancária existe e pertence ao tenant
  IF p_bank_account_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.locacoes_veicular_bank_accounts
      WHERE id = p_bank_account_id AND tenant_id = v_tenant
    ) THEN
      RAISE EXCEPTION 'Conta bancária não encontrada ou não pertence ao seu tenant';
    END IF;
  END IF;

  -- Obter valor de aquisição
  v_acquisition_value := COALESCE(v_vehicle.valor_aquisicao_sem_encargos, 0);
  v_gain_loss := p_sale_value - v_acquisition_value;

  -- 1. ATUALIZAR STATUS DO VEÍCULO
  UPDATE public.locacoes_veicular_vehicles
  SET 
    status = 'vendido',
    updated_at = NOW()
  WHERE id = p_vehicle_id AND tenant_id = v_tenant;

  -- 2. REGISTRAR RECEITA DA VENDA
  INSERT INTO public.locacoes_veicular_transactions (
    id,
    tenant_id,
    vehicle_id,
    bank_account_id,
    type,
    description,
    amount,
    due_date,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_tenant,
    p_vehicle_id,
    p_bank_account_id,
    'receita',
    format('Venda de Veículo [%s %s - %s]', v_vehicle.brand, v_vehicle.model, v_vehicle.plate),
    p_sale_value,
    p_sale_date,
    'pago',
    NOW()
  );

  -- 3. ATUALIZAR SALDO DA CONTA BANCÁRIA (se informada)
  IF p_bank_account_id IS NOT NULL THEN
    UPDATE public.locacoes_veicular_bank_accounts
    SET 
      balance = balance + p_sale_value,
      updated_at = NOW()
    WHERE id = p_bank_account_id AND tenant_id = v_tenant;
  END IF;

  -- 4. CANCELAR PARCELAS PENDENTES (se solicitado)
  IF p_cancel_pending_installments = TRUE THEN
    -- Contar parcelas que serão canceladas
    SELECT 
      COUNT(*),
      COALESCE(SUM(amount), 0)
    INTO v_installments_count, v_installments_total
    FROM public.locacoes_veicular_transactions
    WHERE vehicle_id = p_vehicle_id
      AND tenant_id = v_tenant
      AND type = 'despesa'
      AND status = 'pendente'
      AND due_date > p_sale_date;

    -- Excluir parcelas pendentes futuras
    DELETE FROM public.locacoes_veicular_transactions
    WHERE vehicle_id = p_vehicle_id
      AND tenant_id = v_tenant
      AND type = 'despesa'
      AND status = 'pendente'
      AND due_date > p_sale_date;
  END IF;

  -- 5. REGISTRAR GANHO/PERDA DE CAPITAL (se houver)
  IF v_gain_loss != 0 THEN
    INSERT INTO public.locacoes_veicular_transactions (
      id,
      tenant_id,
      vehicle_id,
      bank_account_id,
      type,
      description,
      amount,
      due_date,
      status,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_tenant,
      p_vehicle_id,
      p_bank_account_id,
      CASE WHEN v_gain_loss > 0 THEN 'receita' ELSE 'despesa' END,
      format(
        '%s de Capital na Venda [%s %s - %s]',
        CASE WHEN v_gain_loss > 0 THEN 'Ganho' ELSE 'Perda' END,
        v_vehicle.brand, 
        v_vehicle.model, 
        v_vehicle.plate
      ),
      ABS(v_gain_loss),
      p_sale_date,
      'pago',
      NOW()
    );
  END IF;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', TRUE,
    'vehicle_id', p_vehicle_id,
    'sale_value', p_sale_value,
    'acquisition_value', v_acquisition_value,
    'gain_loss', v_gain_loss,
    'bank_account_id', p_bank_account_id,
    'installments_canceled', v_installments_count,
    'installments_total_canceled', v_installments_total,
    'message', format(
      'Veículo vendido com sucesso! %s de %s. %s parcelas canceladas (R$ %s).',
      CASE WHEN v_gain_loss > 0 THEN 'Ganho' ELSE 'Perda' END,
      to_char(ABS(v_gain_loss), 'FM999G999G990D00'),
      v_installments_count,
      to_char(v_installments_total, 'FM999G999G990D00')
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar função para inserir contas bancárias padrão (opcional)
CREATE OR REPLACE FUNCTION public.create_default_bank_accounts(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Inserir apenas se não existir nenhuma conta
  IF NOT EXISTS (
    SELECT 1 FROM public.locacoes_veicular_bank_accounts
    WHERE tenant_id = p_tenant_id
  ) THEN
    INSERT INTO public.locacoes_veicular_bank_accounts (tenant_id, name, bank_name, account_type, balance)
    VALUES 
      (p_tenant_id, 'Conta Corrente Principal', 'Banco Principal', 'corrente', 0),
      (p_tenant_id, 'Poupança', 'Banco Principal', 'poupanca', 0),
      (p_tenant_id, 'Caixa', NULL, 'corrente', 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentários
COMMENT ON TABLE public.locacoes_veicular_bank_accounts IS 'Contas bancárias da empresa para controle de fluxo de caixa';
COMMENT ON FUNCTION public.sell_vehicle_complete IS 'Função completa para vender veículo: baixa no estoque, lança receita, atualiza saldo bancário e cancela parcelas pendentes opcionalmente';
