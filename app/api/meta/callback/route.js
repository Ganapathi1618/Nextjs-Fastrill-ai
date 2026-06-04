import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code   = searchParams.get("code")
    const userId = searchParams.get("state") // ← userId passed from connect button

    if (!userId) {
      console.error("❌ Callback: No userId in state parameter")
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (!code) {
      console.error("❌ Callback: No code from Meta")
      return NextResponse.redirect(new URL("/dashboard/settings?error=no_code", req.url))
    }

    console.log("✅ Callback: userId from state:", userId)

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // ── PHASE 1: Verify user exists in Supabase ─────────────────
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !user) {
      console.error("❌ Callback: User not found:", userError?.message)
      return NextResponse.redirect(new URL("/login", req.url))
    }

    console.log("✅ User verified:", user.email)

    // ── PHASE 2: Exchange code for access token ─────────────────
    const appId       = process.env.META_APP_ID
    const appSecret   = process.env.META_APP_SECRET
    const redirectUri = (process.env.NEXT_PUBLIC_APP_URL || "https://fastrill.com") + "/api/meta/callback"

    const tokenRes  = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error("❌ Token exchange error:", tokenData.error)
      return NextResponse.redirect(new URL("/dashboard/settings?error=token_failed", req.url))
    }

    const accessToken = tokenData.access_token
    console.log("✅ Token received")

    // ── PHASE 3: Fetch WABA and phone number ────────────────────
    let wabaId = null, phoneNumberId = null, displayPhoneNumber = null

    // Try businesses endpoint
    try {
      const r = await fetch(`https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`)
      const d = await r.json()
      wabaId = d?.data?.[0]?.id || null
      console.log("✅ WABA from businesses:", wabaId)
    } catch(e) { console.warn("⚠️ businesses endpoint failed") }

    // Fallback: try me endpoint
    if (!wabaId) {
      try {
        const r = await fetch(`https://graph.facebook.com/v18.0/me?fields=whatsapp_business_account&access_token=${accessToken}`)
        const d = await r.json()
        wabaId = d?.whatsapp_business_account?.id || null
        console.log("✅ WABA from me:", wabaId)
      } catch(e) { console.warn("⚠️ me endpoint failed") }
    }

    // Fetch phone numbers
    if (wabaId) {
      try {
        const r = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${accessToken}`)
        const d = await r.json()
        phoneNumberId      = d?.data?.[0]?.id || null
        displayPhoneNumber = d?.data?.[0]?.display_phone_number || null
        console.log("✅ Phone:", phoneNumberId, displayPhoneNumber)
      } catch(e) { console.warn("⚠️ phone numbers failed") }
    }

    // ── PHASE 4: Save to Supabase ───────────────────────────────
    const { error: upsertError } = await supabaseAdmin
      .from("whatsapp_connections")
      .upsert(
        {
          user_id:              userId,
          access_token:         accessToken,
          waba_id:              wabaId,
          phone_number_id:      phoneNumberId,
          display_phone_number: displayPhoneNumber,
          connected_at:         new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (upsertError) {
      console.error("❌ Supabase upsert error:", upsertError.message)
      return NextResponse.redirect(new URL("/dashboard/settings?error=db_failed", req.url))
    }

    console.log("✅ WhatsApp connection saved for:", userId)

    // ── PHASE 5: Register webhook subscription ──────────────────
    if (phoneNumberId) {
      try {
        await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/subscribed_apps`,
          {
            method:  "POST",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body:    JSON.stringify({ subscribed_fields: ["messages"] })
          }
        )
        console.log("✅ Webhook subscribed")
      } catch(e) { console.warn("⚠️ Webhook subscription failed (non-critical)") }
    }

    return NextResponse.redirect(new URL("/dashboard/settings?connected=true", req.url))

  } catch (err) {
    console.error("❌ Callback fatal:", err.message)
    return NextResponse.redirect(new URL("/dashboard/settings?error=unknown", req.url))
  }
}
