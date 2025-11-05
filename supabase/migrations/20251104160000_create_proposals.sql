-- Criar tabela de propostas de locação
CREATE TABLE IF NOT EXISTS public.locacoes_veicular_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.locacoes_veicular_tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.locacoes_veicular_clients(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.locacoes_veicular_vehicles(id) ON DELETE CASCADE,
  
  -- Dados da proposta
  proposal_number TEXT UNIQUE, -- P-2024-001
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_value DECIMAL(10, 2) NOT NULL,
  
  -- Detalhes adicionais
  observations TEXT,
  payment_method TEXT, -- pix, boleto, cartao
  payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted', 'expired')),
  
  -- Aprovação
  approved_by UUID REFERENCES public.locacoes_veicular_profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Conversão para contrato
  contract_id UUID REFERENCES public.locacoes_veicular_contracts(id),
  converted_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES public.locacoes_veicular_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_proposals_tenant ON public.locacoes_veicular_proposals(tenant_id);
CREATE INDEX idx_proposals_client ON public.locacoes_veicular_proposals(client_id);
CREATE INDEX idx_proposals_vehicle ON public.locacoes_veicular_proposals(vehicle_id);
CREATE INDEX idx_proposals_status ON public.locacoes_veicular_proposals(status);
CREATE INDEX idx_proposals_created_at ON public.locacoes_veicular_proposals(created_at DESC);

-- RLS
ALTER TABLE public.locacoes_veicular_proposals ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - usuários podem ver propostas do próprio tenant
CREATE POLICY "proposals_tenant_select" 
ON public.locacoes_veicular_proposals
FOR SELECT 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM public.locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: INSERT - usuários podem criar propostas no próprio tenant
CREATE POLICY "proposals_tenant_insert" 
ON public.locacoes_veicular_proposals
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = (
    SELECT tenant_id 
    FROM public.locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: UPDATE - apenas admins podem atualizar propostas
CREATE POLICY "proposals_admin_update" 
ON public.locacoes_veicular_proposals
FOR UPDATE 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM public.locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
  AND (
    SELECT role 
    FROM public.locacoes_veicular_profiles 
    WHERE id = auth.uid()
  ) IN ('admin', 'owner')
);

-- Policy: DELETE - apenas admins podem deletar propostas
CREATE POLICY "proposals_admin_delete" 
ON public.locacoes_veicular_proposals
FOR DELETE 
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM public.locacoes_veicular_profiles 
    WHERE id = auth.uid()
  )
  AND (
    SELECT role 
    FROM public.locacoes_veicular_profiles 
    WHERE id = auth.uid()
  ) IN ('admin', 'owner')
);

-- Função para gerar número de proposta
CREATE OR REPLACE FUNCTION public.generate_proposal_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Contar propostas do ano atual
  SELECT COUNT(*) INTO v_count
  FROM public.locacoes_veicular_proposals
  WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  v_count := v_count + 1;
  v_number := 'P-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proposals_updated_at
BEFORE UPDATE ON public.locacoes_veicular_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_proposals_updated_at();

-- Grants
GRANT SELECT, INSERT ON public.locacoes_veicular_proposals TO authenticated;
GRANT UPDATE, DELETE ON public.locacoes_veicular_proposals TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_proposal_number(UUID) TO authenticated;
