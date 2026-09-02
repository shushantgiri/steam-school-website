/** @type {import('next').NextConfig} */
const nextConfig = {
  // The PDF renderer ships Node-only code; keep it out of the webpack bundle.
  experimental: { serverComponentsExternalPackages: ["@react-pdf/renderer"] },
  images: {
    remotePatterns: [
      // Stock photos used by the built-in design.
      { protocol: "https", hostname: "images.unsplash.com" },
      // The school's own Supabase Storage (gallery, homepage photos, documents).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};
export default nextConfig;
