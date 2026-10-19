# Changelog

Semua perubahan penting pada Success IELTS dicatat di sini, per fase pengembangan.

## Fase 0 — Audit, fondasi, dan desain sistem

### Ditambahkan

- Scaffold Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
  (`base-nova` preset), ESLint, Lucide icons.
- Design tokens brand Success IELTS (navy/teal/amber) di `app/globals.css`, light
  dan dark mode, dengan kontras yang disengaja untuk WCAG AA.
- Layout responsif: `SidebarNav` (desktop), `BottomNav` + sheet "Lainnya" (mobile),
  `SiteHeader` dengan toggle bahasa (ID/EN) dan tema (light/dark).
- `lib/nav-config.ts` sebagai satu sumber kebenaran untuk 16 menu pengguna dari
  Master Prompt §5.
- Landing page publik dan halaman Beranda (dashboard) dengan empty state yang jujur
  (tidak ada data/statistik palsu).
- Komponen `<ComingSoon />` untuk 15 menu yang kontennya belum dibangun, masing-masing
  berlabel fase yang direncanakan — bukan placeholder kosong atau tombol mati.
- Komponen `<Disclaimer />` berisi teks disclaimer wajib Master Prompt §2.
- i18n sederhana berbasis cookie (`lib/i18n/`) dengan dictionary id/en untuk seluruh
  teks chrome, landing, dan dashboard yang dibangun di fase ini.
- Custom `not-found.tsx`, `error.tsx` (root dan segmen `(app)`), `loading.tsx`.
- Tooling: Prettier + `prettier-plugin-tailwindcss`, Vitest + Testing Library,
  Playwright, dengan skrip `lint`, `typecheck`, `format`, `test`, `test:e2e`.
- Unit test untuk integritas dictionary i18n dan konfigurasi navigasi; E2E smoke
  test untuk alur landing → dashboard → stub fitur → toggle bahasa → responsive nav.
- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `.env.example`.

### Catatan

- Belum ada database, autentikasi, atau konten kurikulum nyata — lihat
  `docs/ARCHITECTURE.md` §7 untuk daftar yang sengaja ditunda ke fase berikutnya.
