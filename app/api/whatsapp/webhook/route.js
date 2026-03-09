import { createClient } from '@supabase/supabase-js'

// ============================================
// FASTRILL WHATSAPP WEBHOOK
// File: app/api/whatsapp/webhook/route.js
// ============================================

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'fastrill2024'
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ============================================
// GET - Webhook Verification
// ============================================
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified')
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// ============================================
// POST - Receive Messages
// ============================================
export async function POST(request) {
  try {
    const body = await request.json()
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return new Response('OK', { status: 200 })
    }

    const value = body.entry[0].changes[0].value
    const messages = value.messages
    const contacts = value.contacts || []

    for (const message of messages) {
      await processMessage(message, contacts)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('OK', { status: 200 })
  }
}

// ============================================
// PROCESS MESSAGE
// ============================================
async function processMessage(message, contacts) {
  const phone = message.from
  const waMessageId = message.id
  const messageType = message.type
  const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString()

  let messageText = ''
  if (messageType === 'text') messageText = message.text?.body || ''
  else if (messageType === 'image') messageText = '[Image]'
  else if (messageType === 'audio') messageText = '[Voice message]'
  else if (messageType === 'document') messageText = '[Document]'
  else if (messageType === 'interactive') {
    messageText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '[Interactive]'
  }

  const contact = contacts.find(c => c.wa_id === phone)
  const contactName = contact?.profile?.name || 'Unknown'
  const formattedPhone = '+' + phone

  // 1. UPSERT CUSTOMER
  let customer = null
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', formattedPhone)
    .single()

  if (existingCustomer) {
    customer = existingCustomer
  } else {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({ phone: formattedPhone, name: contactName, source: 'whatsapp', tag: 'new_lead' })
      .select().single()
    customer = newCustomer
    console.log(`✅ New customer: ${contactName}`)
  }

  // 2. UPSERT CONVERSATION
  let conversation = null
  const { data: existingConvo } = await supabase
    .from('conversations')
    .select('*')
    .eq('phone', formattedPhone)
    .eq('status', 'open')
    .single()

  if (existingConvo) {
    const { data: updatedConvo } = await supabase
      .from('conversations')
      .update({
        last_message: messageText,
        last_message_at: timestamp,
        unread_count: existingConvo.unread_count + 1,
        updated_at: timestamp
      })
      .eq('id', existingConvo.id)
      .select().single()
    conversation = updatedConvo
  } else {
    const { data: newConvo } = await supabase
      .from('conversations')
      .insert({
        customer_id: customer?.id || null,
        phone: formattedPhone,
        status: 'open',
        ai_enabled: true,
        last_message: messageText,
        last_message_at: timestamp,
        unread_count: 1
      })
      .select().single()
    conversation = newConvo
    console.log(`✅ New conversation: ${formattedPhone}`)
  }

  // 3. SAVE INBOUND MESSAGE
  await supabase.from('messages').insert({
    conversation_id: conversation?.id || null,
    customer_phone: formattedPhone,
    direction: 'inbound',
    message_type: messageType,
    content: messageText,
    wa_message_id: waMessageId,
    status: 'delivered',
    is_ai: false,
    created_at: timestamp
  })

  // 4. CREATE LEAD (new customers only)
  if (customer && !existingCustomer) {
    await supabase.from('leads').insert({
      customer_id: customer.id,
      phone: formattedPhone,
      name: contactName,
      source: 'whatsapp',
      status: 'open',
      last_message: messageText,
      last_message_at: timestamp,
      ai_score: 60,
      score_intent: 60,
      score_recency: 80,
      score_source: 60,
      score_touchpoints: 40,
      days_inactive: 0
    })
    console.log(`✅ Lead created: ${contactName}`)
  }

  // 5. SEND AI REPLY (if enabled)
  if (conversation?.ai_enabled) {
    await sendSmartReply(phone, messageText, customer, conversation)
  }
}

// ============================================
// SMART REPLY (placeholder until Claude API)
// ============================================
async function sendSmartReply(phone, incomingMessage, customer, conversation) {
  try {
    const { data: settings } = await supabase.from('business_settings').select('*').single()
    const businessName = settings?.business_name || 'our salon'
    const firstName = customer?.name?.split(' ')[0] || 'there'
    const msg = incomingMessage.toLowerCase().trim()

    let replyText = ''

    if (msg.match(/^(hi|hello|hey|hii|helo|hai)$/)) {
      replyText = `Hi ${firstName}! 👋 Welcome to ${businessName}!\n\nHow can I help you today?\n\n💅 Book an appointment\n💰 Check prices & services\n⏰ Know our timings`
    } else if (msg.includes('book') || msg.includes('appointment') || msg.includes('slot')) {
      replyText = `I'd love to book you in, ${firstName}! 📅\n\nWhat service are you interested in, and what date works for you?`
    } else if (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('charge') || msg.includes('fees')) {
      replyText = `Here are our popular services 💆‍♀️\n\n✂️ Haircut — ₹300\n💆 Facial — ₹800\n💅 Manicure — ₹500\n🌿 Hair Spa — ₹1,200\n👰 Bridal Package — ₹8,000\n\nWould you like to book any of these?`
    } else if (msg.includes('time') || msg.includes('timing') || msg.includes('open') || msg.includes('hours') || msg.includes('available')) {
      const start = settings?.working_hours_start || '9:00 AM'
      const end = settings?.working_hours_end || '8:00 PM'
      replyText = `We're open ${start} to ${end}, Monday to Saturday! 🕐\n\nWould you like to book a slot?`
    } else if (msg.includes('cancel')) {
      replyText = `I can help you with that. Could you please share your appointment date or booking details so I can cancel it for you? 🙏`
    } else if (msg.includes('confirm') || msg.includes('yes') || msg.includes('ok') || msg.includes('okay')) {
      replyText = `Great! ✅ Your appointment is confirmed. We'll see you soon at ${businessName}! 😊\n\nNeed anything else?`
    } else {
      replyText = `Thanks for reaching out to ${businessName}! 😊\n\nOur team will assist you shortly. You can also:\n\n📅 Book an appointment\n💰 Ask about our services\n⏰ Check our timings`
    }

    if (!replyText) return

    await sendWhatsAppMessage(phone, replyText)

    // Save outbound message
    await supabase.from('messages').insert({
      conversation_id: conversation?.id || null,
      customer_phone: '+' + phone,
      direction: 'outbound',
      message_type: 'text',
      content: replyText,
      status: 'sent',
      is_ai: true,
      created_at: new Date().toISOString()
    })

    console.log(`✅ Smart reply sent to ${phone}`)
  } catch (error) {
    console.error('Reply error:', error)
  }
}

// ============================================
// SEND WHATSAPP MESSAGE
// ============================================
export async function sendWhatsAppMessage(phone, text) {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { body: text }
      })
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'WhatsApp send failed')
  return data
}
