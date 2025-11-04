-- 1) Garantir USAGE no schema e privilégios base
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2) GRANTs essenciais (RLS continuará protegendo o acesso por tenant)
GRANT SELECT, UPDATE ON public.locacoes_veicular_profiles TO authenticated;
GRANT SELECT ON public.locacoes_veicular_user_roles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON 
  public.locacoes_veicular_vehicles,
  public.locacoes_veicular_vehicle_methods,
  public.locacoes_veicular_clients,
  public.locacoes_veicular_contracts,
  public.locacoes_veicular_transactions,
  public.locacoes_veicular_categories,
  public.locacoes_veicular_doc_templates,
  public.locacoes_veicular_doc_instances,
  public.locacoes_veicular_integration_settings
TO authenticated;

GRANT SELECT, INSERT ON 
  public.locacoes_veicular_activity_logs,
  public.locacoes_veicular_email_logs,
  public.locacoes_veicular_wa_logs,
  public.locacoes_veicular_webhook_inbox
TO authenticated;

GRANT SELECT ON 
  public.locacoes_veicular_tenants,
  public.locacoes_veicular_subscriptions,
  public.locacoes_veicular_plans,
  public.locacoes_veicular_invoices
TO authenticated;

GRANT SELECT ON 
  public.locacoes_veicular_v_kpis_mensais,
  public.locacoes_veicular_v_contas_receber_mes,
  public.locacoes_veicular_v_contas_pagar_mes,
  public.locacoes_veicular_v_roi_frota,
  public.locacoes_veicular_v_veiculos_disponiveis,
  public.locacoes_veicular_v_veiculos_alugados,
  public.locacoes_veicular_v_veiculos_manutencao
TO authenticated;

-- Sequences (para IDs auto-incrementáveis)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3) Trigger para inicializar tenant/role no insert do perfil
DROP TRIGGER IF EXISTS locacoes_profiles_init_tenant ON public.locacoes_veicular_profiles;
CREATE TRIGGER locacoes_profiles_init_tenant
BEFORE INSERT ON public.locacoes_veicular_profiles
FOR EACH ROW EXECUTE FUNCTION public.locacoes_veicular_init_tenant();

-- 4) RPC para garantir criação de perfil no primeiro login
CREATE OR REPLACE FUNCTION public.locacoes_veicular_ensure_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.locacoes_veicular_profiles WHERE id = auth.uid()
  ) THEN
    INSERT INTO public.locacoes_veicular_profiles (id, name)
    VALUES (auth.uid(), NULL);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.locacoes_veicular_ensure_profile() TO authenticated;