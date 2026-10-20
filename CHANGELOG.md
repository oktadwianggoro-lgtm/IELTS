# Changelog

Semua perubahan penting pada Success IELTS dicatat di sini, per fase pengembangan.

## Fase 16 — Infrastruktur langganan (flag + model data, bukan checkout)

### Ditambahkan

- **`PAYMENTS_ENABLED`** (`lib/config/features.ts`) — flag yang sudah ada di
  `.env`/`.env.example` sejak Fase 0, sekarang benar-benar dibaca kode untuk
  pertama kalinya. Default `false`.
- Model baru `Subscription` (+ enum `Plan`: FREE/PREMIUM, `SubscriptionStatus`:
  ACTIVE/CANCELED/EXPIRED) — pengguna tanpa baris dianggap implisit FREE,
  tidak perlu migrasi backfill.
- `lib/subscription/get-plan.ts`'s `getUserPlan()` — lookup paket pengguna
  yang nyata dari DB.
- Kartu "Langganan" di `/profil` menampilkan paket asli pengguna, bukan lagi
  teks statis "akan tersedia Fase 16" yang sudah basi.

### Catatan — lingkup sengaja dipersempit (lihat D-043 untuk detail)

- **Checkout/pembayaran sungguhan TIDAK dibangun** — tidak ada kredensial
  payment gateway (Midtrans) di environment ini; UI pembayaran yang tidak
  bisa benar-benar memproses transaksi akan menyesatkan pengguna.
- **Feature-gating retroaktif TIDAK dibangun** — 15 fase sebelumnya
  membangun semua fitur tanpa asumsi gating; menambahkannya sekarang,
  sementara `PAYMENTS_ENABLED` tetap false, tidak ada manfaat nyata dan
  berisiko mengganggu alur yang sudah teruji.

## Fase 15 — PWA, aksesibilitas, analitik, dan privasi

### Ditambahkan

- **PWA installable** — `app/manifest.ts`, ikon asli dirender saat request
  (`app/icon-192`, `app/icon-512` lewat `next/og`), dan `public/sw.js` yang
  HANYA meng-cache shell publik (landing, Info IELTS, Privasi, login,
  register, offline) plus aset statis content-hashed. Dashboard, semua Lab,
  Tryout, admin, dan `/api/*` sengaja TIDAK di-cache — data itu harus selalu
  live (lihat D-042).
- **Scan aksesibilitas otomatis** — `e2e/accessibility.spec.ts` (axe-core,
  WCAG 2 A/AA) pada halaman publik + dashboard. Menemukan dan memperbaiki dua
  bug nyata: kontras warna `--brand-teal` di bawah ambang AA, dan kalkulator
  band yang comboboxnya tidak punya accessible name.
- **Analitik penggunaan first-party** — `AnalyticsEvent` (model baru): page
  view anonim, tanpa IP/user agent, tanpa script pihak ketiga. Menghormati
  header `DNT` dan toggle `analyticsOptOut` di `/profil`. `/admin/analytics`
  (ADMIN-only) menampilkan agregat asli: total page view, pengunjung unik,
  tren 14 hari, halaman teratas.
- **Halaman Kebijakan Privasi** (`/privasi`, publik) — data apa yang
  dikumpulkan, berapa lama, dan hak pengguna. Fitur substantif: "Hapus Akun"
  di `/profil` menghapus baris `User` secara permanen (ditolak dengan pesan
  jelas jika masih memiliki konten yang dibuat/ditinjau).
- `e2e/pwa-privacy-analytics.spec.ts` — manifest/ikon/service worker/offline
  ter-serve dengan benar, halaman privasi, toggle opt-out analitik, hapus
  akun menghapus baris DB dan sign-out, dashboard admin analitik ADMIN-only.

### Diperbaiki — regresi nyata pada sign-out (lihat D-042 untuk kronologi lengkap)

- Menambahkan page-view tracker ke root layout ternyata memperbesar race
  sign-out yang sudah terdokumentasi (D-036) dari ~10% menjadi ~60-87%.
  Akar masalahnya: Server Action yang mengubah status autentikasi
  (`signOutAction`, dan `deleteAccountAction` yang baru dibuat fase ini)
  POST ke rute halaman saat ini, memicu Next.js me-render-ulang halaman itu
  dengan cookies lama sebagai bagian dari respons yang sama — satu respons
  HTTP berisi dua `Set-Cookie` yang berlawanan. Diperbaiki dengan mengganti
  keduanya jadi Route Handler murni (`app/api/auth-signout`,
  `app/api/account/delete`), dipanggil lewat `fetch()` biasa. Diverifikasi
  empiris: rate gagal turun dari ~60-87% kembali ke ~25-30%, sesuai baseline
  D-036 yang sudah diterima.
- `proxy.ts`'s matcher sekarang juga mengecualikan `manifest.webmanifest`,
  `icon-192`, `icon-512`, dan `sw.js` — aset yang diambil otomatis oleh
  browser di setiap navigasi, sama seperti `favicon.ico`.

## Fase 14 — Info IELTS (halaman publik)

### Ditambahkan

