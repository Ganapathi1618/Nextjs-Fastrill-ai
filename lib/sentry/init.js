// lib/sentry/init.js — Lightweight error tracking wrapper
// If SENTRY_DSN is not set, all calls are no-ops (safe for dev/staging).
// Install: npm install @sentry/node

let Sentry = null
let initialized = false

function initSentry() {
  if (initialized) return
  initialized = true
  if (!process.env.SENTRY_DSN) {
    console.log("ℹ️ SENTRY_DSN not set — error tracking disabled")
    return
  }
  try {
    Sentry = require("@sentry/node")
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.1,
      beforeSend(event) {
        if (event.exception?.values) {
          for (const ex of event.exception.values) {
            if (ex.value?.includes("AbortError")) return null
            if (ex.value?.includes("ECONNRESET")) return null
          }
        }
        return event
      }
    })
    console.log("✅ Sentry initialized")
  } catch (e) {
    console.warn("⚠️ Sentry init failed:", e.message)
  }
}

function captureException(err, context) {
  if (!Sentry) return
  if (context) Sentry.withScope(scope => {
    if (context.userId) scope.setUser({ id: context.userId })
    if (context.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v))
    if (context.extra) Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v))
    Sentry.captureException(err)
  })
  else Sentry.captureException(err)
}

function captureMessage(msg, level = "info") {
  if (!Sentry) return
  Sentry.captureMessage(msg, level)
}

initSentry()

module.exports = { captureException, captureMessage }
