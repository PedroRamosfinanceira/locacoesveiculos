-- Script para marcar pedrohenrique@ramosfinanceira.com.br como SaaS Admin
-- Execute este SQL no Supabase SQL Editor

-- 1. Primeiro, vamos buscar o ID do usuário pelo email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id a partir do email no auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'pedrohenrique@ramosfinanceira.com.br'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário com email pedrohenrique@ramosfinanceira.com.br não encontrado no auth.users';
    RAISE NOTICE 'Crie este usuário primeiro através da tela de cadastro';
  ELSE
    RAISE NOTICE 'Usuário encontrado: %', v_user_id;
    
    -- Atualizar ou inserir perfil com is_saas_admin = true
    INSERT INTO public.locacoes_veicular_profiles (
      id,
      name,
      is_saas_admin,
      is_active,
      role
    )
    VALUES (
      v_user_id,
      'Pedro Henrique - SaaS Admin',
      true,
      true,
      'admin'
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      is_saas_admin = true,
      is_active = true,
      role = 'admin',
      name = COALESCE(EXCLUDED.name, locacoes_veicular_profiles.name);
    
    RAISE NOTICE 'Perfil atualizado com sucesso! is_saas_admin = true';
  END IF;
END $$;

-- 2. Verificar se foi atualizado corretamente
SELECT 
  p.id,
  p.name,
  p.is_saas_admin,
  p.is_active,
  p.role,
  u.email
FROM public.locacoes_veicular_profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'pedrohenrique@ramosfinanceira.com.br';
