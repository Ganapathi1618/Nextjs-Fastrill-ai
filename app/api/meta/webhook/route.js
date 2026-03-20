// app/api/meta/webhook/route.js
// Fastrill AI v2 — webhook is now just 30 lines
// All intelligence lives in lib/ai/orchestrator.js

import { orchestrator } from "@/lib/ai/orchestrator"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

export async function POST(req) {
  const body = await req.json()
  return orchestrator.process(body)
}
