/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark Puppeteer packages as server-only externals
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    '@sparticuz/chromium',
    'mongoose',
    'bcryptjs',
    'jsonwebtoken',
  ],

  // Allow longer API route execution for the analyze endpoint
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
