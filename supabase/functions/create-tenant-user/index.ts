import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { email, password, name, phone, role, tenantId, permissions } = await req.json();

    console.log('Creating user request:', { email, tenantId, requestingUserId: user.id });

    // Buscar perfil do usuário autenticado
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('locacoes_veicular_profiles')
      .select('id, tenant_id, is_saas_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Profile not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Requesting user profile:', { profile });

    const isSaasAdmin = profile.is_saas_admin === true;
    let targetTenantId: string;

    // Para SaaS Admin: pode criar em qualquer tenant (usa tenantId da request)
    // Para Admin regular: só pode criar no seu próprio tenant
    if (isSaasAdmin) {
      if (!tenantId) {
        return new Response(
          JSON.stringify({ error: 'Tenant ID required for SaaS admin' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetTenantId = tenantId;
      console.log('SaaS Admin creating user for tenant:', targetTenantId);
    } else {
      // Não é SaaS admin - DEVE usar seu próprio tenant
      if (!profile.tenant_id) {
        return new Response(
          JSON.stringify({ error: 'User has no tenant assigned' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verificar se é admin do seu tenant
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('locacoes_veicular_user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenant_id)
        .eq('role', 'admin')
        .single();

      console.log('User role check:', { roleData, roleError });

      if (roleError || !roleData) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Only tenant admin can create users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetTenantId = profile.tenant_id;
      console.log('Tenant Admin creating user for own tenant:', targetTenantId);
    }

    // 1. Criar usuário no auth.users
    console.log('Creating auth user...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (createError || !newUser.user) {
      console.error('Failed to create auth user:', createError);
      throw new Error('Failed to create user: ' + createError?.message);
    }

    console.log('Auth user created:', newUser.user.id);

    // 2. Criar perfil
    console.log('Creating profile...');
    const { error: profileInsertError } = await supabaseAdmin
      .from('locacoes_veicular_profiles')
      .insert({
        id: newUser.user.id,
        tenant_id: targetTenantId,
        name,
        phone,
        role: role || 'user',
        is_active: true,
      });

    if (profileInsertError) {
      console.error('Failed to create profile:', profileInsertError);
      throw new Error('Failed to create profile: ' + (profileInsertError as any).message);
    }

    console.log('Profile created');

    // 3. Criar role
    console.log('Creating role...');
    const { error: roleError } = await supabaseAdmin
      .from('locacoes_veicular_user_roles')
      .insert({
        user_id: newUser.user.id,
        tenant_id: targetTenantId,
        role: role || 'user',
      });

    if (roleError) {
      console.error('Failed to create role:', roleError);
      throw new Error('Failed to create role: ' + roleError.message);
    }

    console.log('Role created');

    // 4. Inserir permissões
    if (permissions && permissions.length > 0) {
      console.log('Creating permissions:', permissions);
      const { error: permError } = await supabaseAdmin
        .from('locacoes_veicular_user_permissions')
        .insert(
          permissions.map((permission: string) => ({
            user_id: newUser.user.id,
            tenant_id: targetTenantId,
            permission,
          }))
        );

      if (permError) {
        console.error('Failed to create permissions:', permError);
      } else {
        console.log('Permissions created');
      }
    }

    // 5. Enviar email de boas-vindas (opcional, implementar depois com Resend)
    // TODO: Enviar email com senha temporária

    console.log('User created successfully:', newUser.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating user:', errorMessage, error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
