import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AsaasWebhook {
  event: string // 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', etc
  payment: {
    id: string
    customer: string
    value: number
    status: string
    dateCreated: string
    dueDate: string
    confirmedDate?: string
    externalReference?: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhook: AsaasWebhook = await req.json()
    console.log('📩 Webhook Asaas recebido:', webhook.event, webhook.payment.id)

    // Buscar payment_link pelo external_id (ID do Asaas)
    const { data: paymentLink, error: linkError } = await supabase
      .from('locacoes_veicular_payment_links')
      .select('*')
      .eq('provider', 'asaas')
      .eq('external_id', webhook.payment.id)
      .maybeSingle()

    if (linkError || !paymentLink) {
      console.error('❌ Payment link não encontrado:', webhook.payment.id)
      return new Response(JSON.stringify({ error: 'Payment link not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Payment link encontrado:', paymentLink.id)

    // Processar evento
    if (webhook.event === 'PAYMENT_RECEIVED' || webhook.event === 'PAYMENT_CONFIRMED') {
      console.log('💰 Pagamento confirmado!')

      // Atualizar payment_link
      await supabase
        .from('locacoes_veicular_payment_links')
        .update({
          status: 'received',
          paid_at: new Date().toISOString(),
          webhook_data: webhook,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentLink.id)

      // Marcar transaction como paga (se existir)
      if (paymentLink.transaction_id) {
        const { error: txError } = await supabase.rpc('locacoes_veicular_transaction_mark_paid', {
          p_transaction_id: paymentLink.transaction_id,
          p_paid_at: new Date().toISOString()
        })
        
        if (txError) {
          console.error('❌ Erro ao marcar transaction:', txError)
        } else {
          console.log('✅ Transaction marcada como paga:', paymentLink.transaction_id)
        }
      }

      // Enviar mensagem de confirmação ao cliente
      if (paymentLink.customer_phone && !paymentLink.confirmation_sent) {
        const confirmMsg = `✅ *PAGAMENTO CONFIRMADO!* ✅\n\n` +
          `Recebemos seu pagamento de R$ ${(paymentLink.amount_cents / 100).toFixed(2)}!\n\n` +
          `Obrigado pela preferência! 🎉`

        const { error: waError } = await supabase.rpc('locacoes_veicular_wa_send_sql', {
          p_tenant: paymentLink.tenant_id,
          p_to: paymentLink.customer_phone,
          p_text: confirmMsg
        })

        if (waError) {
          console.error('❌ Erro ao enviar WhatsApp:', waError)
        } else {
          // Marcar confirmação enviada
          await supabase
            .from('locacoes_veicular_payment_links')
            .update({ confirmation_sent: true })
            .eq('id', paymentLink.id)

          console.log('✅ Mensagem de confirmação enviada')
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('❌ Erro no webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