- **Halaman Info IELTS** (`/info-ielts`, publik — tidak perlu login) —
  panduan independen: Academic vs General Training, format & durasi tes,
  cara penilaian (4 kriteria Writing/Speaking + aturan pembulatan overall
  band resmi), kalkulator estimasi overall band interaktif, FAQ (5 item),
  glosarium istilah (8 item), dan tautan ke sumber resmi (ielts.org,
  British Council) dengan tanggal verifikasi.
- **Kalkulator Overall Band** (`components/info-ielts/band-calculator.tsx`)
  — menerapkan rumus pembulatan resmi IELTS ke empat angka band yang
  dimasukkan pengguna sendiri, murni di sisi klien (memakai ulang
  `calculateOverallBand()` dari Fase 11).
- Model baru `OfficialResource` — 5 tautan resmi di-seed dengan URL dan
  tanggal verifikasi nyata (diverifikasi lewat WebSearch, bukan ditebak).
- `app/sitemap.ts` dan `app/robots.ts` — hanya mendaftarkan rute yang
  genuinely publik (`/`, `/info-ielts`, `/login`, `/register`), mengikuti
  instruksi Master Prompt untuk tidak menerbitkan halaman tipis demi SEO.
- `e2e/info-ielts.spec.ts` — akses anonim tanpa redirect ke login, isi
  halaman (disclaimer, FAQ, tautan resmi terverifikasi), kebenaran rumus
  kalkulator, dan `sitemap.xml`/`robots.txt` ter-serve dengan benar.

### Catatan teknis (lihat D-041 untuk detail)

- Next.js 16 mengganti konvensi `middleware.ts` menjadi `proxy.ts`.
  Memindahkan sebuah halaman keluar dari grup route `(app)` (yang
  mewajibkan login lewat layout-nya) TIDAK otomatis membuatnya publik —
  `proxy.ts` punya `PUBLIC_PATHS` sendiri yang harus diupdate terpisah.
  Ditemukan lewat E2E (`/info-ielts` dan `/sitemap.xml` sama-sama
  ter-redirect ke login) sebelum sempat sampai ke production.

## Fase 13 — Panel Admin/Teacher lengkap

### Ditambahkan

- **Test Builder** (`/admin/test-builder`) — menuntaskan apa yang D-038
  sengaja tunda: admin kini membuat `TestBlueprint`/`MockTest` dan
  menyusun `MockTestSection` dari passage Listening/Reading yang sudah
  PUBLISHED lewat UI, bukan hanya lewat `content/tryout/*.json`. Publikasi
  tetap lewat alur editorial yang sama (`/admin/content/[code]`).
- **Audit Log** (`/admin/audit-log`, ADMIN-only) — mencatat setiap
  transisi status konten (semua 6 tipe), perubahan peran pengguna,
  perubahan section mock test, dan penyelesaian laporan soal. Append-only.
- **Manajemen Pengguna** (`/admin/users`, ADMIN-only) — ubah peran
  STUDENT/TEACHER/ADMIN; TEACHER tidak bisa mengakses halaman ini maupun
  audit log (RBAC least-privilege, Master Prompt §11).
- **Laporan Soal Bermasalah** — tombol "Laporkan soal" di Reading Lab dan
  Listening Lab (komponen bersama), antrean penyelesaian di
  `/admin/question-reports` (ADMIN+TEACHER).
- **Antrean Review** (`/admin/review-queue`) — satu daftar lintas-tipe
  konten yang sedang IN_REVIEW, menghilangkan kebutuhan membuka 6 kartu
  terpisah di `/admin/content` untuk tahu apa yang perlu ditinjau.
- **Analitik Mutu Soal** — facility (% benar), rata-rata waktu menjawab,
  dan jumlah laporan terbuka kini tampil langsung di preview soal admin
  (Lesson/Listening/Reading), dihitung dari `QuestionAttempt`/
  `QuestionReport` asli.
- Model baru: `AuditLog`, `QuestionReport` (+ `QuestionReportStatus`).
- `e2e/admin-cms.spec.ts`: alur test builder end-to-end (buat → tambah
  section → publish → muncul di katalog siswa, dengan audit trail
  terverifikasi), laporan soal siswa→admin, RBAC TEACHER diblokir dari
  manajemen pengguna/audit log, dan antrean review lintas-tipe.

### Catatan — lingkup yang sengaja dipersempit (lihat D-040 untuk detail)

- **Manajemen kelas/penugasan guru-siswa TIDAK dibangun** — murni fitur
  institusional/B2B tanpa fondasi data apa pun di 12 fase sebelumnya,
  ditunda utuh (bukan dibangun setengah) sampai ada sinyal kebutuhan
  nyata.
- **Discrimination index TIDAK dihitung** — butuh volume data attempt
  skala produksi untuk bermakna secara statistik; menghitungnya dari data
  uji coba kecil saat ini akan menghasilkan angka yang terlihat presisi
  tapi tidak berarti, bertentangan dengan prinsip "tidak ada estimasi
  palsu" sejak Fase 1. Facility, waktu menjawab, dan report count (yang
  TIDAK butuh volume besar) tetap dibangun penuh.

## Fase 12 — Beranda, progress, gamifikasi, dan notifikasi

### Ditambahkan

