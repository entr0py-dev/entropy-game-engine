/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Allow any domain to fetch resources (fixes some fetch errors)
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          
          // Allow the app to be embedded in an iframe
          { 
            key: "Content-Security-Policy", 
            value: "frame-ancestors 'self' https://*.framer.website https://www.entropyofficial.com https://entropyofficial.com;" 
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
