import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/onboarding",
  "/auth/callback",
  "/auth/confirm",
  "/",
]

const PUBLIC_API_ROUTES = [
  "/api/meta/webhook",
  "/api/razorpay/webhook",
  "/api/cron/",
]

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (
    PUBLIC_ROUTES.some(r => pathname === r) ||
    PUBLIC_API_ROUTES.some(r => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

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
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (!user && pathname.startsWith("/api/") && !pathname.startsWith("/api/meta/webhook") && !pathname.startsWith("/api/razorpay/webhook") && !pathname.startsWith("/api/cron/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
  ],
}
