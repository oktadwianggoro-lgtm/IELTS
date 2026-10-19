import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-brand-teal text-sm font-medium">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan. Coba kembali ke beranda.
      </p>
      <Button render={<Link href="/">Kembali ke Beranda</Link>} />
    </div>
  );
}
