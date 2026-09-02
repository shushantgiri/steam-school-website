import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSettings } from "@/lib/data";
import "./globals.css";

// Every page renders at request time. The CMS means nothing is truly static,
// and this also permits the no-cache Supabase reads (lib/supabase.ts) during
// the build — Next.js forbids no-store fetches while pre-rendering static
// pages, which made Vercel builds fail once Supabase env vars were present.
export const dynamic = "force-dynamic";

// Poppins is vendored in app/fonts so `next build` never depends on Google
// Fonts being reachable — the same files ship to every environment.
const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Poppins-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

/** Title and description come from Settings in the CMS. */
export async function generateMetadata(): Promise<Metadata> {
  const { name, seo } = await getSettings();
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const shareTitle = seo.shareTitle || seo.title;
  const shareDescription = seo.shareDescription || seo.description;
  const keywords = seo.keywords ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined;
  return {
    // metadataBase turns the icon/thumbnail files into absolute URLs for
    // social platforms; set NEXT_PUBLIC_SITE_URL in production.
    ...(site ? { metadataBase: new URL(site) } : {}),
    title: { default: seo.title, template: `%s · ${name}` },
    description: seo.description,
    applicationName: name,
    keywords: keywords ?? [name, "school in Dang", "Deukhuri school", "STEAM education Nepal", "admissions", "examination results"],
    alternates: site ? { canonical: "/" } : undefined,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_NP",
      siteName: name,
      title: shareTitle,
      description: shareDescription,
      url: site || undefined,
      // A custom sharing image from Settings → SEO & Sharing wins over the built-in one.
      ...(seo.shareImage ? { images: [{ url: seo.shareImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: "summary_large_image", title: shareTitle, description: shareDescription, ...(seo.shareImage ? { images: [seo.shareImage] } : {}) },
    ...(seo.faviconUrl ? { icons: { icon: seo.faviconUrl, shortcut: seo.faviconUrl, apple: seo.faviconUrl } } : {}),
    // The share image and icons come from app/opengraph-image.png, app/icon.svg,
    // app/apple-icon.png — Next.js wires them into every page automatically.
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
