// lib/sequences/sequence-engine.js
// Drip sequence engine — Meta-template-only, works outside 24hr window

const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── HELPERS ────────────────────────────────────────────────────
function toPhone(p) {
  const d = (p || "").replace(/[^0-9]/g, "")
  if (d.length === 10) return "91" + d
  if (d.length === 12 && d.startsWith("91")) return d
  if (d.length === 11 && d.startsWith("0")) return "91" + d.slice(1)
  return d
}

function dedupe(p) {
  const d = (p || "").replace(/[^0-9]/g, "")
  return d.length >= 12 ? d.slice(-10) : d
}

function nowIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// ── SEND TEMPLATE VIA META ─────────────────────────────────────
async function sendTemplate({ accessToken, phoneNumberId, to, templateName, language, components }) {
  const phone = toPhone(to)
  if (phone.length < 10) return { ok: false, error: "invalid phone" }

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name:     templateName,
      language: { code: language || "en" },
    }
  }

  // Only add components if provided and non-empty
  if (components?.length) {
    payload.template.components = components
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method:  "POST",
        headers: {
          "Authorization": "Bearer " + accessToken,
          "Content-Type":  "application/json"
        },
        body: JSON.stringify(payload)
      }
    )
    const data = await res.json()
    if (data.error) {
      console.error("❌ Template send error:", data.error.message, "to:", phone)
      return { ok: false, error: data.error.message }
    }
    const waId = data?.messages?.[0]?.id
    console.log("✅ Template sent:", templateName, "to:", phone, "waId:", waId)
    return { ok: true, waId }
  } catch (e) {
    console.error("❌ Template send exception:", e.message)
    return { ok: false, error: e.message }
  }
}

// ── BUILD TEMPLATE COMPONENTS FOR A STEP ──────────────────────
// steps can optionally carry static vars like business_name, offer etc
// var_1 is always customer first name (auto-filled)
function buildComponents(step, leadName) {
  const firstName = (leadName || "there").split(" ")[0]
  const vars      = step.vars || {}

  // Build ordered parameter list: var_1=name, then rest in order
  const allKeys   = Object.keys(vars).sort()
  const bodyParams = []

  // Always inject first name as first param if template has {{1}}
  if (step.has_name_var !== false) {
    bodyParams.push({ type: "text", text: firstName })
  }

  // Add remaining vars in order
  for (const key of allKeys) {
    if (key !== "var_1") {
      bodyParams.push({ type: "text", text: String(vars[key] || "") })
    }
  }

  if (!bodyParams.length) return []

  return [{ type: "body", parameters: bodyParams }]
}

// ── ENROLL A LEAD INTO A SEQUENCE ─────────────────────────────
async function enrollLead({ userId, sequenceId, leadPhone, leadName }) {
  try {
    const phone = dedupe(leadPhone)

    // Check if already enrolled and active
    const { data: existing } = await supabaseAdmin
      .from("sequence_enrollments")
      .select("id, status")
      .eq("sequence_id", sequenceId)
      .eq("lead_phone", phone)
      .maybeSingle()

    if (existing?.status === "active") {
      return { ok: false, reason: "already_enrolled" }
    }

    // Get sequence to find first step
    const { data: seq } = await supabaseAdmin
      .from("sequences")
      .select("steps, status")
      .eq("id", sequenceId)
      .eq("user_id", userId)
      .maybeSingle()

    if (!seq || seq.status !== "active") {
      return { ok: false, reason: "sequence_not_found_or_paused" }
    }

    const steps = seq.steps || []
    if (!steps.length) return { ok: false, reason: "no_steps" }

    // First step: if day=0, send immediately (next_send_at = now)
    // Otherwise schedule for day X from now
    const firstStep    = steps[0]
    const firstSendAt  = addDays(nowIST(), firstStep.day || 0)

    const { data: enrollment, error } = await supabaseAdmin
      .from("sequence_enrollments")
      .upsert({
        user_id:      userId,
        sequence_id:  sequenceId,
        lead_phone:   phone,
        lead_name:    leadName || "Customer",
        current_step: 0,
        enrolled_at:  new Date().toISOString(),
        next_send_at: firstSendAt.toISOString(),
        status:       "active"
      }, { onConflict: "sequence_id,lead_phone" })
      .select("id")
      .single()

    if (error) {
      console.error("❌ Enroll error:", error.message)
      return { ok: false, error: error.message }
    }

    // Increment enrolled count on sequence
    await supabaseAdmin.rpc("increment_sequence_enrolled", { seq_id: sequenceId })
      .catch(() => {}) // ignore if RPC not created — not critical

    console.log("✅ Enrolled:", phone, "in sequence:", sequenceId)
    return { ok: true, enrollmentId: enrollment.id }
  } catch (e) {
    console.error("❌ enrollLead threw:", e.message)
    return { ok: false, error: e.message }
  }
}

// ── STOP AN ENROLLMENT ─────────────────────────────────────────
async function stopEnrollment({ leadPhone, userId, reason = "manual" }) {
  try {
    const phone = dedupe(leadPhone)
    await supabaseAdmin
      .from("sequence_enrollments")
      .update({
        status:         "stopped",
        stopped_reason: reason,
        updated_at:     new Date().toISOString()
      })
      .eq("lead_phone", phone)
      .eq("user_id", userId)
      .eq("status", "active")

    console.log("🛑 Stopped enrollment for:", phone, "reason:", reason)
    return { ok: true }
  } catch (e) {
    console.error("❌ stopEnrollment threw:", e.message)
    return { ok: false, error: e.message }
  }
}

