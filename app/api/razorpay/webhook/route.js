// app/api/razorpay/webhook/route.js
const { NextResponse } = require("next/server")
const { createClient } = require("@supabase/supabase-js")
const crypto = require("crypto")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

function verifySignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not set — cannot verify webhook")
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")
  return expected === signature
}

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

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event
    const payload   = event.payload?.subscription?.entity

    if (!payload) return NextResponse.json({ status: "no_payload" })

    const subscriptionId = payload.id
    const notes          = payload.notes || {}
    const userId         = notes.user_id
    const planId         = payload.plan_id

    if (!userId) return Nex
