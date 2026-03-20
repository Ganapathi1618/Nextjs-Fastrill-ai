diff --git a/lib/booking/slot-engine.js b/lib/booking/slot-engine.js
new file mode 100644
index 0000000000000000000000000000000000000000..0d20540ff4e4393a636589eb3aa2ca385670fac2
--- /dev/null
+++ b/lib/booking/slot-engine.js
@@ -0,0 +1,49 @@
+export function isTimeBased(service) {
+  if (!service) return false
+  if (service.service_type === "time") return true
+  if (service.service_type === "package") return false
+  return !!(service.duration && service.duration > 0)
+}
+
+export async function isSlotAvailable({ supabaseAdmin, userId, date, time, service, servicesList, excludeBookingId } = {}) {
+  if (!supabaseAdmin || !userId || !date || !time) return true
+
+  const svc = servicesList?.find((item) => item.name === service) || null
+  const capacity = svc?.capacity || 1
+
+  let query = supabaseAdmin
+    .from("bookings")
+    .select("id")
+    .eq("user_id", userId)
+    .eq("booking_date", date)
+    .eq("booking_time", time)
+    .in("status", ["confirmed", "pending"])
+
+  if (excludeBookingId) query = query.neq("id", excludeBookingId)
+
+  const { data } = await query
+  return (data?.length || 0) < capacity
+}
+
+export async function findNextAvailableSlot({ supabaseAdmin, userId, date, service, servicesList } = {}) {
+  if (!date) return null
+  const svc = servicesList?.find((item) => item.name === service) || null
+  const duration = svc?.duration || 30
+
+  const slots = []
+  for (let mins = 9 * 60; mins <= 20 * 60; mins += duration) {
+    const hh = String(Math.floor(mins / 60)).padStart(2, "0")
+    const mm = String(mins % 60).padStart(2, "0")
+    slots.push(`${hh}:${mm}`)
+  }
+
+  for (const time of slots) {
+    const free = await isSlotAvailable({ supabaseAdmin, userId, date, time, service, servicesList })
+    if (free) {
+      const dt = new Date(`${date}T${time}:00`)
+      return `${dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at ${time}`
+    }
+  }
+
+  return null
+}
