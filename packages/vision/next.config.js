/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jellyfish/shared'],
  logging: {
    incomingRequests: { ignore: [/^\/api\//] },
  },
}
module.exports = nextConfig
