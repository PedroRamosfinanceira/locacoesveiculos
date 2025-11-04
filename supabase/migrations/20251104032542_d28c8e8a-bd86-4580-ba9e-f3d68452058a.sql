-- Função para criar veículo com investimento e gerar parcelas automáticas
CREATE OR REPLACE FUNCTION create_vehicle_with_investment(
  p_tenant_id UUID,
  p_vehicle JSONB,
  p_acquisition JSONB,
  p_expenses JSONB
) RETURNS JSONB AS $$
DECLARE
  v_vehicle_id UUID;
  v_method_id UUID;
  v_i INT;
  v_due_date DATE;
  v_ipva_date DATE;
  v_seguro_date DATE;
  v_licenciamento_date DATE;
BEGIN
  -- 1. Inserir veículo
  INSERT INTO locacoes_veicular_vehicles (
    tenant_id, brand, model, plate, year, color, category, status, valor_aquisicao_sem_encargos
  ) VALUES (
    p_tenant_id,
    (p_vehicle->>'brand')::TEXT,
    (p_vehicle->>'model')::TEXT,
    (p_vehicle->>'plate')::TEXT,
    (p_vehicle->>'year')::INTEGER,
    (p_vehicle->>'color')::TEXT,
    (p_vehicle->>'category')::TEXT,
    'disponivel',
    (p_vehicle->>'valor_aquisicao_sem_encargos')::NUMERIC
  ) RETURNING id INTO v_vehicle_id;

  -- 2. Inserir método de aquisição
  IF (p_acquisition->>'type')::TEXT = 'financing' THEN
    INSERT INTO locacoes_veicular_vehicle_methods (
      tenant_id, vehicle_id, type, amount, installments_count, installment_value, institution
    ) VALUES (
      p_tenant_id,
      v_vehicle_id,
      'financing',
      (p_acquisition->>'financed_amount')::NUMERIC,
      (p_acquisition->>'installments_count')::INTEGER,
      (p_acquisition->>'installment_value')::NUMERIC,
      (p_acquisition->>'institution')::TEXT
    ) RETURNING id INTO v_method_id;

    -- 3. Gerar parcelas de financiamento
    FOR v_i IN 1..(p_acquisition->>'installments_count')::INTEGER LOOP
      v_due_date := CURRENT_DATE + (v_i || ' month')::INTERVAL;
      
      INSERT INTO locacoes_veicular_transactions (
        tenant_id, type, vehicle_id, amount, due_date, status, description
      ) VALUES (
        p_tenant_id,
        'despesa',
        v_vehicle_id,
        (p_acquisition->>'installment_value')::NUMERIC,
        v_due_date,
        'pendente',
        format('Parcela %s/%s Financiamento [%s]', v_i, (p_acquisition->>'installments_count')::INTEGER, (p_vehicle->>'plate')::TEXT)
      );
    END LOOP;
  ELSIF (p_acquisition->>'type')::TEXT = 'cash' THEN
    INSERT INTO locacoes_veicular_vehicle_methods (
      tenant_id, vehicle_id, type, amount
    ) VALUES (
      p_tenant_id,
      v_vehicle_id,
      'cash',
      (p_acquisition->>'amount')::NUMERIC
    ) RETURNING id INTO v_method_id;
  END IF;

  -- 4. Gerar despesas anuais (IPVA, Seguro, Licenciamento)
  v_ipva_date := DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '15 days'; -- 15 de fevereiro
  v_seguro_date := CURRENT_DATE + INTERVAL '1 year';
  v_licenciamento_date := DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '6 months'; -- Julho

  -- IPVA
  IF (p_expenses->>'ipva')::NUMERIC > 0 THEN
    INSERT INTO locacoes_veicular_transactions (
      tenant_id, type, vehicle_id, amount, due_date, status, description
    ) VALUES (
      p_tenant_id,
      'despesa',
      v_vehicle_id,
      (p_expenses->>'ipva')::NUMERIC,
      v_ipva_date,
      'pendente',
      format('IPVA Anual [%s]', (p_vehicle->>'plate')::TEXT)
    );
  END IF;

  -- Seguro
  IF (p_expenses->>'seguro')::NUMERIC > 0 THEN
    INSERT INTO locacoes_veicular_transactions (
      tenant_id, type, vehicle_id, amount, due_date, status, description
    ) VALUES (
      p_tenant_id,
      'despesa',
      v_vehicle_id,
      (p_expenses->>'seguro')::NUMERIC,
      v_seguro_date,
      'pendente',
      format('Seguro Anual [%s]', (p_vehicle->>'plate')::TEXT)
    );
  END IF;

  -- Licenciamento
  IF (p_expenses->>'licenciamento')::NUMERIC > 0 THEN
    INSERT INTO locacoes_veicular_transactions (
      tenant_id, type, vehicle_id, amount, due_date, status, description
    ) VALUES (
      p_tenant_id,
      'despesa',
      v_vehicle_id,
      (p_expenses->>'licenciamento')::NUMERIC,
      v_licenciamento_date,
      'pendente',
      format('Licenciamento Anual [%s]', (p_vehicle->>'plate')::TEXT)
    );
  END IF;

  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', TRUE,
    'vehicle_id', v_vehicle_id,
    'method_id', v_method_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;