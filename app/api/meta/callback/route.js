import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code  = searchParams.get("code")
    const state = searchParams.get("state")

    // ── PHASE 1: Get logged-in user from Supabase session ──────
    // Use individual cookie values instead of toString() which breaks in App Router
    const cookieStore = cookies()
    const allCookies  = cookieStore.getAll()

    // Build cookie header string manually
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: { cookie: cookieHeader }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("❌ Callback: No user session found:", userError?.message)
      // Store the code in URL so after login we can retry
      return NextResponse.redirect(
        new URL("/login?redirect=/api/meta/callback&code=" + (code||""), req.url)
      )
    }

    if (!code) {
      console.error("❌ Callback: No code received from Meta")
      return NextResponse.redirect(new URL("/dashboard/settings?error=no_code&tab=whatsapp", req.url))
    }

    console.log("✅ Callback: User found:", user.id)

    // ── PHASE 2: Exchange code for access token ─────────────────
    const appId       = process.env.META_APP_ID
    const appSecret   = process.env.META_APP_SECRET
    const redirectUri = (process.env.NEXT_PUBLIC_APP_URL || "https://fastrill.com") + "/api/meta/callback"

    const tokenUrl =
      `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`

    const tokenRes  = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error("❌ Token exchange error:", tokenData.error)
      return NextResponse.redirect(new URL("/dashboard/settings?error=token_failed&tab=whatsapp", req.url))
    }

    const accessToken = tokenData.access_token
    console.log("✅ Token received")

    // ── PHASE 3: Fetch WhatsApp Business Account details ────────
    // Try direct WABA fetch first (more reliable)
    let wabaId            = null
    let phoneNumberId     = null
    let displayPhoneNumber= null

    // Method 1: Get WABA via businesses endpoint
    try {
      const wabaRes  = await fetch(`https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`)
      const wabaData = await wabaRes.json()
      wabaId = wabaData?.data?.[0]?.id || null
      console.log("✅ WABA ID from businesses:", wabaId)
    } catch(e) {
      console.warn("⚠️ businesses endpoint failed:", e.message)
    }

    // Method 2: If no WABA from businesses, try whatsapp_business_account directly
    if (!wabaId) {
      try {
        const meRes  = await fetch(`https://graph.facebook.com/v18.0/me?fields=whatsapp_business_account&access_token=${accessToken}`)
        const meData = await meRes.json()
        wabaId = meData?.whatsapp_business_account?.id || null
        console.log("✅ WABA ID from me:", wabaId)
      } catch(e) {
        console.warn("⚠️ me endpoint failed:", e.message)
      }
    }

    // Fetch Phone Number ID using WABA ID
    if (wabaId) {
      try {
        const phoneRes  = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${accessToken}`)
        const phoneData = await phoneRes.json()
        phoneNumberId      = phoneData?.data?.[0]?.id || null
        displayPhoneNumber = phoneData?.data?.[0]?.display_phone_number || null
        console.log("✅ Phone number ID:", phoneNumberId, displayPhoneNumber)
      } catch(e) {
        console.warn("⚠️ Phone numbers fetch failed:", e.message)
      }
    }

    // ── PHASE 4: Store into Supabase ────────────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error: upsertError } = await supabaseAdmin
      .from("whatsapp_connections")
      .upsert(
        {
          user_id:              user.id,
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
      return NextResponse.redirect(new URL("/dashboard/settings?error=db_failed&tab=whatsapp", req.url))
    }

    console.log("✅ WhatsApp connection saved for user:", user.id)

    // ── Also register webhook if not already done ───────────────
    if (phoneNumberId) {
      try {
        const webhookUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://fastrill.com") + "/api/meta/webhook"
        await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/subscribed_apps`,
          {
            method: "POST",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ subscribed_fields: ["messages"] })
          }
        )
        console.log("✅ Webhook subscription registered")
      } catch(e) {
        console.warn("⚠️ Webhook subscription failed (non-critical):", e.message)
      }
    }

    // ── Success ─────────────────────────────────────────────────
    return NextResponse.redirect(new URL("/dashboard/settings?connected=true&tab=whatsapp", req.url))

  } catch (err) {
    console.error("❌ Callback fatal error:", err.message)
    return NextResponse.redirect(new URL("/dashboard/settings?error=unknown&tab=whatsapp", req.url))
  }
}
