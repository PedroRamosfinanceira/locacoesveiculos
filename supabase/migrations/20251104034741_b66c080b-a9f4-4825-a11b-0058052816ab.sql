-- MELHORIA 2: View de Aging (Inadimplência)
CREATE OR REPLACE VIEW locacoes_veicular_v_aging AS
SELECT 
  t.tenant_id,
  c.id as client_id,
  c.name as client_name,
  c.phone as client_phone,
  t.id as transaction_id,
  t.description,
  t.amount,
  t.due_date,
  t.status,
  CURRENT_DATE - t.due_date as days_overdue,
  CASE 
    WHEN CURRENT_DATE - t.due_date <= 30 THEN '0-30'
    WHEN CURRENT_DATE - t.due_date <= 60 THEN '31-60'
    WHEN CURRENT_DATE - t.due_date <= 90 THEN '61-90'
    ELSE '>90'
  END as aging_bucket,
  CASE 
    WHEN CURRENT_DATE - t.due_date <= 30 THEN 1
    WHEN CURRENT_DATE - t.due_date <= 60 THEN 2
    WHEN CURRENT_DATE - t.due_date <= 90 THEN 3
    ELSE 4
  END as criticality
FROM locacoes_veicular_transactions t
JOIN locacoes_veicular_contracts ct ON t.contract_id = ct.id
JOIN locacoes_veicular_clients c ON ct.client_id = c.id
WHERE t.type = 'receita'
  AND t.status IN ('pendente', 'atrasado')
  AND t.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- MELHORIA 3: Tabela de Manutenções
CREATE TABLE IF NOT EXISTS locacoes_veicular_maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('preventiva', 'corretiva')),
  description TEXT NOT NULL,
  cost NUMERIC(10,2),
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'concluida', 'cancelada')),
  next_maintenance_km INTEGER,
  next_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE locacoes_veicular_maintenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locacoes_veicular_maintenances_sel"
  ON locacoes_veicular_maintenances
  FOR SELECT
  USING (tenant_id = me_tenant() AND has_locacoes_role(auth.uid(), me_tenant(), 'user'::locacoes_veicular_role));

CREATE POLICY "locacoes_veicular_maintenances_mod"
  ON locacoes_veicular_maintenances
  FOR ALL
  USING (tenant_id = me_tenant() AND has_locacoes_role(auth.uid(), me_tenant(), 'user'::locacoes_veicular_role))
  WITH CHECK (tenant_id = me_tenant() AND has_locacoes_role(auth.uid(), me_tenant(), 'user'::locacoes_veicular_role));

-- MELHORIA 4: Função de Venda de Veículo
CREATE OR REPLACE FUNCTION locacoes_veicular_sell_vehicle(
  p_vehicle_id UUID,
  p_sale_value NUMERIC,
  p_sale_date DATE,
  p_quit_installments BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tenant UUID := me_tenant();
  v_vehicle RECORD;
  v_total_paid NUMERIC;
  v_valor_contabil NUMERIC;
  v_gain_loss NUMERIC;
BEGIN
  IF v_tenant IS NULL THEN 
    RAISE EXCEPTION 'profile sem tenant'; 
  END IF;

  -- Buscar veículo
  SELECT * INTO v_vehicle
  FROM locacoes_veicular_vehicles
  WHERE id = p_vehicle_id AND tenant_id = v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Veículo não encontrado';
  END IF;

  IF v_vehicle.status = 'vendido' THEN
    RAISE EXCEPTION 'Veículo já está vendido';
  END IF;

  -- Calcular valor contábil (investimento - parcelas pagas)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM locacoes_veicular_transactions
  WHERE vehicle_id = p_vehicle_id 
    AND tenant_id = v_tenant
    AND type = 'despesa'
    AND description LIKE '[INV]%'
    AND status = 'pago';

  v_valor_contabil := COALESCE(v_vehicle.valor_aquisicao_sem_encargos, 0) - v_total_paid;
  v_gain_loss := p_sale_value - v_valor_contabil;

  -- Atualizar veículo
  UPDATE locacoes_veicular_vehicles
  SET status = 'vendido',
      updated_at = NOW()
  WHERE id = p_vehicle_id AND tenant_id = v_tenant;

  -- Gerar receita de venda
  INSERT INTO locacoes_veicular_transactions (
    tenant_id, vehicle_id, type, description, amount, due_date, status, paid_at
  ) VALUES (
    v_tenant,
    p_vehicle_id,
    'receita',
    format('Venda de Veículo [%s]', v_vehicle.plate),
    p_sale_value,
    p_sale_date,
    'pago',
    p_sale_date
  );

  -- Quitar parcelas pendentes se solicitado
  IF p_quit_installments THEN
    UPDATE locacoes_veicular_transactions
    SET status = 'pago', paid_at = p_sale_date
    WHERE vehicle_id = p_vehicle_id 
      AND tenant_id = v_tenant
      AND type = 'despesa'
      AND status = 'pendente';
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'vehicle_id', p_vehicle_id,
    'sale_value', p_sale_value,
    'valor_contabil', v_valor_contabil,
    'gain_loss', v_gain_loss
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- MELHORIA 5: Adicionar coluna de variáveis aos templates
ALTER TABLE locacoes_veicular_doc_templates 
ADD COLUMN IF NOT EXISTS variables_json JSONB DEFAULT '[]'::jsonb;