/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.kineticapp.ca",
      },
    ],
  },
};

export default nextConfig;
