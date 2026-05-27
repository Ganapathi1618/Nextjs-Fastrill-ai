import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            flowType: "pkce",
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }
        }
      )

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data?.session) {
        // Redirect to dashboard — session is stored in browser via cookie
        const response = NextResponse.redirect(new URL(next, requestUrl.origin))
        
        // Manually set the session cookies so middleware can read them
        const { access_token, refresh_token, expires_at } = data.session
        
        response.cookies.set("sb-access-token", access_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: false,
        })
        response.cookies.set("sb-refresh-token", refresh_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: false,
        })

        return response
      }
    } catch (err) {
      console.error("OAuth callback error:", err)
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin))
}
