-- =====================================================
-- MIGRATION: AI Payment Prediction System
-- Description: Creates views and functions for AI-based 
--              payment prediction and risk scoring
-- =====================================================

-- View: Historical payment behavior by client
CREATE OR REPLACE VIEW locacoes_veicular_v_payment_history AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  c.tenant_id,
  COUNT(t.id) as total_transactions,
  COUNT(CASE WHEN t.status = 'pago' AND t.paid_at <= t.due_date THEN 1 END) as paid_on_time,
  COUNT(CASE WHEN t.status = 'pago' AND t.paid_at > t.due_date THEN 1 END) as paid_late,
  COUNT(CASE WHEN t.status IN ('atrasado', 'pendente') AND t.due_date < CURRENT_DATE THEN 1 END) as never_paid,
  COALESCE(AVG(
    CASE 
      WHEN t.status = 'pago' AND t.paid_at > t.due_date 
      THEN EXTRACT(DAY FROM t.paid_at - t.due_date)
      ELSE 0 
    END
  ), 0) as average_delay_days,
  SUM(COALESCE(t.amount, 0)) as total_amount,
  MAX(t.paid_at) as last_payment_date,
  -- Calculate payment rate
  ROUND(
    (COUNT(CASE WHEN t.status = 'pago' THEN 1 END)::numeric / NULLIF(COUNT(t.id), 0)) * 100, 
    2
  ) as payment_rate_percent,
  -- Calculate average payment delay
  ROUND(
    COALESCE(AVG(
      CASE 
        WHEN t.status = 'pago' AND t.paid_at IS NOT NULL 
        THEN EXTRACT(DAY FROM t.paid_at - t.due_date)
      END
    ), 0),
    1
  ) as avg_payment_delay_days,
  -- Total overdue amount
  SUM(
    CASE 
      WHEN t.status IN ('atrasado', 'pendente') AND t.due_date < CURRENT_DATE 
      THEN t.amount 
      ELSE 0 
    END
  ) as total_overdue_amount
FROM 
  locacoes_veicular_clients c
  LEFT JOIN locacoes_veicular_contracts ct ON ct.client_id = c.id
  LEFT JOIN locacoes_veicular_transactions t ON t.contract_id = ct.id AND t.type = 'receita'
GROUP BY 
  c.id, c.name, c.tenant_id;

-- Grant access
GRANT SELECT ON locacoes_veicular_v_payment_history TO authenticated;