- Dashboard (`/dashboard`) sekarang berbasis data pengguna aktual
  sepenuhnya — kartu "Progress" dan "Aktivitas" yang sebelumnya placeholder
  statis sejak Fase 1 kini menampilkan tren akurasi mingguan sungguhan
  (grafik, dengan empty state jujur untuk pengguna baru) dan feed
  aktivitas terakhir nyata (lesson selesai, submission Writing/Speaking,
  tryout) — tidak ada statistik atau aktivitas fiktif.
- `/progress` (sebelumnya "Segera tersedia"): ringkasan Level/XP/streak,
  progress akurasi per skill (8 skill area, "Belum ada data" jujur untuk
  yang belum disentuh), galeri pencapaian lengkap, tren akurasi 12 minggu,
  dan leaderboard opsional.
- XP dan level dihitung LIVE dari aktivitas asli (lesson selesai, jawaban
  benar, submission Writing/Speaking, tryout selesai) — bukan counter
  tersimpan yang bisa desync. Streak belajar dihitung LIVE dari tanggal
  aktivitas asli di lima tabel berbeda, dengan currentStreak/longestStreak
  terpisah. Lihat D-039 untuk alasan "live" dibanding "stored counter".
- 7 pencapaian (badge) dengan kriteria nyata dan teraudit (Langkah
  Pertama, Diagnostic Pertama, Seminggu Beruntun, 100 Soal Terjawab,
  Penulis Pemula, Pembicara Pemula, Tryout Pertama) — diraih otomatis
  lewat `evaluateAndAwardAchievements()`, disimpan permanen begitu diraih.
- Leaderboard opsional dengan opt-in eksplisit dan nama samaran — nama
  asli/email pengguna tidak pernah ditampilkan ke pengguna lain.
- Banner notifikasi in-app di dashboard: soal Buku Kesalahan yang jatuh
  tempo, dan peringatan streak akan putus — keduanya bisa dimatikan
  individual lewat preferensi notifikasi baru di Profil & Langganan.
- Preferensi `reminderEnabled`/`reminderTime` yang sudah dikumpulkan sejak
  onboarding (Fase 1) tapi tidak pernah dipakai, kini benar-benar
  mengirim email pengingat sungguhan (lewat mailer yang sudah ada sejak
  Fase 1/D-014) saat pengguna membuka dashboard — lihat D-039 untuk kenapa
  ini "dipicu kunjungan", bukan terjadwal independen.
- `/profil` kini punya kartu "Notifikasi & Privasi" yang bisa diedit
  (sebelumnya hanya menampilkan field read-only dari onboarding).
- `lib/gamification/` — modul terpisah dan murni/testable:
  `streak.ts`/`xp.ts` (pure functions), `data.ts`/`achievements.ts`/
  `progress.ts`/`dashboard-data.ts`/`reminders.ts` (server-only, query
  data asli).
- Model baru: `Achievement` (katalog, seeded), `UserAchievement` (badge
  yang sudah diraih, permanen). `UserPreference` diperluas dengan
  `leaderboardOptIn`, `leaderboardAlias`, `reviewDueReminderEnabled`,
  `streakRiskReminderEnabled`, `lastReminderSentAt`.
- `e2e/dashboard-gamification.spec.ts`: empty state jujur untuk pengguna
  baru, XP+achievement nyata setelah submission asli, banner review-due
  yang menghormati toggle preferensi, dan leaderboard opt-in yang tidak
  pernah membocorkan email.

### Bug ditemukan & diperbaiki sebelum commit (lihat D-039 untuk detail)

- **D-039:** Draft pertama perhitungan XP menghitung jawaban benar
  Listening/Reading Lab dua kali (sekali lewat hitungan umum, sekali lagi
  lewat hitungan "lab attempts" yang tidak difilter source) — ditemukan
  lewat tinjauan kode sendiri sebelum verifikasi visual, diperbaiki
  sebelum sempat ter-commit.

### Catatan — lingkup yang sengaja dipersempit (lihat D-039 untuk detail)

- Reminder email dipicu saat pengguna membuka dashboard, BUKAN oleh
  background scheduler/cron — tidak ada infrastruktur job-queue di
  aplikasi ini. Pengguna yang tidak pernah membuka dashboard tidak akan
  menerima pengingat apa pun.
- `getLeaderboard()` menghitung XP per peserta dengan query terpisah
  (N+1) — dapat diterima untuk skala pengguna saat ini.

## Fase 11 — Tryout, mode ujian, estimasi band

### Ditambahkan

- `/tryout` (katalog mock test) dan `/tryout/[mockTestCode]` (attempt
  runner mode ujian): timer berkelanjutan, navigator soal lintas section,
  flag/review, autosave per jawaban, resume setelah reload/koneksi
  terputus, dan auto-submit server-side saat waktu habis.
- Model baru: `BandConversionTable` (tabel konversi raw score → band,
  selalu dibaca dari DB — tidak pernah di-hardcode sebagai konstanta),
  `TestBlueprint`/`MockTest`/`MockTestSection` (struktur tryout, section
  mereferensikan passage Listening/Reading yang sudah ada), `Attempt`/
  `AttemptAnswer`/`AttemptEvent` (satu attempt per percobaan pengguna,
  `deadlineAt` dihitung sekali di server sebagai satu-satunya sumber
  kebenaran untuk auto-submit).