// ── PROCESS ALL DUE ENROLLMENTS (called by cron) ───────────────
async function processDueEnrollments() {
  const now     = new Date().toISOString()
  let totalSent = 0, totalSkipped = 0, totalCompleted = 0

  try {
    // Get all active enrollments where next_send_at <= now
    const { data: dueEnrollments } = await supabaseAdmin
      .from("sequence_enrollments")
      .select("*")
      .eq("status", "active")
      .lte("next_send_at", now)
      .limit(500) // safety cap per run

    if (!dueEnrollments?.length) {
      return { ok: true, sent: 0, skipped: 0, completed: 0 }
    }

    console.log(`📋 Processing ${dueEnrollments.length} due enrollments`)

    // Group by user_id to batch-fetch connections
    const userIds = [...new Set(dueEnrollments.map(e => e.user_id))]

    // Fetch all needed whatsapp connections + sequences in parallel
    const [{ data: connections }, { data: sequences }] = await Promise.all([
      supabaseAdmin.from("whatsapp_connections")
        .select("user_id, access_token, phone_number_id")
        .in("user_id", userIds),
      supabaseAdmin.from("sequences")
        .select("id, steps, status")
        .in("id", [...new Set(dueEnrollments.map(e => e.sequence_id))])
    ])

    const connMap = Object.fromEntries((connections || []).map(c => [c.user_id, c]))
    const seqMap  = Object.fromEntries((sequences  || []).map(s => [s.id, s]))

    for (const enrollment of dueEnrollments) {
      try {
        const conn = connMap[enrollment.user_id]
        const seq  = seqMap[enrollment.sequence_id]

        if (!conn || !seq || seq.status !== "active") {
          totalSkipped++
          continue
        }

        const steps       = seq.steps || []
        const stepIndex   = enrollment.current_step
        const currentStep = steps[stepIndex]

        if (!currentStep) {
          // All steps done — mark completed
          await supabaseAdmin
            .from("sequence_enrollments")
            .update({ status: "completed", updated_at: now })
            .eq("id", enrollment.id)
          totalCompleted++
          continue
        }

        // Check if lead has since booked — if so stop sequence
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("user_id", enrollment.user_id)
          .eq("customer_phone", enrollment.lead_phone)
          .in("status", ["confirmed", "pending", "completed"])
          .limit(1)
          .maybeSingle()

        if (booking) {
          await supabaseAdmin
            .from("sequence_enrollments")
            .update({ status: "stopped", stopped_reason: "booked", updated_at: now })
            .eq("id", enrollment.id)
          totalSkipped++
          console.log("⏭ Skipped (booked):", enrollment.lead_phone)
          continue
        }

        // Build and send the template
        const components = buildComponents(currentStep, enrollment.lead_name)
        const result = await sendTemplate({
          accessToken:   conn.access_token,
          phoneNumberId: conn.phone_number_id,
          to:            enrollment.lead_phone,
          templateName:  currentStep.template_name,
          language:      currentStep.language || "en",
          components
        })

        if (result.ok) {
          // Advance to next step
          const nextStepIndex = stepIndex + 1
          const nextStep      = steps[nextStepIndex]

          if (nextStep) {
            // Calculate next send time based on day gap
            const dayGap      = nextStep.day - currentStep.day
            const nextSendAt  = addDays(nowIST(), dayGap > 0 ? dayGap : 1)

            await supabaseAdmin
              .from("sequence_enrollments")
              .update({
                current_step: nextStepIndex,
                last_sent_at: now,
                next_send_at: nextSendAt.toISOString(),
                updated_at:   now
              })
              .eq("id", enrollment.id)
          } else {
            // Last step done
            await supabaseAdmin
              .from("sequence_enrollments")
              .update({
                status:       "completed",
                last_sent_at: now,
                updated_at:   now
              })
              .eq("id", enrollment.id)
            totalCompleted++
          }

          // Log to messages table for conversation history
          try {
            const { data: convo } = await supabaseAdmin
              .from("conversations")
              .select("id")
              .eq("user_id", enrollment.user_id)
              .eq("phone", enrollment.lead_phone)
              .maybeSingle()

            await supabaseAdmin.from("messages").insert({
              user_id:          enrollment.user_id,
              customer_phone:   enrollment.lead_phone,
              conversation_id:  convo?.id || null,
              direction:        "outbound",
              message_type:     "template",
              message_text:     "[Sequence: " + (currentStep.label || currentStep.template_name) + "]",
              status:           "sent",
              is_ai:            false,
              created_at:       now
            })

            // Mark conversation as campaign mode so AI handles reply in context
            if (convo?.id) {
              await supabaseAdmin.from("conversations").update({
                campaign_sent_at: now,
                campaign_message: "Sequence step: " + (currentStep.label || currentStep.template_name)
              }).eq("id", convo.id)
            }
          } catch (e) { /* non-critical */ }

          totalSent++
        } else {
          totalSkipped++
        }

        // Rate limit — 1 msg/sec
        await new Promise(r => setTimeout(r, 1000))

      } catch (enrollErr) {
        console.error("❌ Error processing enrollment:", enrollment.id, enrollErr.message)
        totalSkipped++
      }
    }

    return { ok: true, sent: totalSent, skipped: totalSkipped, completed: totalCompleted }
  } catch (e) {
    console.error("❌ processDueEnrollments failed:", e.message)
    return { ok: false, error: e.message }
  }
}

module.exports = { enrollLead, stopEnrollment, processDueEnrollments, sendTemplate }
