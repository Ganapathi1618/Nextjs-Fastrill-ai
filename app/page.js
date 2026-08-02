"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdLensLanding() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-purple-100">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm transition-all duration-300 ${
        scrolled ? 'bg-white/80 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              📊
            </div>
            <span className="font-bold text-lg text-gray-900">AdLens</span>
          </div>
          <button
            onClick={() => router.push("/signup")}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            Get Started →
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden pt-20 flex items-center">
        {/* Animated gradient shapes */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 opacity-30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 opacity-30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="text-center max-w-3xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
              <span className="text-gray-900">Find What's Failing.</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-500 bg-clip-text text-transparent">
                Scale What's Winning.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              AdLens helps you analyze your advertising performance across campaigns and gives you AI-powered insights that drive better results.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => router.push("/signup")}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Get Started →
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-4 rounded-full border-2 border-gray-300 text-gray-900 font-semibold text-lg hover:border-gray-400 hover:bg-white transition-all"
              >
                View Demo
              </button>
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200">
                <span className="text-blue-600">✨</span>
                <span className="text-sm font-medium text-blue-700">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200">
                <span className="text-green-600">📈</span>
                <span className="text-sm font-medium text-green-700">Real-Time Insights</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200">
                <span className="text-purple-600">⚡</span>
                <span className="text-sm font-medium text-purple-700">Lightning Fast</span>
              </div>
            </div>
          </div>

          {/* Illustration Grid */}
          <div className="mt-16 flex justify-center">
            <div className="relative w-full max-w-md h-80">
              {/* Gradient background */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 blur-2xl opacity-60" />

              {/* Icon grid */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-6 p-8">
                  <div className="w-20 h-20 rounded-2xl bg-blue-500 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform">📊</div>
                  <div className="w-20 h-20 rounded-2xl bg-purple-500 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform">🚀</div>
                  <div className="w-20 h-20 rounded-2xl bg-pink-500 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform">✨</div>
                  <div className="w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform">💡</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t border-gray-200/50 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-gray-600 mb-8">Trusted by leading marketing teams</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-70">
            <span className="text-gray-400 font-bold text-lg">Notion</span>
            <span className="text-gray-400 font-bold text-lg">Zapier</span>
            <span className="text-gray-400 font-bold text-lg">HubSpot</span>
            <span className="text-gray-400 font-bold text-lg">Intercom</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 py-12 text-center text-sm text-gray-600 bg-white/30">
        <p>Your data is encrypted and never shared. Enterprise security standards.</p>
      </footer>
    </div>
  )
}
