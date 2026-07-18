import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", "")
    )
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = user.id
    const userEmail = user.email

    // Check if business_settings already exists for this user
    const { data: existing } = await supabaseAdmin
      .from("business_settings")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ status: "already_initialized" })
    }

    // Check early access count
    const { data: configRow } = await supabaseAdmin
      .from("app_config")
      .select("value")
      .eq("key", "early_access_count")
      .single()

    const { data: limitRow } = await supabaseAdmin
      .from("app_config")
      .select("value")
      .eq("key", "early_access_limit")
      .single()

    const count = parseInt(configRow?.value || "0")
    const limit = parseInt(limitRow?.value || "20")
    const isEarlyAccess = count < limit

    // Set plan and expiry
    const now = new Date()
    const expiry = new Date()
    if (isEarlyAccess) {
      expiry.setDate(expiry.getDate() + 30) // 1 month free starter
    } else {
      expiry.setDate(expiry.getDate() + 14) // 14 day trial
    }

    await supabaseAdmin.from("business_settings").insert({
      user_id:        userId,
      email:          userEmail,
      plan:           isEarlyAccess ? "starter" : "trial",
      plan_expires_at: expiry.toISOString(),
      reminders_enabled:     false,
      lead_recovery_enabled: false,
      campaigns_enabled:     false,
      created_at:     now.toISOString(),
    })

    // Increment early access count if applicable
    if (isEarlyAccess) {
      await supabaseAdmin
        .from("app_config")
        .update({ value: String(count + 1) })
        .eq("key", "early_access_count")
    }

    return NextResponse.json({
      status: "ok",
      plan: isEarlyAccess ? "starter" : "trial",
      earlyAccess: isEarlyAccess,
      spotsLeft: isEarlyAccess ? limit - count - 1 : 0
    })

  } catch(e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
