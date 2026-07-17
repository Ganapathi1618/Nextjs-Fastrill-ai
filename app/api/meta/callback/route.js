import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyOAuthState } from "@/lib/meta/oauth-state"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code  = searchParams.get("code")
    const state = searchParams.get("state")

    // ── VERIFY signed state (CSRF protection) ───────────────────
    // The state was minted by /api/meta/oauth-state for an authenticated
    // session and is HMAC-signed with META_APP_SECRET + expiry. A forged
    // or expired state fails here before any token exchange happens.
    const userId = verifyOAuthState(state)
    if (!userId) {
      console.error("❌ Callback: state failed verification (forged, expired, or missing)")
      return NextResponse.redirect(new URL("/dashboard/settings?error=invalid_state", req.url))
    }

    if (!code) {
      console.error("❌ Callback: No code from Meta")
      return NextResponse.redirect(new URL("/dashboard/settings?error=no_code", req.url))
    }

    console.log("✅ Callback: Valid userId from state:", userId)

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // ── VERIFY user exists in Supabase ──────────────────────────
    // Prevents connecting WhatsApp to a deleted/invalid account
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !user) {
      console.error("❌ Callback: User not found for id:", userId)
      return NextResponse.redirect(new URL("/login?error=user_not_found", req.url))
    }

    console.log("✅ User verified:", user.email)

    // ── EXCHANGE code for access token ──────────────────────────
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
      console.error("❌ Token exchange failed:", tokenData.error)
      return NextResponse.redirect(new URL("/dashboard/settings?error=token_failed", req.url))
    }

    const accessToken = tokenData.access_token
    console.log("✅ Token received")

    // ── FETCH WABA and phone number ─────────────────────────────
    let wabaId = null, phoneNumberId = null, displayPhoneNumber = null

    // Method 1: via businesses endpoint
    try {
      const r = await fetch(`https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`)
      const d = await r.json()
      wabaId = d?.data?.[0]?.id || null
      console.log("✅ WABA from businesses:", wabaId)
    } catch(e) {
      console.warn("⚠️ businesses endpoint failed:", e.message)
    }

    // Method 2: fallback via me endpoint
    if (!wabaId) {
      try {
        const r = await fetch(`https://graph.facebook.com/v18.0/me?fields=whatsapp_business_account&access_token=${accessToken}`)
        const d = await r.json()
        wabaId = d?.whatsapp_business_account?.id || null
        console.log("✅ WABA from me:", wabaId)
      } catch(e) {
        console.warn("⚠️ me endpoint failed:", e.message)
      }
    }

    // Fetch phone numbers if WABA found
    if (wabaId) {
      try {
        const r = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${accessToken}`)
        const d = await r.json()
        phoneNumberId      = d?.data?.[0]?.id || null
        displayPhoneNumber = d?.data?.[0]?.display_phone_number || null
        console.log("✅ Phone:", phoneNumberId, displayPhoneNumber)
      } catch(e) {
        console.warn("⚠️ Phone numbers fetch failed:", e.message)
      }
    }

    // ── SAVE to Supabase ────────────────────────────────────────
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

    // ── REGISTER webhook subscription (non-critical) ────────────
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
      } catch(e) {
        console.warn("⚠️ Webhook subscription failed (non-critical):", e.message)
      }
    }

    // ── SUCCESS ─────────────────────────────────────────────────
    return NextResponse.redirect(new URL("/dashboard/settings?connected=true", req.url))

  } catch (err) {
    console.error("❌ Callback fatal error:", err.message)
    return NextResponse.redirect(new URL("/dashboard/settings?error=unknown", req.url))
  }
}
