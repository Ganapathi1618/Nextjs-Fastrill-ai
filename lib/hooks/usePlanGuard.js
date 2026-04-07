"use client"
import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

export function usePlanGuard() {
  useEffect(() => {
    async function check() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/login"; return }

      const { data: biz } = await supabase
        .from("business_settings")
        .select("plan, plan_expires_at")
        .eq("user_id", user.id)
        .maybeSingle()

      if (biz?.plan_expires_at && new Date(biz.plan_expires_at) < new Date()) {
        window.location.href = "/dashboard/settings?tab=billing&expired=1"
      }
    }
    check()
  }, [])
}
