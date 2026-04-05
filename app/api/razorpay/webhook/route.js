// app/api/razorpay/webhook/route.js
// Handles Razorpay subscription events
// Activates plan on payment, cancels on subscription end

const { NextResponse } = require("next/server")
const { createClient } = require("@supabase/supabase-js")
const crypto = require("crypto")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Plan features — what each plan unlocks
const PLAN_FEATURES = {
  starter: {
    plan:                  "starter",
    reminders_enabled:     false,
    lead_recovery_enabled: false,
    campaigns_enabled:     false,
  },
  growth: {
    plan:                  "growth",
    reminders_enabled:     true,
    lead_recovery_enabled: true,
    campaigns_enabled:     false,
  },
  pro: {
    plan:                  "pro",
    reminders_enabled:     true,
    lead_recovery_enabled: true,
    campaigns_enabled:     true,
  },
}

// Verify Razorpay webhook signature
function verifySignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return true  // skip in dev if not set
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")
  return expected === signature
}

// Get plan name from Razorpay plan ID
function getPlanFromId(planId) {
  if (planId === process.env.RAZORPAY_PLAN_STARTER) return "starter"
  if (planId === process.env.RAZORPAY_PLAN_GROWTH)  return "growth"
  if (planId === process.env.RAZORPAY_PLAN_PRO)     return "pro"
  return null
}

async function POST(req) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-razorpay-signature")

    // Verify signature
    if (!verifySignature(rawBody, signature)) {
      console.error("❌ Invalid Razorpay webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event
    const payload   = event.payload?.subscription?.entity

    console.log("📦 Razorpay webhook:", eventType, payload?.id)

    if (!payload) {
      return NextResponse.json({ status: "no_payload" })
    }

    const subscriptionId = payload.id
    const notes          = payload.notes || {}
    const userId         = notes.user_id
    const planId         = payload.plan_id

    if (!userId) {
      console.error("❌ No user_id in subscription notes:", subscriptionId)
      return NextResponse.json({ status: "no_user_id" })
    }

    // ── subscription.activated or subscription.charged ─────────
    // Payment succeeded — activate the plan
    if (eventType === "subscription.activated" || eventType === "subscription.charged") {
      const planName = notes.plan || getPlanFromId(planId)
      if (!planName) {
        console.error("❌ Unknown plan ID:", planId)
        return NextResponse.json({ status: "unknown_plan" })
      }

      const features = PLAN_FEATURES[planName]

      // Calculate expiry — 1 month from now + 3 day grace period
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 33)

      await supabaseAdmin.from("business_settings")
        .update({
          ...features,
          plan_expires_at: expiry.toISOString(),
          razorpay_subscription_id: subscriptionId,
        })
        .eq("user_id", userId)

      console.log("✅ Plan activated:", planName, "user:", userId, "expires:", expiry.toISOString())

      // Log the event
      await supabaseAdmin.from("ai_event_log").insert({
        user_id:    userId,
        stage:      "plan_" + eventType,
        input_json: { plan: planName, subscription_id: subscriptionId, event: eventType },
        success:    true,
        created_at: new Date().toISOString()
      }).catch(() => {})
    }

    // ── subscription.cancelled ─────────────────────────────────
    // Customer cancelled — downgrade to trial at end of billing period
    if (eventType === "subscription.cancelled") {
      // Don't remove features immediately — let them use till expiry
      // Just clear the subscription ID so they can't renew accidentally
      await supabaseAdmin.from("business_settings")
        .update({ razorpay_subscription_id: null })
        .eq("user_id", userId)

      console.log("⚠️ Subscription cancelled for user:", userId, "— features active till expiry")
    }

    // ── subscription.halted ────────────────────────────────────
    // Payment failed multiple times — downgrade immediately
    if (eventType === "subscription.halted") {
      await supabaseAdmin.from("business_settings")
        .update({
          plan:                    "trial",
          reminders_enabled:       false,
          lead_recovery_enabled:   false,
          campaigns_enabled:       false,
          razorpay_subscription_id: null,
        })
        .eq("user_id", userId)

      console.log("❌ Subscription halted — downgraded to trial for user:", userId)
    }

    return NextResponse.json({ status: "ok", event: eventType })

  } catch(e) {
    console.error("❌ Razorpay webhook error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

module.exports = { POST }
