import { NextResponse } from "next/server"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "No code received" })
  }

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  const redirectUri =
    "https://fastrill-fastrills-projects.vercel.app/api/meta/callback"

  const tokenUrl =
    `https://graph.facebook.com/v18.0/oauth/access_token` +
    `?client_id=${appId}` +
    `&redirect_uri=${redirectUri}` +
    `&client_secret=${appSecret}` +
    `&code=${code}`

  const response = await fetch(tokenUrl)
  const data = await response.json()

  return NextResponse.json(data)
}
