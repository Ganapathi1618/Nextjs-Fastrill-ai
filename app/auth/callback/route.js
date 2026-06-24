import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin))
  }

  if (code) {
    const response = NextResponse.redirect(new URL(next, requestUrl.origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("OAuth code exchange failed:", exchangeError.message)
      return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin))
    }

    // Check if new user needs onboarding
    if (data?.session) {
      const { data: settings } = await supabase
        .from("business_settings")
        .select("id")
        .eq("user_id", data.session.user.id)
        .maybeSingle()

      if (!settings) {
        // New user — init their account server-side using admin client
        const { createClient } = await import("@supabase/supabase-js")
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        const userId = data.session.user.id
        const { data: existing } = await supabaseAdmin
          .from("business_settings")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle()

        if (!existing) {
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

          const expiry = new Date()
          if (isEarlyAccess) {
            expiry.setDate(expiry.getDate() + 30)
          } else {
            expiry.setDate(expiry.getDate() + 14)
          }

          await supabaseAdmin.from("business_settings").insert({
            user_id: userId,
            plan: isEarlyAccess ? "starter" : "trial",
            plan_expires_at: expiry.toISOString(),
            reminders_enabled: false,
            lead_recovery_enabled: false,
            campaigns_enabled: false,
            created_at: new Date().toISOString(),
          })

          if (isEarlyAccess) {
            await supabaseAdmin
              .from("app_config")
              .update({ value: String(count + 1) })
              .eq("key", "early_access_count")
          }
        }

        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin), {
          headers: response.headers,
        })
      }
    }

    return response
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin))
}
