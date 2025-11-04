-- FASE 3: Recriar view de ROI com cálculos melhorados
DROP VIEW IF EXISTS locacoes_veicular_v_roi_frota;

CREATE VIEW locacoes_veicular_v_roi_frota AS
SELECT 
  v.tenant_id,
  v.id AS vehicle_id,
  v.brand,
  v.model,
  v.plate,
  v.status,
  -- Investimento inicial (valor de aquisição)
  COALESCE(v.valor_aquisicao_sem_encargos, 0) AS investimento_inicial,
  
  -- Receitas mensais (soma de receitas pendentes ou pagas deste veículo no mês atual)
  COALESCE((
    SELECT SUM(t.amount)
    FROM locacoes_veicular_transactions t
    WHERE t.vehicle_id = v.id
      AND t.type = 'receita'
      AND t.status IN ('pendente', 'pago')
      AND t.due_date >= CURRENT_DATE
      AND t.due_date < CURRENT_DATE + INTERVAL '30 days'
  ), 0) AS receitas_mes,
  
  -- Despesas mensais (parcelas de financiamento do mês + despesas anuais/12)
  COALESCE((
    SELECT SUM(t.amount)
    FROM locacoes_veicular_transactions t
    WHERE t.vehicle_id = v.id
      AND t.type = 'despesa'
      AND t.status IN ('pendente', 'pago')
      AND t.due_date >= CURRENT_DATE
      AND t.due_date < CURRENT_DATE + INTERVAL '30 days'
  ), 0) +
  COALESCE((
    SELECT SUM(t.amount) / 12.0
    FROM locacoes_veicular_transactions t
    WHERE t.vehicle_id = v.id
      AND t.type = 'despesa'
      AND t.description ILIKE '%anual%'
  ), 0) AS despesas_mes,
  
  -- Lucro mensal = receitas - despesas
  COALESCE((
    SELECT SUM(t.amount)
    FROM locacoes_veicular_transactions t
    WHERE t.vehicle_id = v.id
      AND t.type = 'receita'
      AND t.status IN ('pendente', 'pago')
      AND t.due_date >= CURRENT_DATE
      AND t.due_date < CURRENT_DATE + INTERVAL '30 days'
  ), 0) - (
    COALESCE((
      SELECT SUM(t.amount)
      FROM locacoes_veicular_transactions t
      WHERE t.vehicle_id = v.id
        AND t.type = 'despesa'
        AND t.status IN ('pendente', 'pago')
        AND t.due_date >= CURRENT_DATE
        AND t.due_date < CURRENT_DATE + INTERVAL '30 days'
    ), 0) +
    COALESCE((
      SELECT SUM(t.amount) / 12.0
      FROM locacoes_veicular_transactions t
      WHERE t.vehicle_id = v.id
        AND t.type = 'despesa'
        AND t.description ILIKE '%anual%'
    ), 0)
  ) AS lucro_mensal,
  
  -- Payback em meses (investimento / lucro mensal)
  CASE 
    WHEN (
      COALESCE((
        SELECT SUM(t.amount)
        FROM locacoes_veicular_transactions t
        WHERE t.vehicle_id = v.id
          AND t.type = 'receita'
          AND t.status IN ('pendente', 'pago')
          AND t.due_date >= CURRENT_DATE
          AND t.due_date < CURRENT_DATE + INTERVAL '30 days'
      ), 0) - (
        COALESCE((
          SELECT SUM(t.amount)
          FROM locacoes_veicular_transactions t
          WHERE t.vehicle_id = v.id
            AND t.type = 'despesa'
            AND t.status IN ('pendente', 'pago')
            AND t.due_date >= CURRENT_DATE
            AND t.due_date < CURRENT_DATE + INTERVAL '30 days'
        ), 0) +
        COALESCE((
          SELECT SUM(t.amount) / 12.0
          FROM locacoes_veicular_transactions t
          WHERE t.vehicle_id = v.id
            AND t.type = 'despesa'
            AND t.description ILIKE '%anual%'
        ), 0)
      )
    ) > 0 
    THEN COALESCE(v.valor_aquisicao_sem_encargos, 0) / (
      COALESCE((
        SELECT SUM(t.amount)
        FROM locacoes_veicular_transactions t
        WHERE t.vehicle_id = v.id
          AND t.type = 'receita'
          AND t.status IN ('pendente', 'pago')
          AND t.due_date >= CURRENT_DATE
          AND t.due_date < CURRENT_DATE + INTERVAL '30 days'
      ), 0) - (
        COALESCE((
          SELECT SUM(t.amount)
          FROM locacoes_veicular_transactions t
          WHERE t.vehicle_id = v.id
            AND t.type = 'despesa'
            AND t.status IN ('pendente', 'pago')
            AND t.due_date >= CURRENT_DATE
            AND t.due_date < CURRENT_DATE + INTERVAL '30 days'
        ), 0) +
        COALESCE((
          SELECT SUM(t.amount) / 12.0
          FROM locacoes_veicular_transactions t
          WHERE t.vehicle_id = v.id
            AND t.type = 'despesa'
            AND t.description ILIKE '%anual%'
        ), 0)
      )
    )
    ELSE NULL 
  END AS payback_meses
  
FROM locacoes_veicular_vehicles v
WHERE v.status IN ('alugado', 'disponivel');