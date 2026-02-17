/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@jellyfish/shared'],
  logging: {
    incomingRequests: { ignore: [/^\/api\//] },
  },
}
module.exports = nextConfig
