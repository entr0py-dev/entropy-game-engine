/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
          // Allows embedding on your specific domain
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://*.framer.website https://www.entropyofficial.com https://entropyofficial.com;" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
