import type { MetadataRoute } from "next";

/**
 * Only genuinely public, indexable routes — "Hindari menerbitkan ribuan
 * halaman tipis otomatis demi SEO" (Master Prompt §16). Authenticated
 * app routes (dashboard, labs, etc.) are deliberately excluded since they
 * require login and have nothing to offer a search crawler.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/info-ielts`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/privasi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
