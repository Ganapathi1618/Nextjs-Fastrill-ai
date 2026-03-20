diff --git a/lib/booking/booking-engine.js b/lib/booking/booking-engine.js
new file mode 100644
index 0000000000000000000000000000000000000000..de7513c32741878c736d7e66b2eef830fe64efa4
--- /dev/null
+++ b/lib/booking/booking-engine.js
@@ -0,0 +1,169 @@
+import { formatBookingDate } from "@/lib/booking/calendar-engine"
+import { findNextAvailableSlot, isSlotAvailable, isTimeBased } from "@/lib/booking/slot-engine"
+
+export function matchService(name, list = []) {
+  if (!name || !list.length) return null
+  const normalized = String(name).toLowerCase().trim()
+  return list.find((svc) => svc.name.toLowerCase() === normalized)
+    || list.find((svc) => svc.name.toLowerCase().includes(normalized) || normalized.includes(svc.name.toLowerCase()))
+    || null
+}
+
+export function fixTimeFormat(t) {
+  if (!t) return null
+  if (/^\d{2}:\d{2}$/.test(t)) return t
+  const match = String(t).match(/(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i)
+  if (!match) return null
+  let h = parseInt(match[1], 10)
+  const mn = match[2] || "00"
+  const ap = match[3]?.toLowerCase()
+  if (ap === "pm" && h < 12) h += 12
+  if (ap === "am" && h === 12) h = 0
+  if (h < 0 || h > 23) return null
+  return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`
+}
+
+export async function loadExistingBookingInfo({ supabaseAdmin, userId, formattedPhone, queryText }) {
+  if (!/did you book|my booking|my appointment|booked for me|check my booking|what did i book/i.test(queryText || "")) {
+    return null
+  }
+
+  const { data } = await supabaseAdmin.from("bookings").select("*")
+    .eq("customer_phone", formattedPhone)
+    .eq("user_id", userId)
+    .in("status", ["confirmed", "pending"])
+    .order("created_at", { ascending: false })
+    .limit(1)
+    .maybeSingle()
+
+  return data || null
+}
+
+export async function executeBookingAction({
+  supabaseAdmin,
+  action,
+  bookingData,
+  bookingState,
+  activeServices,
+  userId,
+  customer,
+  contactName,
+  formattedPhone,
+  conversation,
+}) {
+  if (!supabaseAdmin || !action) return { ok: false, type: "noop" }
+
+  if (["update_state", "confirm_booking"].includes(action)) {
+    const mergedState = { ...(bookingState || {}) }
+    if (bookingData?.service) mergedState.service = bookingData.service
+    if (bookingData?.date) mergedState.date = bookingData.date
+    if (bookingData?.time) mergedState.time = bookingData.time
+    await supabaseAdmin.from("conversations")
+      .update({ booking_state: JSON.stringify(mergedState) })
+      .eq("id", conversation.id)
+    return { ok: true, type: "state", state: mergedState }
+  }
+
+  if (action === "create_booking" && bookingData?.service) {
+    const matchedSvc = matchService(bookingData.service, activeServices)
+    const canonicalService = matchedSvc?.name || bookingData.service
+
+    if (isTimeBased(matchedSvc) && bookingData.date && bookingData.time) {
+      const slotFree = await isSlotAvailable({
+        supabaseAdmin,
+        userId,
+        date: bookingData.date,
+        time: bookingData.time,
+        service: canonicalService,
+        servicesList: activeServices,
+      })
+
+      if (!slotFree) {
+        const alt = await findNextAvailableSlot({
+          supabaseAdmin,
+          userId,
+          date: bookingData.date,
+          service: canonicalService,
+          servicesList: activeServices,
+        })
+
+        return {
+          ok: false,
+          type: "slot_unavailable",
+          suggestion: alt,
+          message: alt
+            ? `That slot just got taken 😅 Next available: *${alt}*\n\nShall I book that instead? ✅`
+            : `That slot is fully booked 😅 Please suggest another time!`,
+        }
+      }
+    }
+
+    const { data: newBooking, error } = await supabaseAdmin.from("bookings").insert({
+      user_id: userId,
+      customer_name: contactName,
+      customer_phone: formattedPhone,
+      customer_id: customer?.id || null,
+      service: canonicalService,
+      booking_date: bookingData.date || null,
+      booking_time: bookingData.time || null,
+      amount: matchedSvc?.price || 0,
+      status: "confirmed",
+      ai_booked: true,
+      created_at: new Date().toISOString(),
+    }).select().single()
+
+    if (error || !newBooking) return { ok: false, type: "create_failed", error }
+
+    await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id)
+    return { ok: true, type: "booking_created", booking: newBooking }
+  }
+
+  if (action === "reschedule") {
+    const { data: bookingToUpdate } = await supabaseAdmin.from("bookings").select("*")
+      .eq("customer_phone", formattedPhone)
+      .eq("user_id", userId)
+      .in("status", ["confirmed", "pending"])
+      .order("booking_date", { ascending: true })
+      .limit(1)
+      .maybeSingle()
+
+    if (!bookingToUpdate) return { ok: false, type: "not_found" }
+
+    await supabaseAdmin.from("bookings").update({
+      booking_date: bookingData?.date || bookingToUpdate.booking_date,
+      booking_time: bookingData?.time || bookingToUpdate.booking_time,
+      status: "confirmed",
+    }).eq("id", bookingToUpdate.id)
+
+    await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id)
+    return { ok: true, type: "booking_rescheduled", booking: bookingToUpdate }
+  }
+
+  if (action === "cancel") {
+    await supabaseAdmin.from("bookings")
+      .update({ status: "cancelled" })
+      .eq("customer_phone", formattedPhone)
+      .eq("user_id", userId)
+      .in("status", ["confirmed", "pending"])
+
+    await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id)
+    return { ok: true, type: "booking_cancelled" }
+  }
+
+  if (action === "clear_state") {
+    await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id)
+    return { ok: true, type: "state_cleared" }
+  }
+
+  return { ok: false, type: "noop" }
+}
+
+export function describeExistingBooking(existingBookingInfo) {
+  if (!existingBookingInfo) return null
+  return {
+    service: existingBookingInfo.service,
+    date: formatBookingDate(existingBookingInfo.booking_date),
+    time: existingBookingInfo.booking_time || null,
+    status: existingBookingInfo.status,
+  }
+}
