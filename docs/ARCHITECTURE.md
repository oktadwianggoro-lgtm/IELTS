# Arsitektur — Success IELTS

Status: Fase 5 (diagnostic test + rencana belajar personal). Dokumen ini
akan diperluas pada setiap fase berikutnya.

## 1. Ringkasan

Success IELTS dibangun sebagai aplikasi web full-stack dengan Next.js App Router.
Repository ini dimulai dari direktori kosong pada Fase 0, sehingga seluruh keputusan
stack di bawah ini dipilih langsung sesuai Master Prompt (bukan hasil migrasi dari
kode lama).

## 2. Tech stack

| Layer                    | Pilihan                                                         | Alasan                                                                                             |
| ------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Framework                | Next.js 16 (App Router) + TypeScript                            | Direkomendasikan Master Prompt; RSC memudahkan halaman konten berat (lesson, passage) tetap cepat. |
| UI                       | Tailwind CSS v4 + shadcn/ui (`base-nova` preset) + Lucide icons | Komponen accessible, headless, mudah ditema ulang via CSS variables.                               |
| Visualisasi              | Recharts                                                        | Untuk grafik progress/estimasi band pada fase lanjutan.                                            |
| Validasi                 | Zod                                                             | Dipakai di server dan client; `react-hook-form` untuk form kompleks (onboarding, CMS).             |
| Testing unit/integration | Vitest + Testing Library                                        | Cepat, terintegrasi baik dengan Vite transform untuk TSX.                                          |
| Testing E2E              | Playwright                                                      | Mendukung multi-browser dan emulasi mobile viewport.                                               |
| Database (Fase 1)        | PostgreSQL + Prisma                                             | Belum diinisialisasi pada Fase 0; lihat `docs/DECISIONS.md`.                                       |
| Auth (Fase 1)            | Auth.js                                                         | Belum diinisialisasi pada Fase 0.                                                                  |

### Catatan versi dependensi (penting untuk `npm install` berikutnya)

Beberapa paket versi terbaru pada saat Fase 0 dikerjakan memiliki konflik peer
dependency yang membuat `npm install` gagal total (npm tidak memasang apa pun jika
resolusi gagal, bukan memasang sebagian):

- `@hookform/resolvers@6.x` menuntut `effect@^4`, bertentangan dengan paket `effect@3.x`
  yang ditarik transitif oleh `shadcn` CLI. **Belum dipasang** — akan ditambahkan pada
  Fase 1 saat form onboarding/CMS benar-benar butuh resolver, dengan versi yang dipin
  agar kompatibel.
- `@vitejs/plugin-react@6.x` punya peer opsional ke `@babel/core@^8` (masih rc) yang
  bertentangan dengan `@babel/core@7.x` yang ditarik oleh `shadcn`/`@shadcn/registry`.
  **Dipin ke `^4.3.4`** (lihat `package.json`), versi stabil yang kompatibel dengan
  Babel 7 dan cukup untuk kebutuhan transform Vitest.

Jika kedua paket di atas perlu versi lebih baru di masa depan, cek ulang resolusi
peer dependency sebelum upgrade massal.

### Catatan lingkungan: sertifikat TLS korporat

Pada mesin pengembangan ini, `npm`/`npx`/`node` gagal mengakses registry npm dengan
error `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` karena jaringan korporat melakukan TLS
inspection dengan root CA yang hanya terdaftar di trust store Windows, bukan di
bundel CA milik Node.js. Solusinya: jalankan Node dengan flag
`--use-system-ca` (tersedia sejak Node 22+), misalnya:

```bash
# PowerShell
$env:NODE_OPTIONS = "--use-system-ca"
npm install

# bash
export NODE_OPTIONS="--use-system-ca"
npm install
```

Ini bukan bagian dari kode aplikasi — hanya diperlukan saat menjalankan `npm`/`npx`
di jaringan dengan TLS inspection. Jika environment lain tidak mengalami masalah ini,
flag ini aman diabaikan.

