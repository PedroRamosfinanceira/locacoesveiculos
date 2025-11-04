-- Remover policies recursivas em profiles
DROP POLICY IF EXISTS "locacoes_veicular_profiles_all_policy" ON public.locacoes_veicular_profiles;
DROP POLICY IF EXISTS "locacoes_veicular_profiles_select_policy" ON public.locacoes_veicular_profiles;

-- Garantir leitura do próprio perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='locacoes_veicular_profiles' AND policyname='profiles_self_read'
  ) THEN
    CREATE POLICY "profiles_self_read"
    ON public.locacoes_veicular_profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());
  END IF;
END$$;

-- Funções auxiliares sem recursão
CREATE OR REPLACE FUNCTION public.me_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.locacoes_veicular_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.me_is_saas_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_saas_admin FROM public.locacoes_veicular_profiles WHERE id = auth.uid()
$$;

-- Update seguro do próprio perfil (sem sub-select recursivo)
DROP POLICY IF EXISTS "profiles_self_safe_update" ON public.locacoes_veicular_profiles;
CREATE POLICY "profiles_self_safe_update"
ON public.locacoes_veicular_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role IS NOT DISTINCT FROM public.me_role()
  AND is_saas_admin IS NOT DISTINCT FROM public.me_is_saas_admin()
);

-- user_roles: habilitar RLS e criar policies
ALTER TABLE public.locacoes_veicular_user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lv_roles_sel" ON public.locacoes_veicular_user_roles;
DROP POLICY IF EXISTS "lv_roles_admin_all" ON public.locacoes_veicular_user_roles;

CREATE POLICY "lv_roles_sel"
ON public.locacoes_veicular_user_roles
FOR SELECT TO authenticated
USING (tenant_id = public.me_tenant());

CREATE POLICY "lv_roles_admin_all"
ON public.locacoes_veicular_user_roles
FOR ALL TO authenticated
USING (public.has_locacoes_role(auth.uid(), public.me_tenant(), 'admin'))
WITH CHECK (tenant_id = public.me_tenant());