import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getServerLocale } from "@/lib/i18n/get-locale";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Success IELTS",
    template: "%s | Success IELTS",
  },
  description:
    "Success IELTS adalah platform belajar IELTS independen dari dasar hingga mahir: Listening, Reading, Writing, Speaking, Grammar, dan Vocabulary dalam satu jalur belajar.",
};

export const viewport: Viewport = {
  themeColor: "#1e3a6b",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        </ThemeProvider>
        <PageViewTracker />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
