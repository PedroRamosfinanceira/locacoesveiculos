-- Drop policy if exists and recreate
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'locacoes_veicular_profiles' 
    AND policyname = 'profiles_self_read'
  ) THEN
    DROP POLICY profiles_self_read ON public.locacoes_veicular_profiles;
  END IF;
END $$;

-- Criar policy para usuário ler próprio profile
CREATE POLICY profiles_self_read
ON public.locacoes_veicular_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());