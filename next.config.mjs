/** @type {import('next').NextConfig} */
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.trim().replace(/^["']|["']$/g, "").trim();
}

const nextConfig = {
  output: "standalone",
};

export default nextConfig;
