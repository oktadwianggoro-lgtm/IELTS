import type { MetadataRoute } from "next";

/**
 * Installable PWA manifest. Scope is deliberately "/" (the whole app), but
 * see public/sw.js and D-042 for what that install actually buys you: the
 * static shell and already-visited pages are available offline, never
 * server-authoritative exam/grading routes (Tryout, Lab submissions) — those
 * require a live connection by design, same principle as D-038's "never
 * trust the client with exam timing".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Success IELTS",
    short_name: "Success IELTS",
    description:
      "Platform belajar IELTS independen dari dasar hingga mahir: Listening, Reading, Writing, Speaking, Grammar, dan Vocabulary dalam satu jalur belajar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1e3a6b",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
