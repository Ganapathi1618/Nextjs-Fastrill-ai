import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  // If we have a code, exchange it client-side instead
  // Redirect to a client page that handles the session exchange
  if (code) {
    return NextResponse.redirect(
      new URL(`/auth/confirm?code=${code}&next=${next}`, requestUrl.origin)
    )
  }

  return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin))
}
