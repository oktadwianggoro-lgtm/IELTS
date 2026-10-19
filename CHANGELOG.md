# Changelog

Semua perubahan penting pada Success IELTS dicatat di sini, per fase pengembangan.

## Fase 4 — Content seed tahap pertama

### Ditambahkan

- 6 lesson orisinal baru, masing-masing dengan format wajib 16-bagian
  (Master Prompt §7) dan 5 soal mini-quiz asli: `STARTER-VOCAB-001`
  (Vocabulary), `STARTER-LISTENING-001` (Listening), `STARTER-READING-001`
  (Reading), `STARTER-WRITING-001` (Writing), `STARTER-SPEAKING-001`
  (Speaking), dan `A1-GRAM-001` (Grammar, Present Simple vs Continuous) —
  lesson vertical-slice pertama ke level A1.
- Seluruh 6 skill di level Starter/Pre-A1 kini punya minimal 1 lesson
  lengkap dan diterbitkan (sebelumnya hanya Grammar).
- `A1-GRAM-001` membuktikan rantai prasyarat lintas-level bekerja end-to-end
  (menampilkan 2 lesson Starter sebagai prasyarat di halaman lesson).
- 35 soal baru tervalidasi (total 40 soal di seluruh konten saat ini),
  mencakup 7 dari 10 tipe soal yang didukung schema (multiple choice, gap
  fill, short answer, error correction, ordering, matching, true/false/not
  given).

### Catatan — cakupan konten sesungguhnya (tidak dilebih-lebihkan)

- Master Prompt Fase 4 meminta "2-3 lesson lengkap per skill" untuk level
  awal plus vertical slice di level lain. Menulis konten edukasi orisinal
  dengan kualitas terjaga (bukan sekadar memenuhi kuota) untuk cakupan
  sebesar itu adalah pekerjaan berkelanjutan, bukan sekali selesai — lihat
  Master Prompt §10: "Prioritaskan kualitas pengajaran dan ketepatan
  feedback dibanding kuantitas soal."
- Fase ini **sengaja** memprioritaskan **kualitas dan keluasan** (1 lesson
  solid per skill, menutupi seluruh level Starter) di atas **kedalaman**
  (2-3 lesson per skill) untuk membuktikan pipeline bekerja lintas semua
  tipe skill dan lintas-level, bukan menumpuk banyak lesson di satu area.
- 40 dari 46 modul katalog (lihat Fase 3) masih "Segera tersedia" — ini
  **bukan** utang teknis yang disembunyikan, melainkan cakupan yang memang
  terbuka dan ditandai jujur di UI, untuk dilanjutkan di Fase 18
  ("Perluasan konten berkelanjutan", yang menurut Master Prompt sendiri
  memang bersifat iteratif/tidak pernah "selesai sekali jalan").
- Semua lesson baru melalui alur review yang sama seperti Fase 2/3
  (DRAFT → PUBLISHED, dicatat `reviewedBy`/`reviewedAt`) sebelum tampil di
  katalog publik — tidak ada konten yang di-bypass dari proses review.

## Fase 3 — Kurikulum lengkap dan katalog Materi

### Ditambahkan

- Katalog penuh sesuai taksonomi Master Prompt §6: 11 CoursePath (Starter,
  A1, A2, B1, B2, C1, Enrichment Band 7.5-9, + 4 jalur khusus Grammar Lab/
  Vocabulary Builder/Pronunciation & Fluency/Modul Strategi Tes) dan 46
  Module (6 skill × 7 level + 4 jalur khusus), dibangkitkan dari
  `scripts/content/generate-catalog-skeleton.ts` lalu diimpor lewat pipeline
  Fase 2 yang sudah ada — tidak ada mekanisme baru, hanya lebih banyak data.
- Model baru: `Bookmark`, `Note` (satu catatan per user per lesson), dan
  `LessonProgress` (NOT_STARTED/IN_PROGRESS/COMPLETED).
- Halaman publik `/materi` (katalog) → `/materi/[coursePathCode]` (modul per
  skill) → `/materi/[coursePathCode]/[moduleCode]` (daftar lesson) →
  `/materi/[...]/[lessonCode]` (lesson sungguhan). Modul/lesson yang belum
  punya konten terbit menampilkan "Segera tersedia" secara jujur, bukan
  disembunyikan atau dipalsukan.
- Lesson page nyata pertama: breadcrumb, badge prasyarat, render konten
  lengkap (`components/content/lesson-view.tsx`, dipakai ulang dari Fase 2),
  mini-quiz interaktif, bookmark, catatan pribadi, tombol tandai selesai,
  navigasi lesson sebelumnya/berikutnya.
- `lib/content/grade-answer.ts`: fungsi penilaian jawaban pure/server-only,
  dipakai oleh server action `checkQuizAnswerAction` — **jawaban benar tidak
  pernah dikirim ke client**, hanya `{correct, explanation}` setelah submit
  (Master Prompt §1 aturan 12 diterapkan sejak lesson quiz, bukan ditunda ke
  Fase 6).
- 5 unit test baru untuk `gradeAnswer` (termasuk test regresi untuk bug
  ORDERING, lihat Catatan) dan 2 E2E spec baru (`materi-catalog.spec.ts`:
  navigasi katalog end-to-end + ambil lesson + quiz + bookmark + note +
  tandai selesai, dengan verifikasi persist setelah reload halaman).

### Catatan

- **Bug ditemukan lewat verifikasi visual manual, bukan oleh test otomatis:**
  soal tipe ORDERING selalu dinilai salah walau jawaban pengguna benar,
  karena `answerKey` menyimpan ID opsi sementara UI free-text mengumpulkan
  teks opsi. 24 E2E test tetap hijau karena tak satupun men-assert kebenaran
  spesifik ORDERING. Diperbaiki + ditambah test regresi — lihat
  `docs/DECISIONS.md` D-022 untuk detail dan pelajarannya.
- Baru 1 lesson (STARTER-GRAM-001) yang benar-benar punya konten; seluruh
  katalog lain adalah skeleton navigasi "Segera tersedia" menunggu Fase 4/18.

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
