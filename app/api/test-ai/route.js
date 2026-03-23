// app/api/test-ai/route.js
// Used by Settings page "Test AI" button
// Runs a test message through the full AI pipeline

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req) {
  try {
    const { message, userId } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })
    if (!userId)           return NextResponse.json({ error: "userId required" }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Load business context
    const [{ data: biz }, { data: kn }, { data: svcs }] = await Promise.all([
      supabase.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("services").select("name,price,duration,description,service_type,is_active").eq("user_id", userId),
    ])

    const bizContext = Object.assign({}, kn || {}, biz || {}, {
      ai_instructions: [biz?.ai_instructions, kn?.content, kn?.knowledge].filter(Boolean).join("\n\n") || ""
    })
    const services = (svcs || []).filter(s => s.is_active !== false)

    if (!process.env.SARVAM_API_KEY) {
      return NextResponse.json({ reply: "⚠️ SARVAM_API_KEY not configured. Add it to your environment variables to test AI replies." })
    }

    const svcBlock = services.map(s =>
      "• " + s.name + ": ₹" + s.price + (s.duration ? " (" + s.duration + " min)" : "") + (s.description ? " — " + s.description : "")
    ).join("\n")

    const systemPrompt = `You are the WhatsApp assistant for *${bizContext.business_name || "this business"}*.
Reply ONLY with the final message. Be warm, human, concise (2-3 lines max).
${svcBlock ? "\nSERVICES:\n" + svcBlock : ""}
${bizContext.working_hours ? "\nHOURS: " + bizContext.working_hours : ""}
${bizContext.location ? "\nADDRESS: " + bizContext.location : ""}
${bizContext.ai_instructions ? "\nOWNER INSTRUCTIONS:\n" + bizContext.ai_instructions : ""}
This is a TEST — reply naturally as if a real customer sent this message.`

    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY
      },
      body: JSON.stringify({
        model: "sarvam-m",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    })

    const data = await res.json()
    if (data?.error) return NextResponse.json({ error: "AI error: " + data.error.message }, { status: 500 })

    let reply = data?.choices?.[0]?.message?.content || ""
    // Strip think tags
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
    if (reply.includes("<think>")) reply = reply.split("<think>")[0].trim()

    return NextResponse.json({ reply: reply || "No reply generated" })
  } catch(e) {
    console.error("❌ test-ai error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
