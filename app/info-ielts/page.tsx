import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { Logo } from "@/components/layout/logo";
import { BandCalculator } from "@/components/info-ielts/band-calculator";
import { getSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Info IELTS",
  description:
    "Panduan independen tentang format IELTS Academic dan General Training, cara penilaian, kalkulator estimasi overall band, FAQ, dan glosarium istilah — dengan tautan ke sumber resmi.",
  alternates: { canonical: "/info-ielts" },
  openGraph: {
    title: "Info IELTS | Success IELTS",
    description:
      "Panduan independen tentang format IELTS, cara penilaian, dan kalkulator estimasi overall band.",
    type: "article",
  },
};

const FAQ_ITEMS = [
  {
    q: "Berapa lama hasil IELTS keluar?",
    a: "Bervariasi tergantung format dan lokasi tes — umumnya beberapa hari untuk tes berbasis komputer dan bisa lebih lama untuk tes berbasis kertas. Jadwal pastinya berubah dari waktu ke waktu, jadi selalu cek pusat tes atau situs resmi Anda untuk tanggal yang berlaku saat ini.",
  },
  {
    q: "Apakah skor di Grammar Practice/Diagnostic aplikasi ini sama dengan skor resmi IELTS?",
    a: "Tidak. Grammar Practice dan Diagnostic Test di Success IELTS adalah alat bantu belajar internal, bukan section resmi IELTS, dan tidak boleh dianggap setara dengan overall band resmi.",
  },
  {
    q: "Apakah feedback Writing/Speaking otomatis di aplikasi ini setara dengan penilaian examiner resmi?",
    a: "Tidak. Fitur self-assessment dan contoh jawaban di Writing Lab/Speaking Lab adalah alat refleksi untuk belajar, bukan skor atau keputusan resmi IELTS.",
  },
  {
    q: "Apa beda IELTS Academic dan General Training?",
    a: "Keduanya berbagi section Listening dan Speaking yang sama. Reading sama-sama 40 soal dalam 60 menit di kedua versi, tapi teksnya berbeda — Academic memakai teks bergaya akademik, General Training memakai teks sehari-hari seperti pengumuman kerja atau surat. Writing Task 1 berbeda (Academic: mendeskripsikan data visual; General Training: menulis surat), sementara Task 2 (esai) strukturnya mirip. Academic umumnya untuk pendaftaran universitas, General Training umumnya untuk migrasi/kerja dan biasanya tidak diterima untuk pendaftaran universitas.",
  },
  {
    q: "Berapa kali saya boleh mengambil tes IELTS?",
    a: "Pada umumnya tidak ada batas jumlah percobaan, tapi kebijakan bisa berbeda per pusat tes dan negara. Cek situs resmi atau pusat tes Anda untuk aturan yang berlaku.",
  },
];

const GLOSSARY_ITEMS = [
  { term: "Band Score", def: "Skala 0–9 yang mengukur kemampuan bahasa Inggris, per skill maupun secara keseluruhan." },
  {
    term: "Task Response / Task Achievement",
    def: "Seberapa lengkap dan relevan jawaban Writing Anda menjawab instruksi soal.",
  },
  {
    term: "Coherence and Cohesion",
    def: "Seberapa runtut dan saling terhubung ide-ide dalam tulisan atau jawaban lisan Anda.",
  },
  { term: "Lexical Resource", def: "Variasi dan ketepatan kosakata yang digunakan." },
  {
    term: "Grammatical Range and Accuracy",
    def: "Variasi struktur kalimat serta ketepatan tata bahasa yang digunakan.",
  },
  {
    term: "Fluency and Coherence",
    def: "Kriteria Speaking: kelancaran berbicara tanpa jeda berlebihan, dengan ide yang tersusun jelas.",
  },
  { term: "Pronunciation", def: "Kriteria Speaking: kejelasan pelafalan yang mudah dipahami pendengar." },
  {
    term: "Computer-delivered vs Paper-based",
    def: "Dua format pelaksanaan tes yang tersedia tergantung lokasi dan pusat tes Anda.",
  },
];

