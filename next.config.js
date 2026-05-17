/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/ai": ["./prompts/**/*"],
    },
  },
};

module.exports = nextConfig;
