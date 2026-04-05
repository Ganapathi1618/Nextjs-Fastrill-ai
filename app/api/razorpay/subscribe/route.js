// app/api/razorpay/subscribe/route.js
// Creates a Razorpay subscription for a user and returns the subscription ID
// Frontend uses this to open Razorpay checkout

const { NextResponse } = require("next/server")
const { createClient } = require("@supabase/supabase-js")
const Razorpay = require("razorpay")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLAN_MAP = {
  starter: process.env.RAZORPAY_PLAN_STARTER,
  growth:  process.env.RAZORPAY_PLAN_GROWTH,
  pro:     process.env.RAZORPAY_PLAN_PRO,
}

async function POST(req) {
  try {
    const { plan, userId, userEmail, userName } = await req.json()

    if (!plan || !userId) {
      return NextResponse.json({ error: "Missing plan or userId" }, { status: 400 })
    }

    const planId = PLAN_MAP[plan]
    if (!planId) {
      return NextResponse.json({ error: "Invalid plan: " + plan }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Create or fetch Razorpay customer
    let razorpayCustomerId = null
    const { data: biz } = await supabaseAdmin
      .from("business_settings")
      .select("razorpay_customer_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (biz?.razorpay_customer_id) {
      razorpayCustomerId = biz.razorpay_customer_id
    } else {
      // Create new Razorpay customer
      const customer = await razorpay.customers.create({
        name:  userName  || "Fastrill User",
        email: userEmail || "",
        notes: { user_id: userId }
      })
      razorpayCustomerId = customer.id

      // Save customer ID
      await supabaseAdmin.from("business_settings")
        .update({ razorpay_customer_id: razorpayCustomerId })
        .eq("user_id", userId)
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id:         planId,
      customer_notify: 1,
      quantity:        1,
      total_count:     12,  // 12 billing cycles = 1 year, then renews
      notes: {
        user_id:    userId,
        plan:       plan,
        user_email: userEmail || ""
      }
    })

    // Save subscription ID to DB
    await supabaseAdmin.from("business_settings")
      .update({ razorpay_subscription_id: subscription.id })
      .eq("user_id", userId)

    console.log("✅ Subscription created:", subscription.id, "plan:", plan, "user:", userId)

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan
    })

  } catch(e) {
    console.error("❌ Subscribe API error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

module.exports = { POST }