## 3. Struktur folder

```
app/
  layout.tsx           # Root layout: font, ThemeProvider, LocaleProvider
  page.tsx              # Landing page publik
  globals.css           # Design tokens (Tailwind v4 @theme + CSS variables)
  not-found.tsx / error.tsx
  (app)/                 # Route group berisi seluruh halaman yang memakai AppShell
    layout.tsx            # Membungkus children dengan <AppShell>
    loading.tsx / error.tsx
    dashboard/page.tsx     # Beranda — satu-satunya halaman "nyata" di Fase 0
    <fitur-lain>/page.tsx  # Stub "segera tersedia" untuk 15 menu lain (lihat §5)
components/
  ui/                    # Primitif shadcn/ui (button, card, sheet, dst.)
  layout/                # Logo, SidebarNav, BottomNav, SiteHeader, AppShell
  coming-soon.tsx         # Komponen honest-empty-state untuk fitur belum dibangun
  disclaimer.tsx          # Teks disclaimer wajib (lihat Master Prompt §2)
  theme-provider.tsx / theme-toggle.tsx
  language-toggle.tsx
lib/
  nav-config.ts           # Satu sumber kebenaran untuk menu sidebar + bottom nav
  i18n/                   # Dictionary id/en, LocaleProvider (client), getServerLocale (server)
  utils.ts                # Re-export `cn` dari paket shadcn
tests/
  setup.ts                # Setup Testing Library + jest-dom untuk Vitest
  unit/                   # Unit test (i18n, nav-config, komponen)
e2e/
  smoke.spec.ts           # Playwright smoke test alur utama Fase 0
docs/
  ARCHITECTURE.md (dokumen ini)
  DECISIONS.md
```

## 4. Design tokens

Semua warna brand didefinisikan sebagai CSS custom properties di `app/globals.css`
(`:root` untuk light mode, `.dark` untuk dark mode), lalu diekspos ke Tailwind lewat
blok `@theme inline` sehingga bisa dipakai sebagai utility class biasa
(`bg-brand-navy`, `text-brand-teal`, dll). Palet:

- **Navy** (`--brand-navy`) — warna primer: tombol utama, sidebar aktif, header.
- **Teal** (`--brand-teal`) — aksen sekunder: progress positif, ikon fitur.
- **Amber** (`--brand-amber`) — aksen hangat, dipakai terbatas (badge, highlight).
- **Chart 1–5** — dipetakan ke navy/teal/amber/slate/rose untuk konsistensi grafik
  Recharts pada fase progress/analytics.

Mengubah tema cukup mengubah nilai hex di `:root`/`.dark`; seluruh komponen
mengikuti otomatis karena tidak ada warna yang di-hardcode di komponen.

`--radius` diset lebih kecil (`0.5rem`) dibanding default shadcn agar kesan
"tenang, profesional" sesuai Master Prompt §12, bukan tampilan playful.

## 5. Navigasi dan "honest empty state"

`lib/nav-config.ts` adalah satu sumber data untuk 16 menu pada Master Prompt §5
(dikurangi menu admin, yang menyusul di Fase 13). Setiap item punya `plannedPhase`
opsional yang dirender di halaman stub. Hanya **Beranda** yang punya halaman nyata
pada Fase 0; 15 menu lainnya memakai komponen `<ComingSoon />` yang:

- secara eksplisit berlabel "Segera tersedia" + fase yang direncanakan,
- TIDAK menampilkan data, statistik, atau skor palsu,
- tetap merupakan route yang benar-benar ada dan bisa dinavigasi (bukan tombol mati).

Ini sesuai Master Prompt §1 aturan 3–4: hindari placeholder yang terasa seperti
fitur jadi, tapi juga hindari tombol/menu yang tidak mengarah ke mana pun.

## 6. Internasionalisasi (i18n)

Pendekatan Fase 0 sengaja sederhana (bukan `next-intl` penuh) karena cakupan teks
masih kecil (chrome aplikasi + landing + dashboard shell):

