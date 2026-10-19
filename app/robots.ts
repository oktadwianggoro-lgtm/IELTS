import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/info-ielts", "/privasi", "/login", "/register"],
        // Authenticated app routes and admin have nothing for a crawler
        // and shouldn't be indexed even if a crawler somehow reaches them.
        disallow: ["/dashboard", "/admin", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
