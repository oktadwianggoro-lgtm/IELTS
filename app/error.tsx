"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Terjadi kesalahan</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Maaf, terjadi kesalahan tak terduga. Silakan coba lagi. Jika masalah berlanjut, muat ulang
          halaman.
        </p>
        <Button onClick={reset}>Coba lagi</Button>
      </body>
    </html>
  );
}
