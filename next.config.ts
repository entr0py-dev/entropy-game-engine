/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" }, // Allow CORS
          { key: "X-Frame-Options", value: "ALLOWALL" }, // Allow Embedding
          { 
            key: "Content-Security-Policy", 
            // CRITICAL: Explicitly allow your Framer domain
            value: "frame-ancestors * https://*.framer.website https://www.entropyofficial.com https://entropyofficial.com;" 
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
