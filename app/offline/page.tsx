import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Anda sedang offline",
};

/**
 * Served by public/sw.js when a navigation to the public shell fails with
 * no network and nothing cached yet — see D-042 for why this fallback only
 * covers the public shell, never authenticated or exam pages.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Logo />
      <h1 className="text-2xl font-semibold tracking-tight">Anda sedang offline</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Halaman ini butuh koneksi internet dan belum pernah dibuka di perangkat ini, jadi belum
        tersimpan untuk dibuka offline. Coba lagi setelah tersambung ke internet.
      </p>
    </div>
  );
}