- `lib/i18n/dictionary.ts` — dictionary statis `id`/`en`, default `id`.
- Preferensi disimpan di cookie `locale` (bukan hanya `localStorage`) supaya bisa
  dibaca di server component (`getServerLocale()`) untuk `<html lang>` yang benar
  sejak render pertama, dan juga tersedia di client lewat `LocaleProvider`.
- `useLocale()` dipakai di client component yang butuh teks terjemahan.

**Keterbatasan yang diketahui:** karena ini bukan middleware-based i18n routing,
mengganti bahasa tidak mengubah URL (`/en/...`) dan konten yang di-render di server
(selain `<html lang>` awal) butuh refresh untuk ikut berubah sampai semua halaman
berupa client component atau memakai `getServerLocale()` sendiri. Ini cukup untuk
fondasi; dipertimbangkan ulang jika volume konten bilingual membesar signifikan di
fase konten (Fase 3–4).

## 7. Yang sengaja BELUM dibangun di Fase 0

Sesuai instruksi "satu fase pada satu waktu":

- ~~Tidak ada database/Prisma schema~~ — selesai Fase 1.
- ~~Tidak ada autentikasi/RBAC~~ — selesai Fase 1.
- ~~Tidak ada model konten~~ — selesai Fase 2 (CoursePath/Module/Lesson/Topic/
  Question + CMS review workflow).
- ~~Katalog publik lengkap~~ — selesai Fase 3 (`/materi` penuh, 11 CoursePath/
  46 Module) + Fase 4 (lesson/soal orisinal pertama di setiap skill Starter).
- ~~Tidak ada diagnostic test/rencana belajar~~ — selesai Fase 5, lihat §10.
- Tidak ada practice engine lintas-lesson / Buku Kesalahan dengan spaced
  repetition (Fase 6).
- Tidak ada scoring/AI feedback (Fase 9–11).
- Tidak ada Docker/deployment (Fase 17).

## 8. Pipeline konten (Fase 2)

Konten (CoursePath/Module/Lesson/Question) ditulis sebagai JSON di `content/`,
bukan lewat UI admin — CMS di Fase 2 ini untuk **review dan publish**, bukan
authoring. Lihat `lib/content/schema.ts` untuk bentuk file yang divalidasi.

```
content/
  topics.json              # registry tag lintas lesson/question
  course-paths/*.json
  modules/*.json
  lessons/<level>/*.json   # setiap file: 1 lesson + ≥5 soal mini-quiz-nya
```

- `npm run content:validate` — validasi Zod per file + cross-reference
  (moduleCode/coursePathCode/prerequisite/topic harus benar-benar ada),
  exit code 1 jika ada masalah (cocok untuk pre-commit/CI).
- `npm run content:import` — idempotent: upsert by `code`, menaikkan
  `contentVersion` saat ada perubahan, TIDAK mereset `reviewStatus` konten
  yang sudah APPROVED/PUBLISHED (lihat `docs/DECISIONS.md` untuk batasan ini).
  Konten baru selalu masuk sebagai `DRAFT`.
- Alur editorial: `DRAFT → IN_REVIEW → APPROVED → PUBLISHED` (+ `ARCHIVED`),
  diberlakukan server-side di `app/(admin)/admin/content/[code]/actions.ts`
  terlepas dari apa yang dikirim client. TEACHER bisa draft→review (dan
  kembali ke draft); hanya ADMIN yang bisa approve/publish/archive.
- `/admin/content` (list) dan `/admin/content/[code]` (pratinjau + tombol
  transisi status) di-gate `requireRole(["ADMIN","TEACHER"])` di layout,
  dengan pengecualian lebih ketat per halaman (mis. dashboard admin dengan
  statistik pengguna tetap ADMIN-only).
- `components/content/lesson-view.tsx` me-render lesson dari data terstruktur
  — dipakai untuk pratinjau admin sekarang, dan akan dipakai ulang untuk
  halaman lesson siswa sungguhan di Fase 3.

