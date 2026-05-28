import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  // If there's an error param from Supabase
  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin))
  }

  // If we have a code — exchange it via confirm page
  if (code) {
    return NextResponse.redirect(
      new URL(`/auth/confirm?code=${code}&next=${next}`, requestUrl.origin)
    )
  }

  // No code and no error — token is coming as hash fragment
  // We can't read hash server-side, so send to login page
  // which has the hash handler in useEffect
  return NextResponse.redirect(new URL("/login", requestUrl.origin))
}
