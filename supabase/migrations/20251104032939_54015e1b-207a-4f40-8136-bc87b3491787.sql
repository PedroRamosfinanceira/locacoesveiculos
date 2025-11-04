-- FASE 2: Melhorar função de contrato para gerar receitas automáticas
CREATE OR REPLACE FUNCTION locacoes_veicular_contract_create(
  p_client_id UUID,
  p_vehicle_id UUID,
  p_start_date DATE,
  p_months INTEGER,
  p_monthly_value NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_tenant UUID := public.me_tenant();
  v_contract_id UUID := gen_random_uuid();
  v_i INT;
  v_due_date DATE;
BEGIN
  IF v_tenant IS NULL THEN 
    RAISE EXCEPTION 'profile sem tenant'; 
  END IF;

  -- Validar cliente e veículo pertencem ao tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.locacoes_veicular_clients 
    WHERE id = p_client_id AND tenant_id = v_tenant
  ) THEN 
    RAISE EXCEPTION 'forbidden: cross-tenant client'; 
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.locacoes_veicular_vehicles 
    WHERE id = p_vehicle_id AND tenant_id = v_tenant
  ) THEN 
    RAISE EXCEPTION 'forbidden: cross-tenant vehicle'; 
  END IF;

  IF COALESCE(p_months, 0) <= 0 THEN 
    RAISE EXCEPTION 'months inválido'; 
  END IF;
  
  IF COALESCE(p_monthly_value, 0) <= 0 THEN 
    RAISE EXCEPTION 'monthly_value inválido'; 
  END IF;

  -- 1. Inserir contrato
  INSERT INTO public.locacoes_veicular_contracts(
    id, tenant_id, client_id, vehicle_id, start_date, months, monthly_value, status, created_at
  ) VALUES (
    v_contract_id, v_tenant, p_client_id, p_vehicle_id, p_start_date, p_months, p_monthly_value, 'ativo', NOW()
  );

  -- 2. Atualizar status do veículo para "alugado"
  UPDATE public.locacoes_veicular_vehicles
  SET status = 'alugado'
  WHERE id = p_vehicle_id AND tenant_id = v_tenant;

  -- 3. Gerar parcelas de receita de aluguel (automático)
  FOR v_i IN 0..(p_months - 1) LOOP
    v_due_date := p_start_date + (v_i || ' month')::INTERVAL;
    
    INSERT INTO public.locacoes_veicular_transactions(
      id, tenant_id, contract_id, vehicle_id, type, description, amount, due_date, status, created_at
    ) VALUES (
      gen_random_uuid(),
      v_tenant,
      v_contract_id,
      p_vehicle_id,
      'receita',
      format('Aluguel mês %s/%s - Contrato %s', v_i + 1, p_months, SUBSTRING(v_contract_id::TEXT, 1, 8)),
      p_monthly_value,
      v_due_date,
      'pendente',
      NOW()
    );
  END LOOP;

  RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;