## 9. Diagnostic test & rencana belajar (Fase 5)

Alur: `/mulai-dari-sini` (ringkasan 3 langkah) → `/mulai-dari-sini/diagnostic/[resultId]`
(soal) → `/mulai-dari-sini/diagnostic/[resultId]/hasil` (estimasi) →
`/rencana-belajar` (rencana harian). Model baru: `DiagnosticResult`,
`DiagnosticAnswer`, `SkillEstimate`, `StudyPlan`, `StudyPlanItem`.

- **Sampling soal:** `sampleDiagnosticQuestions()` mengambil soal
  `PUBLISHED` dari seluruh bank soal, dikelompokkan per `skill:level`, dan
  mengambil maksimal 2 soal per kelompok — supaya diagnostic test singkat
  tapi tetap menyentuh semua skill yang sudah punya konten, bukan hanya
  level/skill dengan soal terbanyak.
- **Penilaian:** `startDiagnosticAction` idempotent (melanjutkan
  `DiagnosticResult` `IN_PROGRESS` yang sama jika sudah ada, bukan membuat
  baru setiap klik). `submitDiagnosticAction` menilai tiap jawaban lewat
  `gradeAnswer()` yang sama dengan mini-quiz lesson (lihat D-021), lalu
  memanggil `estimateDiagnostic()` (pure function, `lib/diagnostic/estimate.ts`)
  untuk menentukan level dan confidence.
- **Estimasi level:** `estimateDiagnostic()` berjalan top-down dari level
  tertinggi yang disampling, memilih level tertinggi yang mencapai ambang
  70% benar, dan turun ke level yang lebih rendah jika tidak ada yang lolos.
  Confidence diskalakan dari jumlah soal dan keluasan level yang
  disampling, dibatasi maksimal 0.6 — sengaja dibuat konservatif karena bank
  soal saat ini masih kecil (lihat catatan "estimasi, bukan skor resmi" di
  UI hasil).
- **Rencana belajar:** `generateStudyPlan()` (pure function,
  `lib/study-plan/generate.ts`) memfilter lesson yang prasyaratnya sudah
  terpenuhi dan belum selesai, memberi bobot lebih tinggi pada skill
  terlemah (`weakSkillsAscending` dari hasil diagnostic) dan level yang
  dekat dengan estimasi, lalu mengemasnya ke beberapa hari sesuai budget
  menit belajar harian pengguna (`resolvePlanHorizonDays()` membatasi
  horizon rencana ke `testDate` pengguna jika ada, maksimal 60 hari).
  Setiap hari selalu dapat minimal 1 lesson walau melebihi budget menit,
  supaya rencana tidak pernah kosong di hari yang masih tersisa.
- **Dashboard terhubung ke data nyata:** `/dashboard` menampilkan item
  `StudyPlanItem` yang `scheduledDate`-nya hari ini dari `StudyPlan` aktif
  milik user — bukan lagi state kosong statis seperti Fase 0–4.

### Bug kelas "perbandingan jumlah tanpa guard nol" (lihat D-024)

Dua bug ditemukan dalam fase ini lewat verifikasi visual manual (bukan unit
test maupun E2E yang sudah ada saat itu): (1) `Question.reviewStatus` tidak
pernah ikut berubah saat `Lesson.reviewStatus` di-publish/archive, sehingga
soal yang "terlihat jalan" di lesson sebenarnya belum pernah benar-benar
PUBLISHED; dan (2) tombol submit yang dicek lewat `jumlah === total`
bernilai `true` secara trivial saat `0 === 0`. Keduanya diperbaiki dan
didokumentasikan detail di `docs/DECISIONS.md` D-024 — dicatat di sini juga
karena polanya relevan untuk reviewer arsitektur, bukan hanya pembaca log
keputusan.

## 10. Menjalankan proyek secara lokal

Lihat `README.md` untuk perintah lengkap. Ringkas:

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run test        # Vitest unit test
npm run test:e2e     # Playwright (otomatis build + start di port 3100)
```
