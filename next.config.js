

// @ts-check
 
/** @type {import('next').NextConfig} */

const nextConfig = {
  compress: false,
  experimental: {
    allowDevelopmentBuild: true,
    serverSourceMaps: true,
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
   typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    // ignoreBuildErrors: true,
  },
}
 
module.exports = nextConfig
