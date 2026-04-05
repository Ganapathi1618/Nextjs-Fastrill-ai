/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        '@': '.',
      },
    },
  },
}

module.exports = nextConfig