import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")

    // ── PHASE 1: Get logged-in user from Supabase session ──
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      // Not logged in → redirect to login
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard?error=no_code", req.url)
      )
    }

    // ── PHASE 2: Exchange code for access token ──
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = "https://fastrill.com/api/meta/callback"

    const tokenUrl =
      `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`

    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error)
      return NextResponse.redirect(
        new URL("/dashboard?error=token_failed", req.url)
      )
    }

    const accessToken = tokenData.access_token

    // ── PHASE 2: Fetch WhatsApp Business Account details ──
    const wabaRes = await fetch(
      `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`
    )
    const wabaData = await wabaRes.json()

    // Get WABA ID
    const wabaId = wabaData?.data?.[0]?.id || null

    // Fetch Phone Number ID using WABA ID
    let phoneNumberId = null
    let displayPhoneNumber = null

    if (wabaId) {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${accessToken}`
      )
      const phoneData = await phoneRes.json()
      phoneNumberId = phoneData?.data?.[0]?.id || null
      displayPhoneNumber = phoneData?.data?.[0]?.display_phone_number || null
    }

    // ── PHASE 2: Store into Supabase using service role key ──
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error: upsertError } = await supabaseAdmin
      .from("whatsapp_connections")
      .upsert(
        {
          user_id: user.id,
          access_token: accessToken,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          display_phone_number: displayPhoneNumber,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError)
      return NextResponse.redirect(
        new URL("/dashboard?error=db_failed", req.url)
      )
    }

    // ── Success → redirect to dashboard ──
    return NextResponse.redirect(
      new URL("/dashboard?connected=true", req.url)
    )

  } catch (err) {
    console.error("Callback error:", err)
    return NextResponse.redirect(
      new URL("/dashboard?error=unknown", req.url)
    )
  }
}
