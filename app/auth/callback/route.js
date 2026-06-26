import { NextResponse } from "next/server"

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
    const confirmUrl = new URL("/auth/confirm", requestUrl.origin)
    confirmUrl.searchParams.set("code", code)
    confirmUrl.searchParams.set("next", next)
    return NextResponse.redirect(confirmUrl)
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin))
}
