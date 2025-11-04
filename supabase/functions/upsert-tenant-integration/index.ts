/* eslint-disable */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility: base64 encoder/decoder
const b64 = {
  encode: (u: Uint8Array) => {
    const s = typeof TextDecoder !== 'undefined' ? new TextDecoder().decode(u) : '';
    // fallback using fromCharCode
    let binary = '';
    for (let i = 0; i < u.length; i++) binary += String.fromCharCode(u[i]);
    return btoa(binary);
  },
  decode: (s: string) => {
    const binary = atob(s);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  },
};

// AES-GCM helper using Web Crypto (Deno supports Web Crypto API)
async function importKey(baseKey: string) {
  const keyBytes = new TextEncoder().encode(baseKey);
  return await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptString(plain: string, baseKey: string) {
  const key = await importKey(baseKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plain);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
  const ctBytes = new Uint8Array(ciphertext);
  return { ciphertext: btoa(String.fromCharCode(...Array.from(ctBytes))), iv: btoa(String.fromCharCode(...Array.from(iv))) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const ENCRYPTION_KEY = Deno.env.get('INTEGRATION_ENCRYPTION_KEY') ?? '';

    if (!ENCRYPTION_KEY) {
      console.error('Missing INTEGRATION_ENCRYPTION_KEY');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { provider, name, apiKey, config = {}, integrationId } = body || {};

    if (!provider) {
      return new Response(JSON.stringify({ error: 'provider required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify requester has rights to manage integrations in the tenant
    const { data: profile } = await supabaseAdmin
      .from('locacoes_veicular_profiles')
      .select('id, tenant_id, is_saas_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isSaasAdmin = profile.is_saas_admin === true;
    let targetTenantId: string | undefined;

    if (isSaasAdmin) {
      // SaaS admin must pass tenant_id in config or body
      targetTenantId = body.tenantId || profile.tenant_id;
      if (!targetTenantId) {
        return new Response(JSON.stringify({ error: 'tenantId required for saas admin' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      // verify role admin or owner in user's tenant
      const { data: roleData } = await supabaseAdmin
        .from('locacoes_veicular_user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      const role = (roleData as any)?.role;
      if (!(role === 'admin' || role === 'owner')) {
        return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      targetTenantId = profile.tenant_id;
    }

    // Encrypt apiKey server-side
    let encrypted = null;
    let preview = null;
    let iv = null;
    if (apiKey) {
      const encRes = await encryptString(apiKey, ENCRYPTION_KEY);
      encrypted = encRes.ciphertext;
      iv = encRes.iv;
      // masked preview: keep last 4 chars
      const last4 = apiKey.slice(-4);
      preview = `****${last4}`;
    }

    // Upsert into locacoes_veicular_integrations using service role
    if (integrationId) {
      const updatePayload: any = {
        provider,
        name,
        config,
        updated_at: 'now()',
        is_active: true,
      };
      if (encrypted) {
        updatePayload.api_key_encrypted = encrypted;
        updatePayload.api_key_iv = iv;
        updatePayload.api_key_preview = preview;
      }

      const { error: updateErr } = await supabaseAdmin
        .from('locacoes_veicular_integrations')
        .update(updatePayload)
        .eq('id', integrationId)
        .eq('tenant_id', targetTenantId);

      if (updateErr) {
        console.error('updateErr', updateErr);
        return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const insertPayload: any = {
      tenant_id: targetTenantId,
      provider,
      name,
      config,
      is_active: true,
    } as any;

    if (encrypted) {
      insertPayload.api_key_encrypted = encrypted;
      insertPayload.api_key_iv = iv;
      insertPayload.api_key_preview = preview;
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('locacoes_veicular_integrations')
      .insert(insertPayload)
      .select('*')
      .maybeSingle();

    if (insertErr) {
      console.error('insertErr', insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, integration: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('upsert-tenant-integration error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
