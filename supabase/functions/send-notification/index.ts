/* eslint-disable */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decryption helper
async function importKey(baseKey: string) {
  const keyBytes = new TextEncoder().encode(baseKey);
  return await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
}

async function decryptString(ciphertext: string, ivBase64: string, baseKey: string) {
  const key = await importKey(baseKey);
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(plaintext);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const ENCRYPTION_KEY = Deno.env.get('INTEGRATION_ENCRYPTION_KEY') ?? '';

    if (!ENCRYPTION_KEY) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { tenantId, channel, recipient, templateKey, variables = {} } = body;

    if (!tenantId || !channel || !recipient) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get integration for this channel and tenant
    const providerMap: Record<string, string> = {
      whatsapp: 'twilio',
      sms: 'twilio',
      email: 'sendgrid',
    };

    const provider = providerMap[channel] || 'twilio';

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('locacoes_veicular_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ 
        error: 'No active integration found for this channel',
        details: integrationError?.message 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Decrypt API key
    let apiKey = '';
    if (integration.api_key_encrypted && integration.api_key_iv) {
      try {
        apiKey = await decryptString(
          integration.api_key_encrypted,
          integration.api_key_iv,
          ENCRYPTION_KEY
        );
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
        return new Response(JSON.stringify({ error: 'Failed to decrypt API key' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Get template
    let messageBody = variables.message || 'Mensagem padrão';
    let messageSubject = variables.subject || '';

    if (templateKey) {
      const { data: template } = await supabaseAdmin
        .from('locacoes_veicular_integration_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('channel', channel)
        .eq('template_key', templateKey)
        .eq('is_active', true)
        .maybeSingle();

      if (template) {
        messageBody = template.body;
        messageSubject = template.subject || '';
        
        // Replace variables in template
        Object.entries(variables).forEach(([key, value]) => {
          messageBody = messageBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
          messageSubject = messageSubject.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        });
      }
    }

    let result = null;
    let status = 'failed';
    let errorMessage = '';

    // Send based on channel
    try {
      if (channel === 'email' && provider === 'sendgrid') {
        // SendGrid email
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipient }] }],
            from: { email: integration.config?.from_email || 'noreply@example.com' },
            subject: messageSubject,
            content: [{ type: 'text/plain', value: messageBody }],
          }),
        });

        if (sendgridResponse.ok) {
          status = 'sent';
          result = { sendgridStatus: sendgridResponse.status };
        } else {
          errorMessage = await sendgridResponse.text();
        }
      } else if ((channel === 'whatsapp' || channel === 'sms') && provider === 'twilio') {
        // Twilio SMS/WhatsApp
        const accountSid = integration.config?.account_sid || '';
        const fromNumber = integration.config?.from_number || '';
        const toNumber = channel === 'whatsapp' ? `whatsapp:${recipient}` : recipient;
        const fromFormatted = channel === 'whatsapp' ? `whatsapp:${fromNumber}` : fromNumber;

        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${accountSid}:${apiKey}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: toNumber,
              From: fromFormatted,
              Body: messageBody,
            }),
          }
        );

        if (twilioResponse.ok) {
          status = 'sent';
          result = await twilioResponse.json();
        } else {
          errorMessage = await twilioResponse.text();
        }
      } else {
        errorMessage = 'Unsupported channel or provider';
      }
    } catch (sendError) {
      errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error';
      console.error('Send error:', sendError);
    }

    // Log the notification attempt
    await supabaseAdmin.from('locacoes_veicular_notification_logs').insert({
      tenant_id: tenantId,
      channel,
      provider,
      template_key: templateKey,
      recipient,
      message: messageBody,
      status,
      error_message: errorMessage || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    });

    return new Response(
      JSON.stringify({ 
        success: status === 'sent',
        status,
        error: errorMessage || undefined,
        result 
      }), 
      { 
        status: status === 'sent' ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (err) {
    console.error('send-notification error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