- `lib/scoring/overall-band.ts` — `calculateOverallBand()`, implementasi
  teruji penuh dari aturan pembulatan resmi ielts.org (rata-rata 4 skill,
  .25 dibulatkan naik ke half band, .75 dibulatkan naik ke whole band).
- `lib/scoring/raw-to-band.ts` — `rawToBand()`, membaca baris aktif dari
  `BandConversionTable`; mengembalikan `null` (bukan tebakan) jika raw
  score di luar cakupan tabel yang terverifikasi.
- `docs/SCORING.md` — definisi, rumus, sumber (dikutip dan diverifikasi
  dari ielts.org dan ielts.idp.com), asumsi, keterbatasan, dan test case
  untuk setiap fungsi scoring.
- 3 mock test di-seed lewat `content/tryout/*.json` (pipeline import yang
  sama seperti tipe konten lain), semuanya reuse passage Listening/Reading
  yang sudah ada dari Fase 7/8 — tidak ada passage baru: Listening Mini
  Mock (2 section), Academic Reading Section Test, General Training
  Reading Section Test.
- Hasil Tryout menampilkan raw score, estimasi band (dengan sumber dan
  tanggal verifikasi), akurasi per tipe soal, waktu dipakai, dan topik
  lemah; soal yang salah otomatis masuk Buku Kesalahan (`AttemptSource.TRYOUT`,
  memakai `recordQuestionAttempt()` yang sama dengan Listening/Reading Lab).
- `/admin/content` diperluas dengan kartu "Mock Tests (Tryout)" dan alur
  editorial DRAFT→PUBLISHED yang sama dengan tipe konten lain.
- `e2e/tryout.spec.ts`: katalog, jawaban+flag bertahan setelah reload
  dengan timer yang benar-benar melanjutkan (bukan reset), submit
  menampilkan skor dan mengisi Buku Kesalahan, auto-submit server-side
  (deadline dipaksa ke masa lalu langsung di DB, lalu dibuktikan reload
  memicu finalisasi tanpa timer client pernah menyentuh nol), dan "Coba
  Lagi" memulai attempt baru.

### Catatan — lingkup yang sengaja dipersempit (lihat D-038 untuk detail)

- Setiap mock test hanya satu skill (Listening ATAU Reading) — tidak ada
  "Full Mock Test" 4-skill gabungan dalam satu attempt bertimer tunggal.
  Writing Lab dan Speaking Lab (Fase 9/10) sudah menyediakan latihan
  bertimer per-task untuk kedua skill itu secara independen.
- Tabel konversi band Listening/Reading adalah estimasi yang di-cross-
  reference dari IDP (salah satu dari tiga organisasi pemilik IELTS),
  bukan tabel resmi tunggal — IELTS sendiri tidak mempublikasikan satu
  tabel presisi universal (variasi antar versi tes adalah by design).
  Raw score rendah yang tidak tercakup tabel menampilkan raw score saja,
  bukan tebakan band.
- Tidak ada review jawaban per-soal (explanation/evidence) di hasil
  Tryout — meniru bagaimana skor IELTS asli bekerja (dapat skor, bukan
  kunci jawaban). Pengguna yang ingin penjelasan per soal memakai
  Listening/Reading Lab.