-- View: Risk scoring for clients
CREATE OR REPLACE VIEW locacoes_veicular_v_client_risk_score AS
SELECT 
  ph.client_id,
  ph.client_name,
  ph.tenant_id,
  -- Calculate risk score (0-1000)
  GREATEST(0, LEAST(1000, 
    ROUND(
      -- Base score starts at 800
      800
      -- Deduct points for late payments (up to -400 points)
      - (CASE 
          WHEN ph.total_transactions > 0 
          THEN (ph.paid_late::numeric / ph.total_transactions) * 400
          ELSE 0 
        END)
      -- Deduct points for never paid (up to -300 points)
      - (CASE 
          WHEN ph.total_transactions > 0 
          THEN (ph.never_paid::numeric / ph.total_transactions) * 300
          ELSE 0 
        END)
      -- Deduct points for high average delay (up to -200 points)
      - LEAST(200, ph.average_delay_days * 10)
      -- Add bonus for payment rate > 90% (up to +200 points)
      + (CASE 
          WHEN ph.payment_rate_percent >= 90 THEN 150
          WHEN ph.payment_rate_percent >= 80 THEN 100
          WHEN ph.payment_rate_percent >= 70 THEN 50
          ELSE 0
        END)
    )
  )) as risk_score,
  -- Risk level classification
  CASE 
    WHEN (
      800
      - (CASE WHEN ph.total_transactions > 0 THEN (ph.paid_late::numeric / ph.total_transactions) * 400 ELSE 0 END)
      - (CASE WHEN ph.total_transactions > 0 THEN (ph.never_paid::numeric / ph.total_transactions) * 300 ELSE 0 END)
      - LEAST(200, ph.average_delay_days * 10)
      + (CASE WHEN ph.payment_rate_percent >= 90 THEN 150 WHEN ph.payment_rate_percent >= 80 THEN 100 WHEN ph.payment_rate_percent >= 70 THEN 50 ELSE 0 END)
    ) >= 700 THEN 'low'
    WHEN (
      800
      - (CASE WHEN ph.total_transactions > 0 THEN (ph.paid_late::numeric / ph.total_transactions) * 400 ELSE 0 END)
      - (CASE WHEN ph.total_transactions > 0 THEN (ph.never_paid::numeric / ph.total_transactions) * 300 ELSE 0 END)
      - LEAST(200, ph.average_delay_days * 10)
      + (CASE WHEN ph.payment_rate_percent >= 90 THEN 150 WHEN ph.payment_rate_percent >= 80 THEN 100 WHEN ph.payment_rate_percent >= 70 THEN 50 ELSE 0 END)
    ) >= 500 THEN 'medium'
    WHEN (
      800
      - (CASE WHEN ph.total_transactions > 0 THEN (ph.paid_late::numeric / ph.total_transactions) * 400 ELSE 0 END)
      - (CASE WHEN ph.total_transactions > 0 THEN (ph.never_paid::numeric / ph.total_transactions) * 300 ELSE 0 END)
      - LEAST(200, ph.average_delay_days * 10)
      + (CASE WHEN ph.payment_rate_percent >= 90 THEN 150 WHEN ph.payment_rate_percent >= 80 THEN 100 WHEN ph.payment_rate_percent >= 70 THEN 50 ELSE 0 END)
    ) >= 300 THEN 'high'
    ELSE 'critical'
  END as risk_level,
  -- Probability of default (%)
  ROUND(
    CASE 
      WHEN ph.total_transactions = 0 THEN 50 -- No history = 50% risk
      ELSE LEAST(100, 
        (ph.never_paid::numeric / NULLIF(ph.total_transactions, 0)) * 100 +
        (ph.average_delay_days * 2)
      )
    END,
    1
  ) as probability_of_default_percent,
  -- Predicted delay in days
  ROUND(
    CASE 
      WHEN ph.average_delay_days > 0 THEN ph.average_delay_days * 1.2
      ELSE 0
    END
  ) as predicted_delay_days,
  -- Payment history metrics
  ph.total_transactions,
  ph.paid_on_time,
  ph.paid_late,
  ph.never_paid,
  ph.payment_rate_percent,
  ph.average_delay_days,
  ph.total_overdue_amount,
  ph.last_payment_date,
  CURRENT_TIMESTAMP as last_updated
FROM 
  locacoes_veicular_v_payment_history ph;

-- Grant access
GRANT SELECT ON locacoes_veicular_v_client_risk_score TO authenticated;

-- View: Upcoming transactions with risk prediction
CREATE OR REPLACE VIEW locacoes_veicular_v_payment_predictions AS
SELECT 
  t.id as transaction_id,
  t.tenant_id,
  t.contract_id,
  t.due_date,
  t.amount,
  t.description,
  t.status,
  c.id as client_id,
  c.name as client_name,
  c.phone as client_phone,
  c.email as client_email,
  rs.risk_score,
  rs.risk_level,
  rs.probability_of_default_percent,
  rs.predicted_delay_days,
  -- Predicted payment date
  (t.due_date + (rs.predicted_delay_days || ' days')::interval)::date as predicted_payment_date,
  -- Confidence level (inverse of default probability)
  (100 - rs.probability_of_default_percent) as confidence_percent,
  -- Days until due
  (t.due_date - CURRENT_DATE) as days_until_due,
  -- Recommended actions based on risk
  CASE 
    WHEN rs.risk_level = 'critical' AND (t.due_date - CURRENT_DATE) <= 7 THEN 
      ARRAY['Ligar urgentemente', 'Enviar WhatsApp', 'Considerar antecipação com desconto']
    WHEN rs.risk_level = 'high' AND (t.due_date - CURRENT_DATE) <= 10 THEN 
      ARRAY['Enviar lembrete WhatsApp', 'Oferecer facilidade de pagamento', 'Agendar contato']
    WHEN rs.risk_level = 'medium' AND (t.due_date - CURRENT_DATE) <= 5 THEN 
      ARRAY['Enviar lembrete por email', 'Disponibilizar Pix']
    WHEN rs.risk_level = 'low' THEN 
      ARRAY['Lembrete padrão 3 dias antes']
    ELSE 
      ARRAY['Monitorar']
  END as recommended_actions
