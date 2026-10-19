# Changelog

Semua perubahan penting pada Success IELTS dicatat di sini, per fase pengembangan.

## Fase 2 — Content model, CMS minimal, importer dan validator

### Ditambahkan

- Model konten di Prisma: `CoursePath`, `Module`, `Lesson` (+
  `LessonPrerequisite`), `Topic` (+ `LessonTopic`/`QuestionTopic`), `Question`
  generik multi-tipe (`QuestionType`: multiple choice, gap fill, matching,
  ordering, short answer, true/false/not given, yes/no/not given, sentence
  transformation, error correction, summary completion). Semua membawa
  `reviewStatus` (`DRAFT→IN_REVIEW→APPROVED→PUBLISHED→ARCHIVED`),
  `contentVersion`, `reviewedBy`/`reviewedAt`, `sourceNotes`,
  `lastUpdatedAt` sesuai Master Prompt §7.
- `lib/content/schema.ts`: schema Zod untuk file JSON lesson/question/module/
  course-path/topic, termasuk validasi silang per tipe soal (mis. multiple
  choice wajib ≥2 opsi dan `answerKey` harus cocok salah satu ID opsi).
- `lib/content/loader.ts` + `npm run content:validate`: membaca seluruh
  `content/**/*.json`, validasi per file DAN validasi lintas-file (kode
  module/course-path/prerequisite/topic harus benar-benar ada, kode lesson/
  question unik). Exit code 1 jika ada masalah — diuji benar-benar mendeteksi
  12 jenis kesalahan berbeda dari fixture sengaja-rusak.
- `npm run content:import`: importer idempotent (upsert by `code`) — diuji
  dengan menjalankan dua kali berturut-turut dan memverifikasi tidak ada
  baris duplikat di database.
- Konten seed vertical-slice orisinal pertama: lesson "Alphabet dan Spelling"
  (Starter/Pre-A1, Grammar) lengkap dengan 5 soal mini-quiz (3 tipe soal
  berbeda), mengikuti format wajib 16-bagian Master Prompt §7.
- CMS admin minimal: `/admin/content` (daftar lesson + status badge) dan
  `/admin/content/[code]` (pratinjau siswa + tombol transisi status),
  diakses TEACHER/ADMIN; hanya ADMIN yang bisa approve/publish/archive,
  diberlakukan server-side (`app/(admin)/admin/content/[code]/actions.ts`).
- `components/content/lesson-view.tsx`: komponen render lesson yang akan
  dipakai ulang untuk halaman lesson siswa di Fase 3.
- 18 unit test baru (schema Zod, loader lintas-file terhadap konten seed
  sungguhan) dan E2E baru `e2e/content-cms.spec.ts` yang menjalankan seluruh
  alur editorial (draft→review→approved→published) di browser asli, plus
  verifikasi siswa biasa diblokir dari CMS.

### Catatan

- CMS Fase 2 adalah alat **review/publish**, bukan editor WYSIWYG — menulis
  konten baru tetap lewat file JSON + importer (lihat `docs/DECISIONS.md`
  D-020). Editor penuh menyusul Fase 13.
- Baru 1 lesson yang di-seed (vertical slice); katalog publik penuh dan
  lebih banyak konten menyusul Fase 3–4.

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
