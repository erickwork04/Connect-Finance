/** @type {import('next').NextConfig} */
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.trim().replace(/^["']|["']$/g, "").trim();
}

const nextConfig = {
  output: "standalone",
  // A production build must not remove the chunks served by a running dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