- UI admin untuk membuat blueprint/mock test baru dari nol ("test
  builder") belum ada — konten di-seed lewat `content/tryout/*.json`
  seperti tipe konten lain; Master Prompt sendiri menugaskan test builder
  admin ke Fase 13.

## Fase 10 — Speaking Lab

### Ditambahkan

- `/speaking-lab` (katalog per Part 1/2/3) dan `/speaking-lab/[promptCode]`
  (workspace dengan alur rekam opt-in: izin mikrofon → timer persiapan →
  timer bicara → tinjau rekaman → kirim, dengan fallback tulis jawaban
  manual jika mikrofon ditolak/tidak tersedia atau dilewati).
- Model baru: `SpeakingPrompt` (part, cue card points untuk Part 2,
  follow-up questions untuk Part 1/3, model answer orisinal, checklist
  self-assessment, alur editorial yang sama dengan tipe konten lain),
  `SpeakingRecording` (file audio di disk server-only, bukan di DB sebagai
  blob dan bukan di `public/`), `SpeakingSubmission` (status
  IN_PROGRESS/COMPLETED, fallback text, self-assessment).
- Route terproteksi `app/api/speaking-recordings/[id]` — satu-satunya
  cara membaca bytes rekaman, memverifikasi kepemilikan sebelum
  mengembalikan file (Master Prompt §8.8 "Lindungi file rekaman").
- Kontrol penghapusan rekaman ("Hapus Rekaman") yang menghapus file dari
  disk DAN baris DB-nya secara permanen, terpisah dari status submission
  (menghapus rekaman tidak menghapus self-assessment/completion).
- 3 speaking prompt orisinal dengan model answer dan checklist
  self-assessment orisinal (4 kriteria IELTS Speaking: fluency/coherence,
  lexical resource, grammatical range/accuracy, pronunciation): "Hometown
  and Daily Routine" (Part 1), "Describe a Skill You Would Like to Learn"
  (Part 2, cue card), "Learning New Skills in Modern Society" (Part 3,
  diskusi lanjutan dari topik Part 2).
- `content/speaking/*.json` + skema Zod baru (`speakingPromptFileSchema`),
  termasuk validasi silang: `cueCardPoints` wajib ada HANYA untuk PART2,
  `followUpQuestions` minimal 2 untuk PART1/PART3.
- `/admin/content` diperluas dengan kartu "Speaking Prompts" dan alur
  editorial yang sama dengan tipe konten lain.
- `e2e/speaking-lab.spec.ts` — menguji pipeline rekaman SUNGGUHAN lewat
  Chromium `--use-fake-device-for-media-stream` (bukan mock): rekam →
  upload → putar ulang lewat route terproteksi → self-assessment persist
  → hapus rekaman → attempt baru lewat "Coba Lagi"; plus jalur fallback
  tulisan tanpa mikrofon sama sekali.

### Bug ditemukan & diperbaiki (lihat D-037 untuk detail)

- **D-037:** Setelah menyelesaikan attempt lewat jalur jawaban tertulis
  (tanpa rekaman), tampilan "selesai" tidak pernah menampilkan balik
  jawaban yang baru dikirim — state lokal `submission.fallbackText` tidak
  ikut di-update bersama status `COMPLETED`. Ditemukan oleh E2E (jalur
  fallback-text), bukan verifikasi visual manual yang hanya menguji jalur
  rekaman. Diperbaiki dengan menyertakan `fallbackText` saat meng-update
  state `submission` pasca-complete.

### Catatan — lingkup yang sengaja dipersempit

- Satu rekaman per submission (bukan per pertanyaan individual dalam satu
  part) — Part 1/3 menampilkan semua follow-up question sekaligus dan
  direkam dalam satu sesi berkelanjutan, bukan rekaman terpisah per
  pertanyaan. Lihat D-037.
- File rekaman disimpan di disk lokal server, bukan object storage —
  belum ada kredensial object storage di proyek ini pada fase manapun;
  modul penyimpanan sengaja diisolasi (`lib/speaking/storage.ts`) supaya
  migrasi ke object storage sungguhan di Fase 17 tidak menyentuh server
  action atau UI. Lihat D-037.
- Tidak ada transkripsi speech-to-text maupun skor/feedback otomatis dari
  AI — bukan fallback sementara, melainkan satu-satunya mode yang
  dibangun di fase ini (belum ada kredensial provider AI). Self-assessment
  checklist dan model answer tertulis orisinal adalah pengganti jujur.
  Lihat D-037.
- Hanya 1 prompt per part (Part 1/2/3); perluasan konten lebih lanjut
  adalah pekerjaan berkelanjutan Fase 18.

## Fase 9 — Writing Lab

### Ditambahkan

- `/writing-lab` (katalog per Task 1 Academic/Task 1 General Training/Task 2) dan `/writing-lab/[taskCode]` (workspace outline + jawaban, timer
  pengingat, autosave ter-debounce, hint batas kata minimum) dengan
  self-assessment checklist dan contoh jawaban yang hanya terbuka setelah
  submit.
- Model baru: `WritingTask` (prompt, `visualData` tabel untuk Task 1
  Academic, `minWords`, `suggestedMinutes`, `sampleAnswer`,
  `checklistItems`, alur editorial DRAFT→PUBLISHED yang sama dengan
  konten lain) dan `WritingSubmission` (outline, body, wordCount,
  `draftHistory` JSON, status DRAFT/SUBMITTED, `selfAssessment`).
- 3 writing task orisinal dengan contoh jawaban dan checklist
  self-assessment orisinal (bukan rubrik IELTS resmi yang disalin):
  "Internet Access in Four Countries" (Task 1 Academic, tabel data),
  "Complaint Letter About a Late and Damaged Delivery" (Task 1 GT), dan
  "Remote Work: Permanent Home-Working vs. Full-Time Office Return"
  (Task 2).
- `content/writing/*.json` + skema Zod baru (`writingTaskFileSchema`),
  termasuk validasi silang: `visualData` wajib ada JIKA DAN HANYA JIKA
  `taskType` adalah `TASK1_ACADEMIC`.
- `lib/content/word-count.ts` — util hitung kata bersama, dipakai Writing
  Lab dan Reading Lab (menggantikan definisi duplikat Reading Lab sendiri).
- `/admin/content` diperluas dengan kartu "Writing Tasks" dan alur
  editorial yang sama dengan tipe konten lain (tanpa cascade ke
  `Question.reviewStatus` — `WritingTask` tidak punya baris Question
  bersarang, ini soal esai bebas yang tidak digradasi otomatis).
- `e2e/writing-lab.spec.ts`: katalog, alur submit lengkap dengan verifikasi
  contoh jawaban tidak pernah bocor sebelum submit, hint batas kata
  minimum tidak memblokir submit, persistensi self-assessment setelah
  reload, dan "Tulis Lagi" memulai attempt baru.

### Bug ditemukan & diperbaiki (lihat D-035, D-036 untuk detail)

- **D-035:** `submitWritingAction` membaca body jawaban dari DB (hasil
  autosave ter-debounce 1500ms) bukan dari client — klik Submit dalam
  waktu <1500ms setelah mengetik membuat submit ditolak secara silent
  ("Tulisan masih kosong"). Diperbaiki: aksi menerima outline/body
  langsung dari client dan menyimpannya dalam satu update bersama transisi
  status; error submit sekarang ditampilkan ke pengguna, tidak dibuang diam-diam.
- **D-036:** Sign-out (`signOutAction`) memakai soft client-router redirect,
  yang tidak membatalkan prefetch sidebar yang sedang in-flight — response
  prefetch itu (membawa Set-Cookie refresh session Auth.js v5 untuk
  strategi jwt) kadang mendarat SETELAH Set-Cookie penghapus sign-out,
  menghidupkan kembali session yang baru saja di-logout. Ini TERNYATA bug
  produk nyata di balik flake `auth.spec.ts` "full happy path" yang
  sebelumnya (D-032) salah disimpulkan sebagai karakteristik lingkungan
  test lokal. Diperbaiki: sign-out sekarang hard-navigate
  (`window.location.href`), bukan push — mengurangi tingkat kegagalan dari
  ~60-70% menjadi ~10% pada pengujian stres 10× berturut-turut (risiko
  residual diterima, didokumentasikan di D-036, penghilangan total butuh
  revocation list yang masuk cakupan Fase 17).

### Catatan — lingkup yang sengaja dipersempit

- Belum ada feedback AI otomatis atas esai (band score, saran perbaikan
  per kalimat) — butuh kredensial API eksternal yang belum disediakan
  pengguna. Checklist self-assessment dan contoh jawaban adalah
  pengganti jujur untuk fase ini, bukan simulasi feedback AI yang dipalsukan.
- Self-assessment adalah refleksi mandiri pengguna (checkbox), bukan
  penilaian otomatis atau skor resmi IELTS — ditampilkan jelas di UI.
- Hanya 1 task per kategori (Task 1 AC, Task 1 GT, Task 2); perluasan
  konten lebih lanjut adalah pekerjaan berkelanjutan Fase 18.

## Fase 8 — Reading Lab

### Ditambahkan

- `/reading-lab` (katalog per Academic/General Training) dan
  `/reading-lab/[passageCode]` (workspace split-view: passage + soal)
  dengan navigator soal, flag/review per soal, highlight per-paragraf,
  hint batas kata live, timer 20 menit, autosave lewat `localStorage`, dan
  ulasan pasca-tes berbasis bukti (evidence) dari passage untuk setiap soal.
- Model baru: `ReadingPassage` (`paragraphs` terstruktur per paragraf
  berlabel), `Question.readingPassageId`. Dua field baru di `Question`
  yang berlaku lintas semua tipe konten: `evidence` dan `wordLimit`
  (nullable, tidak memengaruhi konten Lesson/Listening yang sudah ada).
- 2 reading passage orisinal: "The Rise of Urban Beekeeping" (Academic, 9
  soal, campuran True/False/Not Given, matching paragraf, multiple choice,
  gap-fill, short answer) dan "Greenfield Office — Recycling and Waste
  Policy" (General Training, 7 soal, gaya notis kantor sehari-hari).
- `content/reading/*.json` + skema Zod baru (`readingPassageFileSchema`),
  termasuk validasi silang baru: opsi `MATCHING` berhuruf tunggal (mis.
  "C") harus cocok dengan label paragraf yang benar-benar ada di passage.
- Tipe soal Reading dari Master Prompt §8.6 (matching headings/information/
  features/sentence endings) semuanya dipetakan ke tipe `MATCHING` yang
  sudah ada (opsi = label paragraf) — tidak ada `QuestionType` enum baru.
- `/admin/content` dan CMS review-nya diperluas lagi untuk Reading Passage
  lewat alur editorial yang sama persis dengan Lesson dan Listening Passage.
- Tidak ada renderer/grader soal baru — `gradeAnswer()` dan `QuestionInput`
  dari fase-fase sebelumnya langsung dipakai ulang.
- `e2e/reading-lab.spec.ts`: katalog, alur lengkap dengan verifikasi bahwa
  evidence tidak pernah ada di HTML sebelum diperiksa, hint batas kata
  live, flag/review, dan integrasi dengan Buku Kesalahan.

### Catatan — penyederhanaan yang sengaja dipilih (lihat D-033)

- Highlight menandai PARAGRAF utuh saat diklik, bukan rentang teks bebas
  (butuh serialisasi Range API yang tidak sepadan untuk fase ini).
- Timer 20 menit murni tampilan/pengingat, tidak memaksa auto-submit —
  auto-submit yang benar masuk ke sistem tryout/blueprint Fase 11.
- Autosave memakai `localStorage` per passage, bukan model attempt baru di
  database — jawaban tidak hilang saat reload tidak sengaja, tapi tidak
  sinkron lintas perangkat.
- Belum ada tipe soal "plan/map/diagram labelling" — butuh UI berbasis
  gambar/koordinat yang di luar cakupan fase ini.
- Hanya 1 passage Academic dan 1 passage General Training; perluasan
  konten lebih lanjut adalah pekerjaan berkelanjutan Fase 18.

## Fase 7 — Listening Lab

### Ditambahkan

- `/listening-lab` (katalog per Section 1-4, jujur menampilkan "Segera
  tersedia" untuk section yang belum berisi konten) dan
  `/listening-lab/[passageCode]` (pemutar audio + soal), dengan toggle
  mode latihan (replay bebas, transkrip terbuka setelah menjawab) dan mode
  ujian (satu kali putar, transkrip tidak pernah dikirim server sama
  sekali, bukan cuma disembunyikan di client).
- Model baru: `ListeningPassage` (audio + naskah terstruktur per giliran
  bicara), `Question.listeningPassageId` (FK opsional).
- 2 listening passage orisinal dengan audio sungguhan: "Joining Riverside
  Library" (Section 1, form completion) dan "Planning a Renewable Energy
  Presentation" (Section 3, diskusi akademik) — naskah ditulis sendiri,
  audio disintesis lewat Windows SAPI text-to-speech (lihat D-030 untuk
  alasan lengkap memilih TTS atas merekam/melisensikan audio pihak
  ketiga, dan trade-off yang diterima).
- `content/listening/*.json` + skema Zod baru (`listeningPassageFileSchema`)
  dan `scripts/content/generate-listening-audio.ps1` (skrip authoring
  satu-kali, bukan bagian runtime).
- `/admin/content` dan CMS review-nya diperluas untuk Listening Passage
  lewat alur editorial yang sama persis dengan Lesson, termasuk cascade
  status ke soal miliknya saat publish/archive (mengikuti pola D-024 agar
  tidak mengulang bug yang sama untuk tipe konten baru).
- Tidak ada renderer/grader soal baru — `gradeAnswer()` (Fase 3) dan
  `QuestionInput` (Fase 5) langsung dipakai ulang untuk seluruh tipe soal
  Listening yang didukung.
- `e2e/listening-lab.spec.ts`: katalog, alur latihan penuh dengan
  verifikasi bahwa transkrip tidak pernah ada di HTML sebelum diperiksa,
  mode ujian (satu kali putar + transkrip tidak pernah bocor), dan
  integrasi dengan Buku Kesalahan.

### Catatan — cakupan yang sengaja belum dibangun

- Tipe soal "plan/map/diagram labelling" dari Master Prompt §8.5 belum
  diimplementasikan — butuh UI berbasis gambar/koordinat yang di luar
  cakupan phase ini; soal Listening saat ini memakai tipe yang sudah ada
  (multiple choice, matching, gap-fill, short answer).
- Hanya Section 1 dan Section 3 yang punya konten; Section 2 dan 4
  ditampilkan jujur sebagai "Segera tersedia", bukan disembunyikan.
- Audio berformat WAV mentah (bukan MP3/Opus terkompresi) karena tidak ada
  `ffmpeg`/encoder di environment ini — perlu ditranskode saat Fase 17
  menambah pipeline build, atau saat jumlah passage bertambah signifikan.

### Bug ditemukan dan diperbaiki (lewat investigasi test E2E yang gagal tidak konsisten)

- Menilai kartu review TERAKHIR di Buku Kesalahan (Fase 6) mengganti
  seluruh sesi review dengan pesan "Tidak ada review yang jatuh tempo"
  generik, menghapus layar "Review selesai" yang seharusnya dilihat
  pengguna. Penyebab: `rateMistakeReviewAction` memanggil
  `revalidatePath("/buku-kesalahan")` di setiap kartu supaya counter
  header live-update, tapi itu memicu Next.js me-refresh ulang seluruh
  halaman — begitu due-count server menjadi 0 pada kartu terakhir, React
  meng-unmount komponen session dan state "selesai"-nya hilang. Diperbaiki
  dengan menghapus `revalidatePath` tersebut (counter header jadi tidak
  live-update selama sesi, trade-off yang jauh lebih baik daripada
  merusak layar penyelesaian). Detail lengkap: `docs/DECISIONS.md` D-032.

## Fase 6 — Practice engine adaptif dan Buku Kesalahan

### Ditambahkan

- `/latihan-harian`: set latihan adaptif 15 soal per sesi, dengan komposisi
  default 50% area kelemahan (dari diagnostic test terakhir) / 30% materi
  yang baru dipelajari / 20% review Buku Kesalahan yang jatuh tempo
  (`lib/practice/generate-set.ts`, pure function, 7 unit test). Setiap soal
  ditampilkan satu per satu dengan feedback langsung dan waktu menjawab
  dicatat per soal (bukan isi-semua-baru-submit seperti mini-quiz lesson).
- `/buku-kesalahan`: soal yang pernah dijawab salah otomatis tersimpan dan
  dijadwalkan ulang lewat spaced repetition **SM-2** (`lib/srs/sm2.ts`,
  pure function, 7 unit test, lihat D-026 untuk alasan memilih SM-2 atas
  FSRS). Kartu review menampilkan prompt, jawaban yang diharapkan, alasan
  kesalahan (tag `ErrorReason`: tidak tahu kosakata, salah memahami
  instruksi, kehilangan detail, grammar, salah strategi, terburu-buru, atau
  salah ketik), dan tautan ke lesson terkait. Halaman juga menampilkan
  ringkasan "kesalahan berulang" per skill.
- Model baru: `QuestionAttempt` (log setiap jawaban di kedua fitur,
  termasuk waktu menjawab), `MistakeBookEntry` (state SM-2 per
  user+question), enum `AttemptSource` dan `ErrorReason`.
- Tidak ada renderer/grader soal baru — kedua fitur menyambungkan ulang
  `gradeAnswer()` (Fase 3) dan `QuestionInput` (Fase 5) yang sudah
  menangani seluruh 10 tipe soal, sesuai desain aslinya.
- `e2e/practice-mistake-book.spec.ts`: alur latihan penuh (grading, logging
  waktu, soal salah masuk Buku Kesalahan), serta regression test yang
  me-review seluruh antrean lewat UI dan memverifikasi lewat database
  langsung bahwa tidak ada kartu yang terlewat.

### Bug ditemukan dan diperbaiki (lewat verifikasi visual manual)

- Antrean review Buku Kesalahan melewati satu kartu di setiap putaran:
  daftar kartu dibaca langsung dari prop server component yang menyusut
  setelah tiap `revalidatePath`, sementara index lokal terus bertambah 1
  tanpa menyadari array-nya sudah lebih pendek. Ditemukan lewat screenshot
  manual (counter turun wajar, tapi query database menunjukkan satu entri
  tetap `reviewCount: 0`). Diperbaiki dengan men-snapshot antrean ke state
  lokal sekali di awal sesi. Detail lengkap: `docs/DECISIONS.md` D-028.
- Dua lint error dari React Compiler (`react-hooks/purity`,
  `react-hooks/set-state-in-effect`) tertangkap sebelum build — pola timer
  per-kartu awalnya memanggil `Date.now()` saat render dan me-reset state
  lewat effect; keduanya diperbaiki dengan pola child-component yang
  di-key ulang per kartu (lihat D-027).

## Fase 5 — Diagnostic test dan rencana belajar personal

### Ditambahkan

- Alur diagnostic test lengkap: `/mulai-dari-sini` (ringkasan 3 langkah) →
  `/mulai-dari-sini/diagnostic/[resultId]` (soal, disampling lintas skill
  dan level dari bank soal PUBLISHED) → `.../hasil` (estimasi level,
  confidence, dan breakdown per skill) → `/rencana-belajar` (rencana
  belajar harian yang bisa ditandai selesai).
- Model baru: `DiagnosticResult`, `DiagnosticAnswer`, `SkillEstimate`,
  `StudyPlan`, `StudyPlanItem`.
- `lib/diagnostic/estimate.ts` dan `lib/study-plan/generate.ts`: dua pure
  function (bukan terikat DB/request) untuk estimasi level dari jawaban dan
  penyusunan rencana belajar dari kelemahan skill + prasyarat lesson +
  budget menit belajar harian, masing-masing dengan unit test lengkap (8
  dan 10 skenario).
- `/dashboard` kini menampilkan rencana belajar hari ini yang sungguhan
  (bukan empty-state statis), dan salinan dashboard yang dulu menyebut
  fitur ini "belum dibangun" sudah diperbarui (lihat D-025).
- `e2e/diagnostic-study-plan.spec.ts`: alur penuh (mengerjakan diagnostic →
  melihat hasil → membuat rencana → menandai item selesai → memastikan
  tersambung ke dashboard), resume diagnostic yang `IN_PROGRESS`, dan
  redirect otomatis ke hasil untuk diagnostic yang sudah `COMPLETED`.

### Bug ditemukan dan diperbaiki (lewat verifikasi visual manual, bukan dari test yang sudah hijau)

- `Question.reviewStatus` tidak pernah ikut ter-cascade saat
  `Lesson.reviewStatus` berubah ke PUBLISHED/ARCHIVED sejak Fase 2 — soal di
  halaman lesson "terlihat jalan" karena ditampilkan tanpa filter status,
  tapi secara teknis tidak ada satu pun `Question` yang benar-benar
  PUBLISHED. Baru ketahuan saat diagnostic test (yang benar memfilter
  PUBLISHED) menampilkan 0 soal. Diperbaiki di level cascade (CMS),
  query lesson page, dan data existing (skrip migrasi retroaktif). Detail
  lengkap: `docs/DECISIONS.md` D-024.
- Dua tempat terpisah mengecek "semua soal terjawab" lewat perbandingan
  jumlah (`=== `/`.every()`) tanpa guard eksplisit untuk kasus nol soal,
  membuat tombol submit aktif pada 0/0. Diperbaiki di `DiagnosticQuizForm`
  dan proaktif di `LessonQuiz` begitu pola bug ini dikenali.

### Catatan — cakupan bank soal untuk diagnostic test

- Diagnostic test saat ini hanya bisa mengambil soal dari bank yang sudah
  PUBLISHED (35 soal, Fase 4). Estimasi level jadi makin akurat seiring
  bank soal bertambah di fase konten berikutnya (Fase 6+ dan Fase 18) — ini
  dinyatakan jujur di UI hasil ("estimasi awal", bukan skor final).

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