export default async function InfoIeltsPage() {
  const session = await getSession();
  const resources = await prisma.officialResource.findMany({ orderBy: { category: "asc" } });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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
            Info IELTS
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Panduan IELTS Independen</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Ringkasan format, penilaian, dan istilah IELTS yang diparafrasekan dari sumber resmi
            untuk membantu Anda bersiap — bukan pengganti situs resmi IELTS.
          </p>
        </div>

        <Disclaimer />

        <Card>
          <CardHeader>
            <CardTitle>IELTS Academic vs General Training</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Kedua versi IELTS berbagi section Listening dan Speaking yang identik. Reading
              sama-sama berisi 40 soal dalam 60 menit di kedua versi, tapi jenis teksnya berbeda:
              Academic memakai teks bergaya akademik (artikel, laporan penelitian), sementara
              General Training memakai teks sehari-hari seperti pengumuman kerja, iklan, atau surat
              resmi.
            </p>
            <p>
              Writing juga punya dua task di kedua versi. Task 1 berbeda: Academic meminta Anda
              mendeskripsikan data visual (grafik, diagram, tabel, atau proses), sedangkan General
              Training meminta Anda menulis surat menanggapi sebuah situasi. Task 2 (esai
              argumentatif) strukturnya serupa di kedua versi, meski topiknya bisa berbeda nuansa.
            </p>
            <p>
              Secara umum, Academic ditujukan untuk pendaftaran universitas atau registrasi
              profesional, sedangkan General Training ditujukan untuk migrasi, pekerjaan, atau
              pendidikan non-universitas — dan biasanya tidak diterima untuk pendaftaran
              universitas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Format dan Durasi Tes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <p className="font-medium">Listening</p>
                <p className="text-muted-foreground">~30 menit, 40 soal</p>
              </div>
              <div>
                <p className="font-medium">Reading</p>
                <p className="text-muted-foreground">~60 menit, 40 soal</p>
              </div>
              <div>
                <p className="font-medium">Writing</p>
                <p className="text-muted-foreground">~60 menit, 2 task</p>
              </div>
              <div>
                <p className="font-medium">Speaking</p>
                <p className="text-muted-foreground">~11–14 menit</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Total sekitar 2 jam 45 menit. Listening, Reading, dan Writing dikerjakan berurutan di
              hari yang sama tanpa jeda; Speaking bisa di hari yang sama atau dijadwalkan dalam
              rentang ±7 hari, tergantung pusat tes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cara Penilaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed">
            <p>
              Setiap skill dinilai pada skala 0–9. Listening dan Reading dinilai dari jumlah jawaban
              benar (raw score) yang dikonversi ke band — konversi ini bisa sedikit berbeda antar
              versi tes, jadi aplikasi ini membaca tabel konversi yang diverifikasi dan diberi
              tanggal, bukan angka tetap (lihat Tryout IELTS untuk contohnya).
            </p>
            <p>
              Writing dinilai dari empat kriteria: Task Response/Achievement, Coherence and
              Cohesion, Lexical Resource, dan Grammatical Range and Accuracy — dengan Task 2 berbobot
              lebih besar dari Task 1. Speaking dinilai dari Fluency and Coherence, Lexical
              Resource, Grammatical Range and Accuracy, dan Pronunciation.
            </p>
            <p>
              Overall band adalah rata-rata keempat skill, dibulatkan dengan aturan resmi: rata-rata
              berakhiran .25 dibulatkan naik ke half band berikutnya, dan .75 dibulatkan naik ke
              whole band berikutnya.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kalkulator Estimasi Overall Band</CardTitle>
          </CardHeader>
          <CardContent>
            <BandCalculator />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="space-y-1 text-sm">
                <p className="font-medium">{item.q}</p>
                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Glosarium</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {GLOSSARY_ITEMS.map((item) => (
              <div key={item.term} className="text-sm">
                <p className="font-medium">{item.term}</p>
                <p className="text-muted-foreground">{item.def}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tautan Resmi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {resources.map((r) => (
              <div key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-navy hover:underline"
                >
                  {r.label}
                </a>
                <p className="text-muted-foreground text-xs">
                  Diverifikasi {r.verifiedAt.toLocaleDateString("id-ID")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Disclaimer />
      </main>

      <footer className="border-border text-muted-foreground border-t px-4 py-6 text-center text-xs sm:px-6">
        © {new Date().getFullYear()} Success IELTS ·{" "}
        <Link href="/privasi" className="underline underline-offset-2">
          Kebijakan Privasi
        </Link>
      </footer>
    </div>
  );
}
