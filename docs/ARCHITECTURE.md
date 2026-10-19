# Arsitektur — Success IELTS

Status: Fase 0 (fondasi). Dokumen ini akan diperluas pada setiap fase berikutnya.

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

- Tidak ada database/Prisma schema (Fase 1).
- Tidak ada autentikasi/RBAC — halaman `(app)/*` belum dilindungi (Fase 1).
- Tidak ada konten kurikulum nyata — semua memakai `<ComingSoon />` (Fase 2–4).
- Tidak ada scoring/AI feedback (Fase 9–11).
- Tidak ada Docker/deployment (Fase 17).

## 8. Menjalankan proyek secara lokal

Lihat `README.md` untuk perintah lengkap. Ringkas:

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run test        # Vitest unit test
npm run test:e2e     # Playwright (otomatis build + start di port 3100)
```
