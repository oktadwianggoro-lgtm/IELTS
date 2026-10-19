import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { Logo } from "@/components/layout/logo";
import { getSession } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Data apa yang dikumpulkan Success IELTS, untuk apa, berapa lama disimpan, dan bagaimana mengatur atau menghapusnya sendiri.",
  alternates: { canonical: "/privasi" },
};

export default async function PrivacyPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <Logo />
        <Link
          href={session?.user ? "/dashboard" : "/register"}
          className="text-brand-navy text-sm font-medium hover:underline"
        >
          {session?.user ? "Ke Dashboard" : "Mulai Belajar Gratis"}
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6">
        <div>
          <Badge variant="secondary" className="mb-3">
            Privasi
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Kebijakan Privasi</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Ringkasan jujur tentang data apa yang benar-benar dikumpulkan aplikasi ini, untuk apa,
            dan bagaimana Anda mengatur atau menghapusnya sendiri — bukan boilerplate hukum generik.
          </p>
        </div>

        <Disclaimer />

        <Card>
          <CardHeader>
            <CardTitle>Data apa yang dikumpulkan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              <span className="font-medium">Data akun</span> — nama, email, dan password (disimpan
              sebagai hash, tidak pernah dalam bentuk asli), untuk login dan identifikasi akun Anda.
            </p>
            <p>
              <span className="font-medium">Data belajar</span> — jawaban latihan, submission
              Writing/Speaking, hasil diagnostic test, progress lesson, bookmark, catatan, dan hasil
              tryout. Data ini dipakai untuk menampilkan progress Anda sendiri, memberi penilaian
              otomatis, dan menyusun rencana belajar — tidak pernah dijual atau dibagikan ke pihak
              ketiga.
            </p>
            <p>
              <span className="font-medium">Analitik penggunaan</span> — kunjungan halaman dicatat
              secara anonim: sebuah ID acak yang dibuat dan disimpan di localStorage browser Anda
              sendiri (bukan cookie lintas situs), ditautkan ke akun Anda hanya jika sedang login.
              Tidak ada alamat IP atau user agent yang disimpan, dan tidak ada script analitik pihak
              ketiga (Google Analytics, dsb.) di aplikasi ini. Pencatatan ini otomatis dilewati jika
              browser Anda mengirim header &ldquo;Do Not Track&rdquo;.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Berapa lama disimpan, dan dengan siapa dibagikan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Data akun dan data belajar disimpan selama akun Anda aktif. Data analitik agregat
              (jumlah kunjungan per halaman) disimpan untuk memahami fitur mana yang benar-benar
              dipakai, demi perbaikan aplikasi — bukan untuk mengidentifikasi Anda secara pribadi.
            </p>
            <p>
              Success IELTS tidak membagikan, menjual, atau menyewakan data Anda ke pihak ketiga
              mana pun untuk tujuan apa pun, termasuk iklan.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookie dan penyimpanan browser</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Satu cookie sesi login (wajib, agar Anda tetap masuk) dan satu cookie preferensi
              bahasa/tema. Tidak ada cookie pelacakan iklan atau pihak ketiga. ID analitik anonim
              disimpan di localStorage (bukan cookie) sehingga tidak pernah ikut terkirim ke situs
              lain.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hak Anda atas data sendiri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Semua pengaturan berikut dilakukan sendiri, langsung dari halaman{" "}
              <Link href="/profil" className="text-brand-navy underline underline-offset-2">
                Profil
              </Link>{" "}
              — tidak perlu menghubungi siapa pun:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Nonaktifkan analitik kapan saja lewat sakelar &ldquo;Analitik penggunaan&rdquo;.</li>
              <li>
                Nonaktifkan nama samaran di leaderboard lewat sakelar &ldquo;Ikut leaderboard&rdquo;.
              </li>
              <li>
                Hapus akun secara permanen lewat tombol &ldquo;Hapus Akun&rdquo; — menghapus data
                akun dan data belajar Anda. Event analitik yang sudah tercatat dianonimkan (tautan ke
                akun Anda diputus), bukan ikut terhapus, supaya statistik agregat yang sudah ada tetap
                akurat untuk pengguna lain.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Disclaimer />
      </main>

      <footer className="border-border text-muted-foreground border-t px-4 py-6 text-center text-xs sm:px-6">
        © {new Date().getFullYear()} Success IELTS ·{" "}
        <Link href="/info-ielts" className="underline underline-offset-2">
          Info IELTS
        </Link>
      </footer>
    </div>
  );
}