FROM 
  locacoes_veicular_transactions t
  INNER JOIN locacoes_veicular_contracts ct ON ct.id = t.contract_id
  INNER JOIN locacoes_veicular_clients c ON c.id = ct.client_id
  LEFT JOIN locacoes_veicular_v_client_risk_score rs ON rs.client_id = c.id
WHERE 
  t.type = 'receita'
  AND t.status = 'pendente'
  AND t.due_date >= CURRENT_DATE
  AND t.due_date <= (CURRENT_DATE + interval '30 days');

-- Grant access
GRANT SELECT ON locacoes_veicular_v_payment_predictions TO authenticated;

-- Function: Get risk factors for a client
CREATE OR REPLACE FUNCTION locacoes_veicular_get_risk_factors(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_factors jsonb;
  v_history record;
BEGIN
  -- Get payment history
  SELECT * INTO v_history
  FROM locacoes_veicular_v_payment_history
  WHERE client_id = p_client_id;

  -- Build factors array
  v_factors := jsonb_build_array();

  -- Factor 1: Payment rate
  IF v_history.payment_rate_percent >= 90 THEN
    v_factors := v_factors || jsonb_build_object(
      'factor', 'payment_rate',
      'weight', 0.3,
      'impact', 'positive',
      'value', v_history.payment_rate_percent,
      'description', format('Taxa de pagamento excelente: %s%%', v_history.payment_rate_percent)
    );
  ELSIF v_history.payment_rate_percent < 60 THEN
    v_factors := v_factors || jsonb_build_object(
      'factor', 'payment_rate',
      'weight', 0.3,
      'impact', 'negative',
      'value', v_history.payment_rate_percent,
      'description', format('Taxa de pagamento baixa: %s%%', v_history.payment_rate_percent)
    );
  END IF;

  -- Factor 2: Average delay
  IF v_history.average_delay_days > 7 THEN
    v_factors := v_factors || jsonb_build_object(
      'factor', 'average_delay',
      'weight', 0.25,
      'impact', 'negative',
      'value', v_history.average_delay_days,
      'description', format('Atraso médio de %s dias', ROUND(v_history.average_delay_days))
    );
  ELSIF v_history.average_delay_days <= 2 THEN
    v_factors := v_factors || jsonb_build_object(
      'factor', 'average_delay',
      'weight', 0.25,
      'impact', 'positive',
      'value', v_history.average_delay_days,
      'description', 'Histórico de pagamentos pontuais'
    );
  END IF;

  -- Factor 3: Never paid transactions
  IF v_history.never_paid > 0 THEN
    v_factors := v_factors || jsonb_build_object(
      'factor', 'unpaid_count',
      'weight', 0.25,
      'impact', 'negative',
      'value', v_history.never_paid,
      'description', format('%s transações não pagas', v_history.never_paid)
    );
  END IF;

  -- Factor 4: Overdue amount
  IF v_history.total_overdue_amount > 0 THEN
    v_factors := v_factors || jsonb_build_object(
      'factor', 'overdue_amount',
      'weight', 0.2,
      'impact', 'negative',
      'value', v_history.total_overdue_amount,
      'description', format('R$ %s em atraso', TO_CHAR(v_history.total_overdue_amount, 'FM999G999G999D00'))
    );
  END IF;

  RETURN v_factors;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION locacoes_veicular_get_risk_factors(uuid) TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_prediction 
ON locacoes_veicular_transactions(type, status, due_date) 
WHERE type = 'receita' AND status = 'pendente';

CREATE INDEX IF NOT EXISTS idx_transactions_paid_at 
ON locacoes_veicular_transactions(paid_at, due_date) 
WHERE status = 'pago';

-- Add comment
COMMENT ON VIEW locacoes_veicular_v_payment_history IS 
  'Historical payment behavior analysis for AI predictions';
COMMENT ON VIEW locacoes_veicular_v_client_risk_score IS 
  'AI-based risk scoring system for clients (0-1000 scale)';
COMMENT ON VIEW locacoes_veicular_v_payment_predictions IS 
  'Predicted payment dates and recommended actions for upcoming transactions';
