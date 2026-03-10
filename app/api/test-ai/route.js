// Deploy to: app/api/test-ai/route.js
// Then visit: https://fastrill.com/api/test-ai in browser
// DELETE this file after testing!

import { NextResponse } from "next/server"

export async function GET() {
  const results = {}

  // ── Test Sarvam ──
  if (process.env.SARVAM_API_KEY) {
    results.sarvam_key_set = true
    try {
      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type":         "application/json",
          "api-subscription-key": process.env.SARVAM_API_KEY,
        },
        body: JSON.stringify({
          model:    "sarvam-m",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user",   content: "Say hello in one sentence." }
          ],
          max_tokens: 50,
        }),
      })
      const text = await res.text()
      results.sarvam_status = res.status
      results.sarvam_raw    = text.substring(0, 500)
      try {
        const json = JSON.parse(text)
        results.sarvam_reply = json?.choices?.[0]?.message?.content || "No content field"
        results.sarvam_ok    = true
      } catch(e) {
        results.sarvam_parse_error = e.message
      }
    } catch(e) {
      results.sarvam_error = e.message
    }
  } else {
    results.sarvam_key_set = false
  }

  // ── Test Claude ──
  if (process.env.ANTHROPIC_API_KEY) {
    results.claude_key_set = true
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      "claude-haiku-20240307",
          max_tokens: 50,
          messages:   [{ role:"user", content:"Say hello in one sentence." }],
        }),
      })
      const text = await res.text()
      results.claude_status = res.status
      results.claude_raw    = text.substring(0, 300)
      try {
        const json = JSON.parse(text)
        results.claude_reply = json?.content?.[0]?.text || "No text field"
        results.claude_ok    = true
      } catch(e) {
        results.claude_parse_error = e.message
      }
    } catch(e) {
      results.claude_error = e.message
    }
  } else {
    results.claude_key_set = false
  }

  return NextResponse.json(results, { status: 200 })
}
