# Changelog

Semua perubahan penting pada Success IELTS dicatat di sini, per fase pengembangan.

## Fase 1 — Database, autentikasi, role, dan onboarding

### Ditambahkan

- PostgreSQL 17 lokal via `docker-compose.dev.yml`; Prisma 7 (pinned, lihat
  `docs/DECISIONS.md` D-010–D-012) dengan driver adapter `@prisma/adapter-pg`.
- Schema awal: `User` (+ `Role` enum STUDENT/TEACHER/ADMIN), `Account`,
  `Session`, `VerificationToken`, `PasswordResetToken`, `Profile`,
  `UserPreference`; migrasi `20261019100700_init`; seed admin idempotent dari
  `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.
- Auth.js v5: provider Credentials (email/password, bcrypt cost 12) dan Google
  opsional (aktif otomatis jika env tersedia); JWT session membawa `role`
  untuk RBAC server-side (`lib/auth/rbac.ts`: `requireUser`, `requireRole`).
- Alur penuh: register, login, lupa password, reset password, verifikasi
  email (token kustom + mailer pluggable dengan fallback log di dev saat
  provider SMTP belum dikonfigurasi), resend verifikasi.
- `proxy.ts` (Next.js 16; dulu `middleware.ts`) melindungi seluruh `(app)/*`
  dari akses tanpa login.
- Onboarding 3 langkah (tujuan, target band per skill, kebiasaan belajar) —
  non-blocking dengan opsi "Lewati, isi nanti" sesuai Master Prompt §8.1,
  bukan redirect paksa; banner pengingat di app shell untuk email belum
  terverifikasi / onboarding belum selesai.
- Area admin minimal (`/admin`, RBAC `ADMIN`-only) sebagai fondasi Fase 13,
  menampilkan jumlah pengguna nyata dari database.
- Dashboard dan halaman Profil memakai data akun/onboarding sungguhan (tidak
  ada lagi placeholder statis dari Fase 0).
- 23 unit test baru (hashing password, token, validasi Zod register/login/
  onboarding) dan suite E2E baru `e2e/auth.spec.ts` (18 skenario: alur
  lengkap register→onboarding→sign out→sign in, password salah, email
  terdaftar ganda, verifikasi email valid/invalid, reset password
  valid/invalid, RBAC siswa vs admin, akses tanpa login).

### Diperbaiki (ditemukan lewat penulisan E2E test)

- NextAuth `trustHost: true` — tanpa ini, redirect pasca-login memakai origin
  `AUTH_URL` yang di-hardcode, salah port di luar environment yang persis
  cocok dengan `.env` (lihat `docs/DECISIONS.md` D-017).
- Pool koneksi PostgreSQL dinaikkan (10 → 20) karena kontensi di bawah beban
  konkuren.

### Catatan

- Belum ada CMS/kurikulum nyata (Fase 2–4), diagnostic test (Fase 5), atau
  payment (Fase 16, default nonaktif).

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
