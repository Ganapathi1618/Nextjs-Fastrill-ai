// app/api/cron/drip-sequences/route.js
// Cron: runs every hour via GitHub Actions
// Fires pending sequence steps using approved Meta templates — works outside 24hr window

import { NextResponse } from "next/server"
import { processDueEnrollments } from "@/lib/sequences/sequence-engine"

export async function GET(req) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("🔄 Drip sequences cron started")
    const result = await processDueEnrollments()

    console.log("✅ Drip sequences done:", result)
    return NextResponse.json({
      status:    "ok",
      sent:      result.sent,
      skipped:   result.skipped,
      completed: result.completed,
      ranAt:     new Date().toISOString()
    })
  } catch (e) {
    console.error("❌ Drip sequences cron failed:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
