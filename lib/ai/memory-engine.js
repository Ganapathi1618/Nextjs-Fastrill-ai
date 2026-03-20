// lib/ai/memory-engine.js
// Load and update customer memory for personalization

import { createClient } from "@supabase/supabase-js"
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function loadMemory({ userId, phone, customerId }) {
  try {
    const { data } = await supabaseAdmin
      .from("customer_memory")
      .select("*")
      .eq("user_id", userId)
      .eq("phone", phone)
      .maybeSingle()
    return data || null
  } catch(e) {
    console.warn("[memory-engine] Load failed:", e.message)
    return null
  }
}

export async function updateMemory({ userId, phone, customerId, intent, entities, sentiment, bookingCreated, serviceUsed }) {
  try {
    const existing = await loadMemory({ userId, phone, customerId })
    const now = new Date().toISOString()

    const updates = {
      user_id:    userId,
      phone,
      customer_id: customerId || null,
      updated_at: now
    }

    // Update preferred language if detected
    if (entities?.language) updates.preferred_language = entities.language

    // Track preferred services
    if (serviceUsed && bookingCreated) {
      const current = existing?.preferred_services || []
      if (!current.includes(serviceUsed)) {
        updates.preferred_services = [...current, serviceUsed].slice(-5) // keep last 5
      }
    }

    // Update sentiment tendency
    if (sentiment && sentiment !== "neutral") {
      updates.sentiment_tendency = sentiment
    }

    // Update customer type based on booking count
    if (bookingCreated) {
      const { count } = await supabaseAdmin.from("bookings")
        .select("id", { count: "exact" })
        .eq("customer_phone", phone)
        .eq("user_id", userId)
        .in("status", ["confirmed","completed"])
      if (count >= 5)      updates.customer_type = "vip"
      else if (count >= 2) updates.customer_type = "returning"
      else                 updates.customer_type = "new"
    }

    // Track complaints
    if (intent?.primary_intent === "complaint") {
      updates.last_complaint_at = now
    }

    await supabaseAdmin.from("customer_memory")
      .upsert(updates, { onConflict: "user_id,phone" })

  } catch(e) {
    console.warn("[memory-engine] Update failed:", e.message)
  }
}
