# Keputusan & Alternatif — Success IELTS

Dokumen ini mencatat keputusan teknis yang dibuat karena Master Prompt memberi
default yang wajar untuk dipilih, bukan satu jawaban tunggal. Format: **Keputusan**,
**Alasan**, **Alternatif yang dipertimbangkan**, **Kapan ditinjau ulang**.

## Fase 0

### D-001: Scaffold dari `create-next-app` + `shadcn` CLI, bukan ditulis manual

- **Keputusan:** Pakai `npx create-next-app@latest` (App Router, TypeScript,
  Tailwind v4, ESLint) lalu `npx shadcn@latest init -d` untuk primitif UI.
- **Alasan:** Konfigurasi Next.js/Tailwind/ESLint yang benar berubah antar versi;
  men-generate dari CLI resmi lebih kecil risikonya daripada menulis manual dan
  salah kompatibilitas versi.
- **Alternatif:** Menulis `next.config.ts`, `tsconfig.json`, dsb. dari nol — ditolak
  karena rawan tidak sinkron dengan versi Next.js 16 yang terpasang.
- **Tinjau ulang:** Tidak perlu, kecuali upgrade major Next.js di masa depan.

### D-002: Nama paket `success-ielts-app`, bukan nama folder `IELTS`

- **Keputusan:** `package.json#name` = `success-ielts-app`.
- **Alasan:** npm menolak nama paket yang mengandung huruf kapital; folder project
  bernama `IELTS` (huruf kapital, dari permintaan environment) tidak valid sebagai
  nama paket.
- **Alternatif:** Mengubah nama folder — ditolak karena folder kerja ditentukan
  environment, bukan sesuatu yang aman diubah tanpa izin pengguna.
- **Tinjau ulang:** Tidak perlu; ini hanya metadata internal `package.json`.

### D-003: i18n sederhana berbasis cookie + dictionary statis, bukan `next-intl`

- **Keputusan:** `lib/i18n/dictionary.ts` (dictionary id/en manual) + cookie
  `locale` + `LocaleProvider` client context.
- **Alasan:** Pada Fase 0, teks yang perlu diterjemahkan masih sangat sedikit
  (chrome aplikasi, landing, dashboard shell). Memasang `next-intl` penuh dengan
  routing `/id`/`/en` adalah over-engineering untuk cakupan ini.
- **Alternatif:** `next-intl` dengan locale-prefixed routing — disimpan sebagai opsi
  upgrade jika volume konten bilingual membesar signifikan pada Fase 3–4 (lihat
  `docs/ARCHITECTURE.md` §6 untuk keterbatasan yang diketahui).
- **Tinjau ulang:** Fase 3 (saat katalog Materi penuh dibangun) atau jika terjemahan
  per-halaman menjadi berat dikelola manual.

### D-004: `@hookform/resolvers` belum dipasang

- **Keputusan:** Install `react-hook-form` dan `zod`, tapi **tidak** memasang
  `@hookform/resolvers` di Fase 0.
- **Alasan:** `@hookform/resolvers@6.x` (versi terbaru saat ini) mewajibkan
  `effect@^4`, bertabrakan dengan `effect@3.x` yang ditarik transitif oleh paket
  `shadcn` CLI → `npm install` gagal total (ERESOLVE). Fase 0 belum punya form yang
  butuh integrasi zod+react-hook-form, jadi tidak memblokir apa pun untuk dilewati
  dulu.
- **Alternatif:** `--legacy-peer-deps` — ditolak karena bisa menyembunyikan konflik
  nyata dan membuat resolusi dependency tidak terdokumentasi.
- **Tinjau ulang:** Fase 1 (onboarding form) — cek ulang versi `@hookform/resolvers`
  yang kompatibel, atau integrasikan zod validation manual tanpa resolver jika
  konflik masih ada.

### D-005: `@vitejs/plugin-react` dipin ke `^4.3.4`, bukan `^6` terbaru

- **Keputusan:** Pin versi di `package.json`.
- **Alasan:** `@vitejs/plugin-react@6.x` punya peer opsional ke `@babel/core@^8`
  (rilis rc), bertabrakan dengan `@babel/core@7.x` yang ditarik oleh
  `@shadcn/registry`. Versi `^4.3.4` stabil dan cukup untuk transform Vitest.
- **Alternatif:** Downgrade Babel 8 secara paksa — ditolak, berisiko merusak
  tooling shadcn.
- **Tinjau ulang:** Saat Babel 8 stabil dan `shadcn` CLI mengikuti, atau saat
  `@vitejs/plugin-react@6` tidak lagi mewajibkan Babel 8.

### D-006: `@types/node` dinaikkan ke `^24`, bukan tetap `^20`

- **Keputusan:** Upgrade `@types/node` dari default create-next-app (`^20`) ke
  `^24`.
- **Alasan:** `vitest@5.x` (versi stabil terbaru) mewajibkan `@types/node@^22` atau
  lebih baru sebagai peer dependency. Node yang terpasang di mesin pengembangan ini
  memang v24, sehingga `^24` juga lebih akurat merepresentasikan runtime sebenarnya.
- **Alternatif:** Downgrade `vitest` ke versi lama yang menerima `@types/node@^20`
  — ditolak karena lebih baik memakai Vitest versi stabil terbaru.
- **Tinjau ulang:** Tidak perlu kecuali deployment target memakai Node versi lebih
  lama dari 22 (perlu disinkronkan dengan `docs/DEPLOY.md` pada Fase 17).

### D-007: Variabel `NODE_OPTIONS=--use-system-ca` diperlukan di lingkungan ini

- **Keputusan:** Dokumentasikan (bukan di-hardcode di kode) bahwa menjalankan
  `npm`/`npx` di mesin pengembangan ini butuh `NODE_OPTIONS=--use-system-ca` karena
  TLS inspection korporat.
- **Alasan:** Tanpa ini, semua `npm install`/`npx` gagal dengan
  `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`. Windows (PowerShell/`Invoke-WebRequest`)
  berhasil karena memakai trust store OS; Node.js memakai bundel CA sendiri secara
  default.
- **Alternatif:** `npm config set strict-ssl false` atau menambahkan cert korporat
  manual ke `cafile` — ditolak karena melemahkan verifikasi TLS secara permanen atau
  butuh ekstraksi sertifikat manual yang rapuh terhadap perubahan proxy korporat.
  `--use-system-ca` tetap memverifikasi rantai sertifikat, hanya memakai sumber
  trust store yang berbeda.
- **Tinjau ulang:** Tidak relevan untuk deployment VPS (Fase 17), yang biasanya
  tidak di balik TLS-inspecting proxy; hanya relevan untuk pengembangan lokal di
  jaringan ini.

### D-008: `cacheComponents`/`partialPrefetching` dimatikan (default `create-next-app` baru)

- **Keputusan:** Hapus `cacheComponents: true` dan `partialPrefetching: true` dari
  `next.config.ts` (default yang di-generate `create-next-app` untuk Next.js 16).
- **Alasan:** Dengan `cacheComponents` aktif, setiap akses API dinamis (`cookies()`,
  `headers()`, dll.) di luar `<Suspense>` atau `"use cache"` membuat `next build`
  gagal ("uncached or runtime data during prerendering"). Root layout kita memanggil
  `cookies()` untuk locale, dan nyaris seluruh aplikasi (dashboard personal, auth,
  data pengguna di fase mendatang) akan secara inheren dinamis per-request. Memaksa
  setiap halaman mengikuti disiplin cache/Suspense di Fase 0 — sebelum database/auth
  ada — menambah kompleksitas tanpa manfaat nyata saat ini.
- **Alternatif:** Membungkus `getServerLocale()`/konsumennya dengan `<Suspense>` di
  setiap route — ditolak untuk saat ini karena menambah boilerplate di semua
  halaman stub yang kontennya belum ada.
- **Tinjau ulang:** Fase 14 (halaman publik/SEO) atau Fase 17 (hardening performa) —
  saat itu nilai statis/caching untuk halaman non-personal (landing, Info IELTS)
  sudah jelas dan bisa diaktifkan ulang secara selektif per-route.

## Fase 1

### D-010: Prisma CLI/Client dipin ke `7.10.1` (stabil), bukan `8.0.0-rc` (dist-tag `latest`)

- **Keputusan:** `npm install prisma @prisma/client` pada npm registry saat ini memberi
  `prisma@latest` = `8.0.0-rc.23` (masih release candidate, belum GA) tetapi
  `@prisma/client@latest` = `7.10.1` (stabil) — keduanya tidak match. Prisma 8
  juga mengganti CLI sepenuhnya menjadi "Prisma Developer Platform" berbasis
  Projects/Branches/`prisma deploy` ke cloud Prisma sendiri, yang tidak cocok
  dengan target deployment VPS self-hosted (Fase 17). Kedua paket dipin ke
  `7.10.1` (stabil, matched, CLI klasik `init/generate/migrate/db/studio`).
- **Alasan:** Menghindari CLI yang belum GA dan terikat ke platform cloud pihak
  ketiga, serta menghindari mismatch versi CLI vs Client runtime.
- **Alternatif:** Memakai Prisma 8 RC dan workflow `prisma deploy` ke Prisma
  Cloud — ditolak karena mengubah model deployment aplikasi secara signifikan
  tanpa itu diminta, dan RC belum cocok untuk fondasi produksi.
- **Tinjau ulang:** Saat Prisma 8 mencapai GA dan masih mendukung alur
  self-hosted murni (CLI klasik `migrate`/`db` tanpa akun cloud wajib).

### D-011: Prisma 7 mewajibkan driver adapter (`@prisma/adapter-pg`), `url` dipindah ke `prisma7.config.ts`

- **Keputusan:** `prisma/schema.prisma` datasource hanya berisi
  `provider = "postgresql"` (tanpa `url`). Connection string hidup di
  `prisma7.config.ts` (dibaca CLI untuk migrate/studio) DAN di `lib/db.ts`
  lewat `new PrismaPg({ connectionString: process.env.DATABASE_URL })` yang
  diberikan ke `new PrismaClient({ adapter })`.
- **Alasan:** Ini bukan pilihan kami — Prisma 7 CLI menolak schema dengan
  `datasource.url` (`P1012`), dan `PrismaClient` runtime menolak diinstansiasi
  tanpa `adapter` sama sekali ("A driver adapter is required to connect to
  your database"), berlaku untuk generator klasik maupun generator baru.
- **Tinjau ulang:** Tidak perlu — ini perilaku wajib Prisma 7, bukan pilihan
  yang bisa dibalik tanpa downgrade major version.

### D-012: Generator `prisma-client-js` (klasik) dipakai, bukan `prisma-client` (default baru Prisma 7)

- **Keputusan:** `generator client { provider = "prisma-client-js" }` tanpa
  `output` custom (generate ke lokasi default `node_modules/@prisma/client`).
- **Alasan:** `@auth/prisma-adapter@2.11.3` (adapter Auth.js resmi untuk
  Prisma) meng-import tipe `PrismaClient` langsung dari paket `"@prisma/client"`
  secara hardcoded. Generator baru Prisma 7 (`prisma-client`) menulis ke folder
  custom (misalnya `generated/prisma`) dengan bentuk client berbeda, yang tidak
  cocok secara tipe dengan `@auth/prisma-adapter` tanpa type-cast paksa
  (`as any`). Memakai generator klasik membuat `@prisma/client` ter-generate di
  lokasi yang memang diharapkan adapter, tanpa workaround tipe yang rapuh.
- **Alternatif:** Pakai generator baru + `PrismaAdapter(prisma as any)` —
  ditolak karena menyembunyikan potensi mismatch struktural yang baru akan
  ketahuan saat runtime, bukan saat type-check.
- **Tinjau ulang:** Saat `@auth/prisma-adapter` resmi mendukung custom output
  Prisma 7 (cek changelog paketnya sebelum upgrade).

### D-013: Database lokal pakai Docker Compose (`docker-compose.dev.yml`), bukan SQLite

- **Keputusan:** PostgreSQL 17 (Alpine) via `docker compose -f
docker-compose.dev.yml up -d` untuk pengembangan lokal, sesuai stack Master
  Prompt §4 (bukan SQLite sebagai pengganti sementara).
- **Alasan:** Docker Desktop tersedia dan berfungsi di mesin ini. Memakai
  PostgreSQL sejak awal menghindari perbedaan perilaku tipe data/fungsi SQL
  antara SQLite (dev) dan PostgreSQL (produksi) yang sering menimbulkan bug
  tersembunyi saat migrasi.
- **Tinjau ulang:** Tidak perlu di mesin dengan Docker. Jika suatu saat
  dikerjakan di mesin tanpa Docker, perlu Postgres lokal alternatif (native
  install) — catat di README jika terjadi.

### D-014: Email verifikasi tidak memblokir login; provider email bersifat pluggable dengan fallback dev-log

- **Keputusan:** Pengguna bisa login segera setelah registrasi meski email
  belum diverifikasi; banner pengingat ditampilkan di app shell dengan opsi
  kirim ulang. `lib/email/mailer.ts` mengirim email sungguhan hanya jika
  `EMAIL_SERVER`/provider dikonfigurasi di env; jika tidak, isi email (termasuk
  link verifikasi/reset password) di-log ke console server dalam mode
  development agar alur tetap bisa diuji end-to-end tanpa kredensial SMTP asli.
- **Alasan:** Master Prompt §4 mewajibkan verifikasi email tersedia, tapi juga
  mewajibkan aplikasi tetap berjalan tanpa provider eksternal dikonfigurasi
  (prinsip yang sama yang berlaku untuk provider AI). Memblokir login total
  sebelum verifikasi akan mengunci semua pengujian lokal karena belum ada
  provider email asli.
- **Alternatif:** Memblokir login sampai email terverifikasi — dicatat sebagai
  opsi yang bisa diaktifkan lewat flag nanti jika kebijakan produk berubah.
- **Tinjau ulang:** Sebelum go-live produksi — putuskan provider email asli
  (mis. Resend) dan evaluasi apakah login tetap boleh pra-verifikasi.

### D-015: Onboarding tidak memblokir akses — nudge non-blocking, bukan redirect paksa

- **Keputusan:** Middleware hanya memverifikasi "sudah login atau belum" dari
  JWT (murah, jalan di Edge) dan TIDAK mengecek status onboarding. Status
  `onboardingCompletedAt` dibaca langsung dari tabel `profiles` di server
  component `(app)/layout.tsx` pada setiap request (bukan dari klaim JWT, agar
  selalu akurat — lihat alasan staleness di bawah), lalu ditampilkan sebagai
  banner "Lengkapi tujuan belajar Anda" di `AccountBanners` dengan tautan ke
  `/onboarding`. Pengguna yang belum onboarding tetap bisa mengakses seluruh
  `(app)/*` termasuk Beranda.
- **Alasan:** Master Prompt §8.1 eksplisit meminta "Onboarding bertahap, tidak
  terlalu panjang, dengan opsi melanjutkan nanti" — memblokir seluruh aplikasi
  sampai onboarding selesai bertentangan langsung dengan "opsi melanjutkan
  nanti". Halaman `/onboarding` sendiri juga punya tautan "Lewati, isi nanti"
  di step pertama.
- **Kenapa dibaca dari DB, bukan JWT:** JWT (strategi session yang dipakai
  karena Credentials provider) hanya di-re-sign saat login/refresh eksplisit,
  sehingga menyimpan status onboarding di JWT akan basi begitu pengguna
  menyelesaikan onboarding di tengah sesi yang sama, membuat banner tidak
  hilang meski sudah selesai — kecuality kita memaksa refresh token, yang
  menambah kerumitan tanpa manfaat besar pada tahap ini.
- **Tinjau ulang:** Jika query profil per-request terbukti jadi bottleneck
  performa nyata, pertimbangkan cache pendek atau klaim JWT yang di-refresh
  via `update()` NextAuth.

### D-016: `role` tetap jadi kolom enum di `User`, bukan tabel `Role` terpisah

- **Keputusan:** Master Prompt §13 menyebut `Role` sebagai salah satu model.
  Di Fase 1, ini diimplementasikan sebagai `enum Role { STUDENT TEACHER ADMIN }`
  - kolom `role` pada `User`, bukan tabel relasi many-to-many terpisah.
- **Alasan:** Tiga peran tetap dan saling eksklusif (satu pengguna = satu
  peran) sesuai seluruh penjelasan RBAC di Master Prompt; tabel `Role`
  terpisah hanya diperlukan untuk multi-role-per-user atau peran dinamis yang
  dikonfigurasi admin, yang tidak diminta.
- **Tinjau ulang:** Jika kebutuhan multi-role-per-user atau peran kustom
  muncul (mis. "guru sekaligus admin kelas tertentu"), migrasi ke tabel relasi.

### D-017: `trustHost: true` di NextAuth, `AUTH_URL` sengaja tidak di-set di dev

- **Keputusan:** `auth.ts` mengaktifkan `trustHost: true`. `.env` TIDAK berisi
  `AUTH_URL`.
- **Alasan:** Tanpa `trustHost`, NextAuth v5 hanya mempercayai origin yang
  cocok persis dengan `AUTH_URL` yang di-hardcode (default `.env` sebelumnya:
  `http://localhost:3000`). Ini ditemukan lewat E2E test yang gagal: server
  `npm run start -p 3100` (dipakai Playwright) tetap meredirect ke
  `http://localhost:3000/onboarding` setelah login — port yang salah, tidak
  ada yang listen di sana — menyebabkan `ERR_CONNECTION_REFUSED`. Men-set
  `trustHost: true` membuat NextAuth memakai Host header request yang
  sesungguhnya, benar untuk `:3000` (dev), `:3100` (E2E), maupun domain VPS
  asli nanti — selama Nginx meneruskan header `Host` dengan benar (Fase 17).
- **Alternatif:** Menyamakan `AUTH_URL` dengan port yang dipakai setiap kali
  — ditolak karena rapuh (gampang lupa disesuaikan) dan tidak scalable ke
  multi-environment.
- **Tinjau ulang:** Saat setup Nginx di Fase 17, pastikan header
  `X-Forwarded-Host`/`Host` diteruskan dengan benar; jika deployment di
  belakang proxy yang tidak bisa dipercaya header-nya, pertimbangkan
  mengembalikan `AUTH_URL` eksplisit untuk environment tersebut saja.

## Fase 2

### D-019: Re-import tidak mereset `reviewStatus` konten yang sudah APPROVED/PUBLISHED

- **Keputusan:** `scripts/content/import.ts` menaikkan `contentVersion` saat
  meng-update lesson/question yang sudah ada, tapi TIDAK mengubah
  `reviewStatus`-nya. Jadi mengedit file JSON sebuah lesson yang sudah
  `PUBLISHED` lalu re-import akan membuat kontennya berubah di produksi
  tanpa melalui review ulang.
- **Alasan:** Untuk Fase 2 MVP, importer dirancang sederhana (idempotent
  upsert) dulu; auto-reset ke `IN_REVIEW` saat konten published berubah
  butuh logika diff (apa yang sebenarnya berubah?) yang belum penting
  selama tim editorial masih kecil dan jumlah lesson published masih sedikit.
- **Risiko:** Seiring jumlah lesson published bertambah (Fase 4/18), editor
  bisa lupa bahwa edit pada file JSON langsung berdampak ke produksi.
- **Tinjau ulang:** Sebelum Fase 4 (seed konten besar-besaran) atau Fase 18
  (perluasan konten berkelanjutan) — tambahkan: (a) auto-turunkan status
  published→in_review saat `content`/`questions` berubah, atau (b) importer
  menolak meng-update lesson PUBLISHED tanpa flag eksplisit.

### D-020: CMS Fase 2 hanya untuk review/publish, bukan authoring

- **Keputusan:** `/admin/content` tidak punya form untuk menulis/mengedit
  teks lesson. Satu-satunya cara membuat/mengubah konten adalah menulis file
  JSON di `content/` lalu `npm run content:import`. UI admin hanya
  menampilkan pratinjau dan tombol transisi status.
- **Alasan:** Master Prompt Fase 2 secara eksplisit meminta "importer...
  CMS dasar draft/review/published dan preview lesson" — bukan rich-text
  editor. Editor WYSIWYG penuh (dengan version history, rollback) adalah
  lingkup Fase 13 ("Panel Admin/Teacher lengkap").
- **Tinjau ulang:** Fase 13.

## Fase 3

## Fase 5

### D-024: Status review `Question` mengikuti status `Lesson`-nya saat publish/archive

- **Keputusan:** `transitionLessonStatusAction` sekarang juga meng-update
  `reviewStatus` semua `Question` milik lesson tersebut saat lesson
  di-PUBLISHED atau di-ARCHIVED (via satu `$transaction`). Halaman lesson
  siswa (`/materi/.../[lessonCode]`) memfilter `questions` dengan
  `reviewStatus: "PUBLISHED"`, bukan menampilkan semua soal tanpa pandang
  status.
- **Bug yang ditemukan:** Fase 2/3/4 membangun workflow review di level
  LESSON saja; field `Question.reviewStatus` ada di schema (default DRAFT
  dari importer) tapi tidak pernah di-cascade saat lesson di-publish, dan
  halaman lesson tidak pernah memfilter soal berdasarkan status —
  sehingga quiz di halaman lesson "terlihat jalan" (karena menampilkan
  SEMUA soal, termasuk yang masih DRAFT). Baru ketahuan di Fase 5 saat
  `sampleDiagnosticQuestions()` (yang BENAR memfilter `PUBLISHED`)
  mengembalikan 0 soal — ditemukan lewat verifikasi visual manual
  ("0 / 0 pertanyaan terjawab"), bukan dari unit test maupun build yang
  lolos. Data existing diperbaiki retroaktif lewat skrip sekali-jalan.
- **Bug kedua, terkait:** `DiagnosticQuizForm`'s tombol submit dicek lewat
  `answeredCount === questions.length`, yang bernilai `true` secara trivial
  saat `0 === 0` — artinya tombol "Lihat Hasil" aktif meski tidak ada soal
  sama sekali. Diperbaiki dengan guard eksplisit `questions.length > 0`.
  Pelajaran yang sama seperti D-022: kondisi "semua terjawab" yang hanya
  dicek lewat perbandingan jumlah, tanpa guard eksplisit untuk kasus nol,
  adalah pola bug yang mudah berulang. `LessonQuiz`'s `allAnswered` memakai
  pola yang sama persis (`.every()` di array kosong juga `true` secara
  trivial) — belum pernah ketahuan di sana karena setiap lesson di seed
  sekarang selalu punya minimal 5 soal, tapi diperbaiki sekaligus secara
  proaktif di commit yang sama begitu polanya dikenali, bukan ditunda
  sampai benar-benar gagal.
- **Verifikasi:** Diperbaiki lewat verifikasi visual manual (screenshot
  Playwright sekali-pakai) yang mengonfirmasi halaman diagnostic test kini
  menampilkan 14 soal nyata (bukan "0 / 0"), lalu diformalkan jadi E2E test
  (`e2e/diagnostic-study-plan.spec.ts`) yang menegaskan jumlah soal > 0
  sebagai regression guard permanen — screenshot sekali-pakai sengaja tidak
  disimpan di repo, hanya kesimpulannya.
- **Tinjau ulang:** Jika Fase 13 menambah review per-soal yang independen
  dari lesson-nya (mis. admin menandai satu soal bermasalah tanpa
  meng-unpublish seluruh lesson), logika cascade ini perlu direvisi agar
  tidak menimpa keputusan per-soal yang lebih spesifik.

### D-025: Salinan dashboard yang menyebut diagnostic test/rencana belajar "belum dibangun" diperbarui setelah Fase 5 selesai

- **Keputusan:** `lib/i18n/dictionary.ts`'s teks `dashboard.welcomeBody`,
  `dashboard.todayPlanEmpty`, dan `dashboard.nextStepBody` (ID & EN)
  diperbarui dari menyebut diagnostic test/rencana belajar sebagai fitur
  "akan dibangun pada fase berikutnya" menjadi mengarahkan pengguna untuk
  benar-benar memakainya.
- **Bug yang ditemukan:** Teks ini ditulis di Fase 0/1 sebagai placeholder
  jujur untuk fitur yang memang belum ada saat itu. Setelah Fase 5
  membangun diagnostic test dan rencana belajar sungguhan, teks ini tidak
  ikut diperbarui — ditemukan lewat verifikasi visual manual (dashboard
  tetap menampilkan "Diagnostic test dan onboarding akan dibangun pada fase
  selanjutnya..." padahal pengguna baru saja menyelesaikan diagnostic test
  dan punya rencana belajar aktif). Ini melanggar prinsip kejujuran Master
  Prompt dari arah sebaliknya dari D-018/D-024: bukan menampilkan data
  palsu, tapi mengklaim fitur nyata sebagai belum ada.
- **Alasan diperbaiki:** Master Prompt §1 menuntut tidak ada elemen yang
  menyesatkan pengguna soal status fitur, berlaku untuk klaim "belum ada"
  maupun "sudah ada".
- **Tinjau ulang:** Setiap fase yang mengisi sebuah ComingSoon/stub di Fase
  0/1 perlu secara eksplisit mengecek salinan UI terkait di
  `lib/i18n/dictionary.ts`, bukan hanya menambah route/komponen baru.

### D-021: Jawaban mini-quiz dinilai server-side lewat `lib/content/grade-answer.ts`, bukan di client

- **Keputusan:** `app/(app)/materi/[...]/page.tsx` hanya mengirim
  `{code, type, prompt, options}` ke client (TANPA `answerKey`/
  `acceptedAnswers`/`explanation`). Pengecekan jawaban terjadi lewat server
  action `checkQuizAnswerAction` yang mengambil `Question` lengkap dari DB,
  memanggil `gradeAnswer()`, dan hanya mengembalikan `{correct, explanation}`.
- **Alasan:** Master Prompt §1 aturan 12: "Jangan menaruh... kunci jawaban
  ujian di client... penilaian ujian... dilakukan di server." Ini berlaku
  juga untuk mini-quiz lesson, bukan hanya mode ujian/tryout — menunda
  prinsip ini sampai Fase 6 (practice engine) akan berarti mengirim
  `answerKey` ke browser untuk seluruh Fase 3–5.
- **Tinjau ulang:** Fase 6 akan menggeneralisasi `gradeAnswer()` ini untuk
  practice engine penuh (attempt tracking, Buku Kesalahan) — fungsi ini
  sengaja ditulis pure/stateless agar mudah dipakai ulang.

### D-022: Bug ditemukan lewat screenshot manual: ORDERING answerKey (ID opsi) vs UI free-text (teks opsi)

- **Keputusan:** `gradeAnswer()` untuk tipe `ORDERING`/`MATCHING` sekarang
  me-resolve setiap ID di `answerKey` ke teks opsinya (`options[].text`)
  sebelum dibandingkan dengan input pengguna, bukan membandingkan ID mentah.
- **Alasan:** UI mini-quiz untuk `ORDERING` memakai input teks bebas ("Tulis
  urutan dipisah koma, mis: A, B, C, D") yang menghasilkan array TEKS opsi
  (`["A","B","C","D"]`), sementara `answerKey` di schema konten menyimpan
  array ID opsi (`["opt4","opt2","opt3","opt1"]`). Perbandingan array
  mentah selalu gagal walau jawaban pengguna secara konseptual benar — bug
  ini baru ketahuan lewat screenshot verifikasi visual manual (soal #5 pada
  lesson seed selalu ditandai salah meski diisi "A, B, C, D" yang benar),
  BUKAN dari 24 E2E test yang semuanya lulus (karena tidak satupun test
  men-assert kebenaran ORDERING secara spesifik, hanya "quiz bisa diisi dan
  diperiksa"). Ditambahkan test regresi di `tests/unit/grade-answer.test.ts`
  setelah fix.
- **Pelajaran:** E2E hijau tidak menjamin logika BENAR, hanya bahwa alur
  TIDAK CRASH — verifikasi visual/manual pada fitur baru tetap perlu untuk
  menangkap bug logika yang lolos dari assertion yang terlalu longgar.
- **Tinjau ulang:** Saat Fase 6 membangun UI ordering yang sesungguhnya
  (drag-and-drop/pilih-opsi, bukan free-text), pertimbangkan apakah
  perbandingan berbasis teks ini masih relevan atau sebaiknya kembali ke ID.

### D-023: `server-only` di-alias ke no-op untuk Vitest

- **Keputusan:** `vitest.config.ts` meng-alias import `"server-only"` ke
  modul kosong (`tests/noop-server-only.ts`).
- **Alasan:** Paket `server-only` sengaja `throw` saat modul yang
  meng-importnya dievaluasi di luar bundler Next.js (yang secara statis
  menghapus guard ini) — perilaku ini benar untuk build Next.js tapi
  membuat modul server-only (mis. `lib/content/grade-answer.ts`) tidak bisa
  di-unit-test langsung oleh Vitest tanpa alias ini.
- **Tinjau ulang:** Tidak perlu — ini pola umum yang didokumentasikan
  komunitas Next.js+Vitest.

### D-018: Hanya "Beranda" punya halaman nyata di Fase 0; 15 menu lain pakai stub "segera tersedia"

- **Keputusan:** Semua item navigasi di `lib/nav-config.ts` punya route yang benar
  (bisa diklik dan berpindah halaman), tapi hanya `/dashboard` berisi konten nyata.
  Sisanya memakai `<ComingSoon plannedPhase="..." />`.
- **Alasan:** Master Prompt §1 melarang tombol tanpa aksi DAN melarang konten palsu
  yang terlihat seperti sudah jadi. Stub yang jujur dengan label fase memenuhi
  keduanya tanpa mendahului Fase 2–14 yang belum dikerjakan.
- **Alternatif:** Menyembunyikan menu yang belum ada kontennya — ditolak karena
  Master Prompt secara eksplisit ingin seluruh IA (16 menu) terlihat dari awal
  sebagai peta jalan produk.
- **Tinjau ulang:** Setiap fase yang menyelesaikan satu menu harus menghapus stub
  terkait dan mengarahkan ke halaman nyata.

## Fase 6

### D-026: SM-2 (bukan FSRS) untuk spaced repetition di Buku Kesalahan; SM-2 hanya maju lewat review eksplisit, bukan latihan biasa

- **Keputusan:** `lib/srs/sm2.ts` mengimplementasikan algoritma SuperMemo
  SM-2 klasik (Wozniak, 1987) secara pure/stateless. `MistakeBookEntry`
  menyimpan `intervalDays`/`easeFactor`/`repetitions`. Status SM-2 HANYA
  dimajukan lewat `rateMistakeReviewAction` (alur review eksplisit di
  `/buku-kesalahan`, model "lihat jawaban lalu nilai diri sendiri" ala
  Anki) — menjawab soal yang sama di Latihan Harian biasa TIDAK memajukan
  SM-2, hanya memperbarui `lastSubmittedAnswer` dan menjadwalkan ulang
  `nextReviewAt` ke hari ini jika masih salah.
- **Alasan:** Master Prompt §8.10 mengizinkan "FSRS atau SM-2 melalui
  implementasi terdokumentasi". SM-2 dipilih karena parameternya (interval,
  ease factor) deterministik dan mudah diuji unit tanpa data training,
  sementara FSRS idealnya dikalibrasi dari riwayat review pengguna dalam
  jumlah besar — belum relevan selama basis soal dan pengguna masih kecil.
  Membatasi kemajuan SM-2 hanya ke alur review eksplisit mencegah soal yang
  kebetulan dijawab benar di sesi latihan biasa (tanpa niat "mereview")
  memperpanjang interval secara tidak sengaja — quality SM-2 butuh sinyal
  recall yang disengaja, bukan jawaban insidental.
- **Alternatif dipertimbangkan:** Memajukan SM-2 dari jawaban benar di
  Latihan Harian juga — ditolak karena itu akan membuat interval tumbuh
  dari sinyal yang lebih noisy (pengguna mungkin menjawab benar karena
  soal itu sedang relevan dipelajari, bukan karena benar-benar mengingat
  kesalahan sebelumnya).
- **Tinjau ulang:** Jika data menunjukkan SM-2 terlalu kasar (mis. interval
  tumbuh terlalu cepat/lambat dibanding pengalaman pengguna nyata), ganti
  ke FSRS dengan kalibrasi dari `QuestionAttempt`/`MistakeBookEntry` yang
  sudah terkumpul.

### D-027: Waktu menjawab (`timeSpentMs`) adalah per-kartu, bukan perkiraan dari sesi gabungan

- **Keputusan:** `components/practice/practice-session-form.tsx` dan
  `components/mistake-book/mistake-review-session.tsx` menampilkan SATU
  soal per layar (bukan semua soal sekaligus seperti mini-quiz lesson/
  diagnostic test Fase 3/5), dengan timer mulai persis saat kartu itu
  mount (`useEffect` sekali per kartu, di-key dari `questions[index].code`/
  `entryId` di parent supaya child benar-benar remount, bukan reset manual
  lewat effect).
- **Alasan:** Master Prompt §8.4 eksplisit minta "simpan waktu menjawab"
  per soal. Pola "isi semua baru submit" (dipakai Fase 3/5) tidak bisa
  memberi angka waktu-per-soal yang jujur karena urutan pengisian bebas.
  Pola satu-kartu-satu-waktu juga lebih cocok dengan "feedback per soal"
  yang diminta untuk mode practice (§8.9).
- **Catatan implementasi:** `useRef(Date.now())` di render body awalnya
  dipakai lalu ditolak oleh lint rule `react-hooks/purity` (App Router
  React Compiler) karena memanggil fungsi impure saat render. Timer
  dipindah ke `useEffect(() => { ref.current = Date.now() }, [])` yang
  jalan sekali per mount kartu — bukan di render, dan bukan `setState` di
  effect (yang juga ditolak oleh `react-hooks/set-state-in-effect`).
- **Tinjau ulang:** Tidak perlu — pola ini sudah konsisten dipakai di
  kedua komponen dan lolos lint React Compiler yang ketat.

### D-028: Bug ditemukan lewat verifikasi visual: Buku Kesalahan melewati satu kartu setiap kali satu kartu selesai direview

- **Bug:** `MistakeReviewSession` awalnya membaca `items` langsung dari
  prop server component (daftar soal yang jatuh tempo). `rateMistakeReviewAction`
  memanggil `revalidatePath("/buku-kesalahan")` setelah tiap review, yang
  membuat server component mem-fetch ulang daftar jatuh-tempo yang LEBIH
  PENDEK (kartu yang baru direview sudah tidak jatuh tempo lagi). Tapi
  `index` lokal di client tetap bertambah 1 seperti biasa — akibatnya
  `items[index]` pada array yang sudah menyusut menunjuk ke kartu yang
  SALAH (satu posisi terlalu jauh), sehingga satu kartu yang belum
  direview terlewat tanpa pernah ditampilkan ke pengguna, setiap kali.
- **Cara ditemukan:** Verifikasi visual manual (screenshot Playwright
  sekali-pakai) yang menunjukkan counter "X soal siap direview hari ini"
  berkurang dari 14 → 13 secara wajar, tapi query database langsung
  terhadap `MistakeBookEntry.reviewCount` menunjukkan satu entri yang
  seharusnya sudah direview tetap `reviewCount: 0`. Pola yang sama seperti
  D-022/D-024: lolos uji visual sekilas, tidak lolos verifikasi data.
- **Perbaikan:** `MistakeReviewSession` sekarang men-snapshot `items` ke
  `useState` SEKALI saat mount (`const [items] = useState(initialItems)`)
  dan mengabaikan pembaruan prop berikutnya — sesi review selalu
  menyelesaikan batch tetap yang di-fetch di awal, terlepas dari berapa
  kali `revalidatePath` memperbarui counter "jatuh tempo" di bagian lain
  halaman. Counter ringkasan di atasnya tetap live (dibaca langsung dari
  server component), hanya ANTREAN review yang dibekukan.
- **Regresi:** `e2e/practice-mistake-book.spec.ts` ("reviewing every due
  card updates all of them — none are silently skipped") me-review SELURUH
  antrean lewat UI lalu memverifikasi lewat Prisma langsung bahwa setiap
  entri yang tadinya jatuh tempo kini punya `reviewCount >= 1` — regression
  guard permanen untuk bug kelas ini.
- **Tinjau ulang:** Jika Fase 12 menambah notifikasi real-time yang bisa
  mengubah antrean SAAT sesi review berjalan (mis. soal baru ditambahkan
  admin), pertimbangkan ulang apakah snapshot statis masih tepat atau
  perlu digabung ke antrean yang sedang berjalan.

### D-029: `Question.lessonId` nullable berarti soal Buku Kesalahan bisa tanpa link lesson

- **Keputusan:** `describeExpectedAnswer()` dan `checkMistakeReviewAction`
  menangani `question.lesson` yang `null` dengan `lessonHref: null`, dan UI
  review cukup tidak menampilkan tautan "Buka lesson terkait" jika null,
  bukan error atau placeholder rusak.
- **Alasan:** Schema `Question.lessonId` sudah nullable sejak Fase 2 (soal
  bisa berdiri sendiri, mis. untuk tryout Fase 11 nanti), jadi Buku
  Kesalahan harus menangani kasus ini sejak awal, bukan mengasumsikan
  setiap soal selalu datang dari satu lesson.
- **Tinjau ulang:** Tidak perlu — ini konsisten dengan desain
  `Question.lessonId` yang sudah ada sejak Fase 2.

## Fase 7

### D-030: Audio listening disintesis lewat Windows SAPI TTS, bukan direkam atau diambil dari sumber berlisensi pihak ketiga

- **Keputusan:** `scripts/content/generate-listening-audio.ps1` membaca
  naskah orisinal dari `content/listening/*.json` (field `script`, array
  giliran bicara per speaker) dan men-generate file `.wav` lewat
  `System.Speech.Synthesis.SpeechSynthesizer` bawaan Windows — dua suara
  berbeda (`Microsoft David Desktop`, `Microsoft Zira Desktop`) dipetakan
  bergantian per speaker yang berbeda dalam satu passage, sepenuhnya
  offline, tanpa API key atau lisensi pihak ketiga.
- **Alasan:** Master Prompt §8.5 mewajibkan "Semua audio/script harus
  orisinal atau memiliki lisensi yang jelas." Merekam audio manusia asli
  atau melisensikan aset pihak ketiga berada di luar kapabilitas agent ini
  untuk dieksekusi secara otonom. TTS dari naskah yang 100% ditulis sendiri
  memenuhi syarat "orisinal" secara jujur (bukan rekaman asli manusia, tapi
  juga bukan hasil plagiarisme/lisensi tak jelas) — ini didokumentasikan
  terbuka, bukan disembunyikan sebagai audio "profesional".
- **Konsekuensi yang diterima:** Audio terdengar jelas sintetis (robotic),
  bukan native speaker asli, dan hanya tersedia logat Amerika (dua suara
  SAPI yang terpasang). `ListeningPassage.accent` diisi jujur sebagai
  "American (synthesized)", bukan mengklaim logat Inggris/Australia yang
  sebenarnya tidak match dengan suara yang dipakai.
- **Format file:** WAV (PCM) mentah, bukan MP3/Opus terkompresi — tidak ada
  `ffmpeg` atau encoder di environment ini. File jadi besar (~44KB/detik,
  ~3-4.5MB per passage 1.5 menit) — dapat diterima untuk tahap ini, tapi
  perlu ditranskode saat Fase 17 (deployment) menambah pipeline build
  dengan `ffmpeg`, atau saat jumlah passage bertambah signifikan di Fase 18.
- **Tinjau ulang:** Jika tim mendapat akses ke voice actor sungguhan atau
  layanan TTS premium (mis. neural TTS cloud) dengan lisensi jelas, ganti
  audio existing secara bertahap — struktur `script` (JSON terstruktur per
  giliran bicara) tidak perlu berubah, hanya `audioFile` yang diganti.

### D-031: Soal Listening dikecualikan dari pool Latihan Harian/diagnostic umum; transkrip hanya bocor setelah checking, dan tidak pernah di mode ujian

- **Keputusan:** `sampleDiagnosticQuestions()` dan `/latihan-harian`'s
  kandidat soal memfilter `listeningPassageId: null`, mengecualikan seluruh
  soal Listening dari pool generik. `checkListeningAnswersAction` hanya
  mengembalikan `script` (transkrip) setelah jawaban diperiksa, dan HANYA
  jika `mode === "practice"` — mode ujian tidak pernah menerima transkrip
  dari server sama sekali, bukan hanya disembunyikan di client.
- **Alasan (exclusion):** Soal Listening butuh konteks audio yang baru
  diputar untuk masuk akal; menampilkannya di kartu latihan generik tanpa
  pemutar audio (atau tanpa audio yang baru didengar) akan membingungkan
  dan tidak adil dinilai.
- **Alasan (transkrip server-side gating per mode):** Konsisten dengan
  D-021 — jangan percaya client untuk menyembunyikan sesuatu yang
  sensitif; mode ujian harus benar-benar tidak pernah menerima transkrip
  dalam response, bukan menerimanya lalu disembunyikan via CSS/state, yang
  bisa dilihat lewat DevTools.
- **Tinjau ulang:** Jika Fase 11 (tryout) mengimpor soal Listening ke dalam
  blueprint ujian resmi, filter `listeningPassageId: null` di
  Latihan Harian/diagnostic TETAP relevan (soal listening masih butuh
  audio), tapi exam-mode tryout akan punya alurnya sendiri yang terpisah
  dari toggle mode di komponen ini.

### D-032: Bug ditemukan lewat investigasi test E2E: menilai kartu review TERAKHIR di Buku Kesalahan mengganti seluruh sesi dengan empty state, menghapus layar "Review selesai"

- **Bug:** `rateMistakeReviewAction` memanggil `revalidatePath("/buku-kesalahan")`
  setelah setiap penilaian, supaya counter "X soal siap direview hari ini"
  di header halaman ikut update live (perilaku ini sengaja dan berhasil
  diverifikasi secara visual di Fase 6). Tapi `revalidatePath` dari sebuah
  Server Action yang dipanggil di dalam `startTransition` otomatis memicu
  Next.js me-refresh ulang seluruh RSC payload rute saat ini — termasuk
  kondisi `reviewItems.length === 0 ? <empty-state> : <MistakeReviewSession>`
  di `app/(app)/buku-kesalahan/page.tsx`. Begitu kartu due TERAKHIR
  dinilai, query due-count server menjadi 0 pada refresh berikutnya, dan
  React meng-unmount `MistakeReviewSession` (termasuk state "Review
  selesai" internalnya) lalu memasang `<empty-state>` sebagai gantinya —
  pengguna yang baru saja menyelesaikan SEMUA review tidak pernah melihat
  ringkasan selesainya sendiri, malah melihat pesan "Tidak ada review yang
  jatuh tempo hari ini" yang generik dan tidak relevan dengan yang baru
  mereka lakukan.
- **Cara ditemukan:** `e2e/practice-mistake-book.spec.ts`'s test "none are
  silently skipped" gagal secara TIDAK konsisten dengan gejala yang
  membingungkan (kadang gagal di kartu pertama, kadang di tengah, pesan
  error berbeda-beda). Tiga pendekatan Playwright yang berbeda
  (`.or()`, polling manual, `Promise.race` dengan `waitFor` native) SEMUA
  gagal dengan cara yang sama, yang justru menjadi petunjuk kuat ini BUKAN
  masalah timing/query Playwright — screenshot langsung di titik gagal
  akhirnya mengonfirmasi: halaman menampilkan "0 soal siap direview" alih-
  alih kartu soal ATAU layar "Review selesai". Query database terhadap
  SELURUH entri user menunjukkan semua entri sudah `reviewCount: 1`
  (berhasil dinilai) — bug-nya ada di state TRANSISI SETELAH kartu
  terakhir, bukan di proses penilaian itu sendiri.
- **Perbaikan:** `revalidatePath("/buku-kesalahan")` dihapus dari
  `rateMistakeReviewAction`. Trade-off yang diterima: counter "X soal siap
  direview" di header tidak lagi update live selama satu sesi review
  berjalan (tetap menunjukkan angka dari saat halaman pertama dimuat),
  baru benar-benar fresh saat pengguna mengunjungi ulang halaman. Ini jauh
  lebih baik daripada counter live yang justru merusak layar penyelesaian
  sesi.
- **Pelajaran:** Pola yang sama seperti D-028 tapi satu langkah lebih jauh
  — D-028 adalah tentang ANTREAN di dalam komponen yang berubah; D-032
  adalah tentang KOMPONEN ITU SENDIRI yang di-unmount oleh parent Server
  Component akibat `revalidatePath` yang dipanggil TERLALU SERING (per
  kartu, bukan per sesi). Keduanya menunjukkan pola berulang: fitur "live
  update" yang nyaman butuh dipikirkan efeknya di BATAS transisi (array
  kosong↔tidak kosong, status terakhir↔selesai), bukan hanya kasus umum.
- **Tinjau ulang:** Jika suatu saat counter live di header benar-benar
  dibutuhkan, pertimbangkan `useOptimistic`/state lokal di
  `MistakeReviewSession` untuk counter itu sendiri (dihitung dari progres
  klien), bukan `revalidatePath` yang mengganti seluruh subtree server.
- **Catatan tambahan (Fase 8):** bug deterministik di atas sudah
  dikonfirmasi 100% hilang lewat banyak run berulang pada server yang
  SUDAH jalan (isolated run maupun bagian dari full suite dengan server
  reuse). Yang TERSISA adalah test ini kadang masih time-out (sudah
  dinaikkan ke 90 detik) KHUSUS saat `npx playwright test` memulai
  webServer dari nol (`npm run build && npm run start`) di bawah 4 worker
  paralel sekaligus — test ini melakukan ~30 round-trip (sesi latihan +
  sesi review), jadi paling sensitif terhadap kontensi cold-start. Ini pola
  yang SAMA dengan flake `auth.spec.ts`'s "full happy path" yang sudah
  lebih dulu diketahui di Fase 5/6 — karakteristik lingkungan test lokal,
  bukan bug produk, dan tidak dikejar lebih jauh karena effort lanjutan
  tidak proporsional terhadap manfaatnya.

## Fase 8

### D-033: Highlight per-paragraf (bukan rentang teks bebas); timer tampilan-saja (tidak auto-submit); autosave lewat localStorage (bukan model attempt baru)

- **Keputusan:** Tiga penyederhanaan sadar untuk Reading Lab dibanding
  deskripsi penuh Master Prompt §8.6/§8.9:
  1. "Highlight" diimplementasikan sebagai klik-untuk-menandai PARAGRAF
     utuh (`ReadingPassageWorkspace`'s `toggleHighlight`), bukan menandai
     rentang teks bebas (mis. menyorot beberapa kata di tengah kalimat).
  2. Timer 20 menit hanya tampilan (hitung mundur, berubah merah di bawah
     2 menit) — tidak memaksa auto-submit saat habis.
  3. Autosave jawaban memakai `localStorage` per `passageCode`
     (`reading-draft:<code>`), bukan model attempt/sesi baru di database.
- **Alasan:** Rentang-teks-bebas butuh serialisasi Range API dan re-render
  tanpa merusak DOM React — kompleksitas yang tidak sepadan untuk MVP satu
  fase. Auto-submit paksa butuh penanganan edge-case (apa yang dikirim jika
  sebagian soal kosong, race dengan submit manual) yang lebih pas masuk ke
  sistem tryout/blueprint Fase 11 yang memang dirancang untuk itu — Reading
  Lab versi fase ini adalah alat LATIHAN, bukan ujian resmi bertimer ketat.
  Autosave via `localStorage` memenuhi "autosave" secara jujur (jawaban
  tidak hilang saat reload tidak sengaja) tanpa membangun model
  attempt-tracking baru yang belum punya kebutuhan nyata di luar ini.
- **Konsekuensi yang diterima:** Highlight tidak akan terlihat seperti
  stabilo asli IELTS computer-delivered (yang bisa menyorot kata per kata).
  Timer murni pengingat, bukan penegak waktu. Draft jawaban hanya
  tersimpan di browser perangkat yang sama, tidak sinkron lintas perangkat.
- **Tinjau ulang:** Fase 11 (tryout/exam mode) akan butuh timer yang BENAR
  auto-submit dan attempt state tersimpan di server (bukan localStorage)
  agar bisa dilanjutkan dari perangkat lain — itu sistem terpisah, bukan
  perluasan dari `ReadingPassageWorkspace` ini.

### D-034: Soal Reading dikecualikan dari pool Latihan Harian/diagnostic umum; evidence selalu dikembalikan setelah checking tanpa gating mode ujian

- **Keputusan:** `sampleDiagnosticQuestions()` dan `/latihan-harian`'s
  kandidat soal memfilter `readingPassageId: null` juga (selain
  `listeningPassageId: null` dari D-030). `checkReadingAnswersAction` SELALU
  mengembalikan `evidence`/`explanation` setelah soal diperiksa, TANPA
  toggle mode latihan/ujian seperti Listening Lab.
- **Alasan (exclusion):** Sama seperti D-030 — soal Reading butuh konteks
  passage yang sedang dibaca, tidak masuk akal muncul di kartu latihan
  generik tanpa passage-nya.
- **Alasan (tidak ada mode-gating evidence):** Listening Lab menyembunyikan
  transkrip di mode ujian karena audio HANYA diputar sekali lalu hilang —
  transkrip adalah "kebocoran" konten yang sebelumnya tidak tersedia lagi
  bagi pengguna. Reading TIDAK memiliki karakteristik ini: passage tetap
  terlihat penuh di layar sepanjang waktu, di kedua mode manapun — tidak
  ada "konten yang hilang" untuk dilindungi dengan menyembunyikan evidence.
  Memaksakan toggle mode latihan/ujian yang sama seperti Listening Lab ke
  sini hanya akan menambah kompleksitas tanpa manfaat keamanan konten yang
  nyata.
- **Tinjau ulang:** Jika Fase 11 mengimpor soal Reading ke blueprint tryout
  resmi, filter exclusion TETAP relevan, tapi alur ujian sungguhan akan
  punya sistemnya sendiri (timer tegas, auto-submit, larangan melihat
  evidence sebelum submit seluruh section) terpisah dari toggle sederhana ini.

## Fase 9

### D-035: Bug ditemukan lewat E2E: `submitWritingAction` membaca body jawaban dari DB (bukan dari client), gagal silent jika diklik sebelum autosave debounce selesai

- **Bug:** `WritingTaskWorkspace` meng-autosave outline/body dengan debounce
  1500ms (`scheduleSave`). `handleSubmit` memanggil
  `submitWritingAction(submission.id)` HANYA dengan ID — aksi ini lalu
  membaca `submission.body` dari DB untuk validasi "tidak boleh kosong".
  Jika pengguna mengklik Submit dalam waktu <1500ms setelah mengetik
  (sangat realistis — autosave adalah convenience, bukan sesuatu yang
  pengguna sadar harus ditunggu), DB masih punya body KOSONG dari saat
  draft dibuat. Aksi menolak submit dengan error "Tulisan masih kosong",
  dan `handleSubmit`'s `.then()` membuang error itu begitu saja
  (`if ("error" in result) return;`) tanpa pesan apa pun ke pengguna —
  dari sudut pandang pengguna, tombol Submit tampak tidak melakukan apa-apa.
- **Cara ditemukan:** `e2e/writing-lab.spec.ts` — 3 dari 5 test gagal
  dengan gejala identik ("Self-Assessment" tidak pernah muncul setelah
  klik Submit). Dicurigai lebih dulu kemungkinan race test-side (tombol
  ambigu, dll), tapi investigasi langsung (script Playwright terpisah yang
  mencatat semua request/response POST) menunjukkan response aksi submit
  SELALU `{"error": "Tulisan masih kosong — tidak ada yang bisa disubmit."}`
  — persis karena test mengisi textarea lalu langsung klik Submit, sama
  seperti perilaku realistis pengguna yang mengetik cepat.
- **Perbaikan:** `submitWritingAction(submissionId, outline, body)` sekarang
  menerima isi saat ini langsung dari client dan menyimpannya (outline,
  body, wordCount) dalam SATU update yang sama dengan transisi status ke
  SUBMITTED — tidak lagi bergantung pada autosave yang sudah "mendarat" di
  DB. `handleSubmit` juga membatalkan timer autosave yang masih pending
  sebelum submit (mencegah race balik: autosave basi menimpa body yang
  baru disubmit) dan sekarang menampilkan `submitError` ke pengguna jika
  aksi gagal, bukan membuangnya diam-diam.
- **Pelajaran:** Pola yang sama dengan D-028/D-032 — "sumber kebenaran"
  yang diasumsikan sudah sinkron (di sini: autosave vs. isi textarea saat
  ini) ternyata punya jendela waktu nyata di mana keduanya berbeda, dan
  aksi server memilih sumber yang salah. Kapan pun sebuah Server Action
  menerima HANYA sebuah ID dan membaca state mutable dari DB alih-alih
  menerima state itu langsung dari pemanggil, pertimbangkan apakah ada
  autosave/debounce yang membuat DB tersebut berpotensi basi.

### D-036: Sign-out memakai hard navigation (bukan soft client-router push) — race lama "full happy path" di D-032 ternyata bug produk nyata, bukan sekadar flake lingkungan

- **Bug (mengoreksi catatan D-032):** D-032 mencatat `auth.spec.ts`'s "full
  happy path" kadang time-out/gagal saat webServer baru mulai dari nol, dan
  menyimpulkan ini "karakteristik lingkungan test lokal, bukan bug produk".
  Investigasi ulang di Fase 9 (dipicu oleh kebutuhan menjalankan ulang
  seluruh suite E2E) membuktikan kesimpulan itu SALAH: ini bug produk nyata
  di alur sign-out. `signOutAction` memanggil `signOut({ redirectTo: "/" })`
  dari Server Action — ini sebuah REDIRECT HALUS (client-router push), yang
  TIDAK membatalkan request yang sedang in-flight. Dashboard (dan sidebar
  nav-nya) memicu banyak prefetch `<Link>` otomatis ke rute lain yang
  sedang terautentikasi; Auth.js v5 untuk strategi `"jwt"` RE-SIGN cookie
  session pada SETIAP pemanggilan `auth()` (termasuk dari request prefetch
  ini), tanpa throttle `updateAge` untuk strategi jwt. Jika salah satu
  response prefetch ini (yang membawa Set-Cookie yang me-refresh session
  lama) tiba di browser SETELAH Set-Cookie penghapus dari sign-out, cookie
  session "dihidupkan kembali" — pengguna yang baru saja klik "Keluar"
  tetap terautentikasi.
- **Cara ditemukan:** Mengulang test yang sama 8-10× berturut-turut (bukan
  sekali) pada server yang BARU di-build (`npm run build && npm run start`
  dari nol — kondisi di mana Playwright paling sering menjalankannya)
  mereproduksi kegagalan ~60-70% dari percobaan — jauh dari acak. Instrumentasi
  langsung (mencatat `page.context().cookies()` sebelum/sesudah klik
  "Keluar", dan header `set-cookie` tiap response POST via
  `response.allHeaders()`) menunjukkan `authjs.session-token` kadang MASIH
  ada setelah sign-out, dengan nilai yang sama seperti sebelumnya — bukan
  resign baru, melainkan cookie lama yang tidak pernah terhapus karena
  ditimpa balik oleh response prefetch yang lebih lambat.
- **Perbaikan:** `SignOutButton` (`components/layout/sign-out-button.tsx`,
  dipakai di `SiteHeader` dan admin layout) memanggil `signOutAction()` —
  yang sekarang memanggil `signOut({ redirect: false })`, hanya menghapus
  cookie tanpa redirect — lalu melakukan `window.location.href = "/"` secara
  manual. Hard navigation membuat browser membatalkan request in-flight
  dari dokumen lama (termasuk prefetch yang sedang berjalan), jauh
  mengurangi jendela race. Helper E2E baru `signOut(page)` di
  `e2e/helpers.ts` menunggu URL benar-benar `/` sebelum test melanjutkan,
  dipakai di semua 4 titik klik "Keluar" di `auth.spec.ts` — tanpa ini,
  `page.goto()` milik test sendiri bisa bertabrakan dengan hard navigation
  kita (`net::ERR_ABORTED`).
- **Risiko residual (diterima, bukan dihilangkan total):** Re-sign cookie
  session pada setiap `auth()` adalah desain Auth.js v5 yang disengaja
  (sliding session — tetap login selama aktif, tanpa refresh-token
  terpisah), bukan sesuatu yang bisa dimatikan lewat config sederhana tanpa
  membangun mekanisme revocation list sendiri. Hard navigation memperkecil
  jendela race secara drastis (diverifikasi: ~60-70% → ~10% kegagalan pada
  10× percobaan berturut-turut tanpa jeda sama sekali) tapi tidak membuatnya
  nol — masih ada jendela milidetik antara response sign-out mendarat dan
  browser benar-benar membatalkan request lain. Penghilangan total butuh
  token versioning/revocation check di callback `jwt` (cek field seperti
  `invalidatedAt` terhadap DB) — pekerjaan yang lebih cocok masuk Fase 17
  (security hardening) daripada dipaksakan di sini.
- **Pelajaran:** Flake yang "sudah diketahui" dan didokumentasikan sebagai
  environment-only (D-032's catatan tambahan) TETAP layak diinvestigasi
  ulang kalau kesempatan muncul (di sini: kebutuhan menjalankan ulang
  seluruh suite) — keputusan "tidak dikejar lebih jauh karena effort tidak
  proporsional" dari fase sebelumnya adalah penilaian pada saat itu, bukan
  fakta permanen, dan di sini ternyata salah.

## Fase 10

### D-037: Satu rekaman per submission (bukan per pertanyaan); penyimpanan di disk lokal server-only (bukan object storage); tanpa transkripsi/skor AI

- **Keputusan (satu rekaman per submission):** Part 1 dan Part 3 masing-
  masing membawa beberapa `followUpQuestions` (gaya pertanyaan beruntun
  seperti ujian asli), tapi SELURUH part direkam sebagai SATU sesi
  `MediaRecorder` berkelanjutan — bukan satu rekaman terpisah per
  pertanyaan. Pengguna melihat semua pertanyaan part itu sekaligus
  (seperti cue card) dan menjawabnya berurutan dalam satu rekaman.
- **Alasan:** Merekam per-pertanyaan butuh pipeline jauh lebih rumit
  (banyak `MediaRecorder` session per attempt, banyak file, UI untuk
  menavigasi antar rekaman) untuk manfaat realisme yang marginal pada
  tahap latihan (bukan mock test resmi — itu domain Fase 11). Trade-off
  yang sama persis dengan bagaimana Listening/Reading/Writing masing-
  masing menyederhanakan struktur dibanding ujian resmi (lihat D-033).
- **Keputusan (penyimpanan):** File audio disimpan di disk lokal server
  (`storage/speaking-recordings/<userId>/<uuid>.<ext>`, di luar `public/`,
  tidak pernah di-commit ke git), bukan object storage (S3/R2/dll). Dibaca
  HANYA lewat route handler `app/api/speaking-recordings/[id]` yang
  memverifikasi `session.user.id === recording.userId` sebelum
  mengembalikan bytes-nya — "Lindungi file rekaman" (Master Prompt §8.8).
- **Alasan (disk lokal, bukan object storage):** Master Prompt §13
  eksplisit menyarankan object storage untuk file besar, tapi proyek ini
  belum punya kredensial/provider object storage terkonfigurasi di fase
  manapun sebelumnya, dan rekaman Speaking Lab berdurasi pendek (≤150
  detik, dibatasi `MAX_RECORDING_BYTES` 15MB server-side) — bukan file
  besar dalam pengertian yang dimaksud aturan itu. Menambah dependency
  object storage sekarang berarti kredensial palsu/placeholder, bertentangan
  dengan prinsip "tidak ada data/koneksi palsu" yang dipegang konsisten
  sejak Fase 1. **Tinjau ulang di Fase 17** (VPS/deployment): jika volume
  rekaman nyata membesar, pindahkan ke object storage sungguhan saat
  kredensialnya tersedia — `lib/speaking/storage.ts` sengaja diisolasi di
  satu modul kecil (3 fungsi) persis supaya migrasi ini nanti tidak
  menyentuh server actions atau UI sama sekali.
- **Keputusan (tanpa AI):** Tidak ada transkripsi speech-to-text dan tidak
  ada skor/feedback otomatis dari AI — sama seperti keputusan Writing Lab
  Fase 9 (D-035's pendahulu implisit): tidak ada kredensial provider AI
  yang disediakan pengguna untuk fase mana pun di proyek ini. Self-
  assessment checklist (4 kriteria: fluency/coherence, lexical resource,
  grammar range/accuracy, pronunciation) dan model answer tertulis
  orisinal menggantikan feedback AI secara jujur, sesuai Master Prompt
  §8.8 "Implementasikan fallback tanpa AI/transkripsi" — ini BUKAN
  fallback sementara menunggu AI terpasang, melainkan satu-satunya mode
  yang dibangun di fase ini.
- **Konsisten dengan D-021/D-034/D-035:** `modelAnswer`/`checklistItems`
  hanya pernah dikirim ke client setelah `SpeakingSubmission.status`
  benar-benar `COMPLETED` — dicek di server component
  (`revealedModelAnswer`/`revealedChecklist` di
  `app/(app)/speaking-lab/[promptCode]/page.tsx`), bukan disembunyikan di
  client saja.
- **Bug ditemukan lewat E2E (diperbaiki sebelum commit):**
  `completeSpeakingSubmissionAction` sudah menerima `fallbackText`
  langsung dari client (menghindari race class D-035 sejak awal — bukan
  bug baru), TAPI `SpeakingPromptWorkspace`'s `handleComplete` hanya
  meng-update `submission.status` ke `COMPLETED` secara lokal tanpa ikut
  meng-update `submission.fallbackText` — akibatnya tampilan "selesai"
  tidak pernah menampilkan balik jawaban tertulis yang baru saja dikirim
  (state lokal `submission.fallbackText` tetap string kosong dari saat
  attempt dimulai). Ditemukan oleh `e2e/speaking-lab.spec.ts`'s test jalur
  fallback-text, bukan verifikasi visual manual (yang kebetulan hanya
  menguji jalur rekaman). Diperbaiki dengan menyertakan `fallbackText`
  (state lokal yang sudah dikonfirmasi sinkron dengan server lewat
  parameter yang sama) saat meng-update state `submission` pasca-complete.
- **Mikrofon diuji sungguhan di E2E, bukan di-mock:** Chromium mendukung
  flag `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`
  yang memberi `getUserMedia`/`MediaRecorder` stream audio sintetis tanpa
  mikrofon fisik ataupun dialog izin — dipasang di `playwright.config.ts`
  bersama `permissions: ["microphone"]`. Ini berarti `e2e/speaking-lab.spec.ts`
  menguji pipeline rekaman SUNGGUHAN end-to-end (rekam → upload → simpan
  ke disk → putar ulang lewat route terproteksi), bukan di-skip atau
  di-mock, konsisten dengan prinsip sesi ini untuk tidak memalsukan test.

## Fase 11

### D-038: MockTest single-skill saja (bukan full 4-skill mock); deadline server-side via `deadlineAt`, bukan dipercaya dari client; test builder admin ditunda ke Fase 13

- **Keputusan (single-skill):** Setiap `MockTest` yang dibangun/di-seed di
  fase ini hanya mencakup SATU skill (`TestBlueprint.skill`: LISTENING atau
  READING) — tidak ada "Full Mock Test" 4-skill (Listening+Reading+Writing+
  Speaking) dalam satu attempt bertimer tunggal. Tiga mock test di-seed:
  Listening Mini Mock (2 section, reuse `LISTENING-S1-001`/`LISTENING-S3-001`
  dari Fase 7), Academic Reading Section Test dan General Training Reading
  Section Test (masing-masing reuse 1 passage dari Fase 8).
- **Alasan:** Menyatukan Writing/Speaking ke dalam alur attempt bertimer
  tunggal yang sama butuh menggabungkan essay-writing/perekaman audio ke
  DALAM state machine Attempt yang sama — kerumitan tambahan signifikan
  (upload rekaman di tengah attempt, auto-submit yang juga harus
  menyimpan draft esai, dst.) untuk manfaat yang bisa dicapai lebih
  sederhana: Writing Lab (Fase 9) dan Speaking Lab (Fase 10) SUDAH
  menyediakan latihan bertimer per-task untuk kedua skill ini secara
  independen. `calculateOverallBand()` (lib/scoring/overall-band.ts)
  dibangun generik dan diuji penuh terhadap 4 angka band APAPUN sumbernya,
  supaya siap dipakai begitu alur full mock 4-skill benar-benar dibangun
  (bukan dipaksakan sekarang) — lihat docs/SCORING.md §4.
- **Keputusan (deadline server-side):** `Attempt.deadlineAt` dihitung SEKALI
  saat attempt dibuat (`startedAt + blueprint.totalSeconds`) dan menjadi
  SATU-SATUNYA sumber kebenaran untuk auto-submit. Client punya timer
  tampilannya sendiri (`setInterval` menghitung mundur dari `deadlineAt`),
  tapi SETIAP entry point server (`getAttemptStateAction`,
  `saveAnswerAction`, `submitAttemptAction`) memanggil
  `finalizeIfExpired()` lebih dulu — kalau waktu client berbeda, koneksi
  terputus lama, atau tab ditutup sampai lewat deadline, request
  BERIKUTNYA yang menyentuh attempt itu (termasuk sekadar me-reload
  halaman) otomatis men-finalize-nya. Diverifikasi end-to-end lewat
  `e2e/tryout.spec.ts`: deadline dipaksa ke masa lalu langsung lewat
  Prisma, lalu `page.reload()` terbukti memicu auto-submit tanpa timer
  client pernah berjalan sampai nol.
- **Keputusan (admin "test builder" ditunda):** Master Prompt sendiri
  menugaskan "test builder dan blueprint tryout" ke Fase 13 CMS. Fase ini
  karena itu men-seed `TestBlueprint`/`MockTest`/`MockTestSection` lewat
  `content/tryout/*.json` + pipeline import yang sama seperti tipe konten
  lain (bukan UI buatan admin dari nol), dan `/admin/content` hanya
  memberi alur editorial DRAFT→PUBLISHED yang sama seperti tipe konten
  lain (baca-saja untuk struktur section, bisa transisi status). Ini
  konsisten dengan apa yang Master Prompt sendiri minta per fase, bukan
  penyederhanaan sepihak.
- **Soal yang salah di Tryout tetap masuk Buku Kesalahan** — `AttemptSource`
  mendapat nilai baru `TRYOUT`, memakai `recordQuestionAttempt()` yang
  sama persis dipakai Listening/Reading Lab (D-030/D-034 lineage), bukan
  logic grading baru. `timeSpentMs` diisi 0 untuk setiap soal karena
  Tryout memakai SATU timer berkelanjutan untuk seluruh test (bukan
  per-soal) — lihat docs/SCORING.md §4 untuk kenapa ini diterima sebagai
  keterbatasan jujur, bukan angka yang dipalsukan.
- **Tidak ada review per-soal (explanation/evidence) di hasil Tryout** —
  berbeda dari mode latihan Listening/Reading Lab. Hasil Tryout hanya
  menampilkan raw score, estimasi band, akurasi per tipe soal, waktu
  dipakai, dan topik lemah — meniru bagaimana skor IELTS asli bekerja
  (dapat skor, bukan kunci jawaban per soal). Pengguna yang ingin
  penjelasan per soal diarahkan kembali ke Listening/Reading Lab.
- **Tinjau ulang:** Begitu Fase 13 membangun test builder admin yang
  sesungguhnya, decision di atas tentang seeding lewat `content/tryout/`
  tetap valid sebagai MEKANISME IMPORT (admin builder bisa menulis ke
  tabel yang sama), tapi UI pembuatan blueprint dari nol pindah ke admin.
  Begitu Writing/Speaking punya skor numerik (butuh AI scoring yang belum
  ada kredensialnya — lihat D-035/D-037), full mock 4-skill jadi masuk akal
  untuk dibangun memakai `calculateOverallBand()` yang sudah siap.

## Fase 12

### D-039: XP/streak dihitung live dari data asli (bukan counter tersimpan); achievement di-upsert bukan dihapus-buat-ulang; reminder email dipicu kunjungan dashboard (bukan background scheduler)

- **Keputusan (XP & streak live, tanpa model baru):** Tidak ada model
  `Streak` atau kolom `xp` yang tersimpan sebagai angka mutable. Keduanya
  dihitung ULANG setiap kali dibutuhkan langsung dari tabel aktivitas asli
  (`QuestionAttempt`, `LessonProgress`, `WritingSubmission`,
  `SpeakingSubmission`, `Attempt`) lewat `lib/gamification/streak.ts`
  (`computeStreak`, murni/pure) dan `lib/gamification/xp.ts`
  (`computeXp`/`computeLevel`, murni/pure), dengan
  `lib/gamification/data.ts` sebagai lapisan query server-only yang
  memberi makan kedua fungsi murni itu.
- **Alasan:** "XP, level, achievement dan streak boleh dipakai untuk
  motivasi, bukan menggantikan kualitas belajar... tidak manipulatif"
  (Master Prompt §8.3/§8.11). Counter mutable yang di-increment di banyak
  tempat berbeda (setiap lab, setiap jenis submission) adalah SUMBER BUG
  YANG SUDAH TERBUKTI BERULANG KALI di sesi ini (lihat D-028: antrean yang
  tidak sinkron dengan data server). Menghitung live dari sumber asli
  berarti angka yang ditampilkan SELALU benar per definisi — tidak ada
  kelas bug "lupa update counter di satu tempat" yang mungkin terjadi.
  Trade-off yang diterima: lebih banyak query per kunjungan dashboard,
  yang pada skala aplikasi saat ini (early-stage, bukan high-traffic)
  bukan masalah nyata.
- **Bug ditemukan & diperbaiki sebelum commit:** Draft pertama
  `getUserXp()` menghitung `labAttemptsCompleted` dari jumlah
  `QuestionAttempt` ber-`source: LISTENING_PRACTICE/READING_PRACTICE`,
  PADAHAL `correctPracticeAnswers` (dihitung terpisah) SUDAH mencakup
  QuestionAttempt yang sama tanpa filter source — jawaban benar dari
  Listening/Reading Lab akan terhitung XP-nya DUA KALI. Ditemukan lewat
  tinjauan kode sendiri sebelum verifikasi visual (bukan oleh test),
  diperbaiki dengan `labAttemptsCompleted` hanya menghitung Writing/
  Speaking completions (free-response, tidak punya baris `QuestionAttempt`
  sama sekali, jadi tidak mungkin dobel-hitung).
- **Keputusan (Achievement tetap disimpan, upsert bukan hapus-buat-ulang):**
  Berbeda dari XP/streak, `UserAchievement` ADALAH baris tersimpan permanen
  — sebuah pencapaian yang sudah diraih tidak boleh hilang hanya karena
  pengguna berhenti melakukan aktivitas itu (streak 7 hari yang sudah
  pernah dicapai tetap jadi badge permanen walau streak saat ini sudah
  turun ke 0). `evaluateAndAwardAchievements()` aman dipanggil di setiap
  kunjungan dashboard (upsert, tidak pernah mencabut/menduplikasi).
  `prisma/seed.ts` men-seed katalog `Achievement` dengan upsert-by-code
  (BUKAN delete+recreate seperti `BandConversionTable` di D-037) karena
  `UserAchievement` punya foreign key sungguhan ke `Achievement.id` —
  delete+recreate akan men-cascade-hapus setiap badge yang sudah diraih
  siapa pun.
- **Keputusan (reminder email via kunjungan, bukan cron):** Tidak ada
  job-queue/scheduler di aplikasi ini. `maybeSendDailyReminder()`
  (`lib/gamification/reminders.ts`) memakai mailer yang sudah ada sejak
  Fase 1 (D-014 — kirim sungguhan jika SMTP terkonfigurasi, log saja jika
  tidak) tapi HANYA dipicu saat pengguna membuka `/dashboard`, dengan
  dedupe `lastReminderSentAt` (~20 jam) supaya tidak terkirim berkali-kali
  dalam sehari. Ini BUKAN notifikasi terjadwal sungguhan — pengguna yang
  tidak pernah membuka dashboard tidak akan menerima apa pun, berbeda dari
  cron job asli yang berjalan independen dari kunjungan. Didokumentasikan
  jujur, bukan diklaim sebagai "scheduled reminder". Banner in-app
  (`getDashboardNotifications()`) tidak punya keterbatasan ini karena
  memang hanya relevan saat halaman benar-benar dibuka.
- **Keputusan (leaderboard privasi-dulu):** `UserPreference.leaderboardOptIn`
  default `false`; `leaderboardAlias` adalah satu-satunya identitas yang
  pernah ditampilkan ke pengguna lain — nama asli dan email TIDAK PERNAH
  masuk ke query/response leaderboard (`lib/gamification/progress.ts`'s
  `getLeaderboard()` hanya men-select `preference.leaderboardAlias`, bukan
  `name`/`email`). Diverifikasi lewat E2E yang eksplisit mengecek email
  pengguna TIDAK muncul di halaman leaderboard.
- **Tinjau ulang:** `getLeaderboard()` menghitung XP untuk setiap peserta
  opt-in dengan query terpisah (N+1) — dapat diterima untuk jumlah
  pengguna opt-in saat ini, tapi layak dioptimalkan (agregasi SQL
  tunggal) jika basis pengguna bertambah signifikan.

## Fase 13

### D-040: Test builder, audit log, manajemen pengguna, dan laporan soal dibangun; manajemen kelas/penugasan dan discrimination index sengaja ditunda

- **Keputusan (yang dibangun):** Test builder admin (`/admin/test-builder`)
  — menuntaskan apa yang D-038 sengaja tunda: admin kini membuat
  `TestBlueprint`/`MockTest` dan menyusun `MockTestSection` dari passage
  Listening/Reading yang sudah PUBLISHED, lewat UI, bukan hanya lewat
  `content/tryout/*.json`. Publikasi tetap lewat alur editorial yang sama
  persis (`/admin/content/[code]`, DRAFT→IN_REVIEW→APPROVED→PUBLISHED) —
  test builder hanya menambah CARA MEMBUAT strukturnya, bukan jalur
  publikasi baru. `AuditLog` (append-only) mencatat setiap transisi status
  konten di SEMUA 6 tipe konten plus perubahan peran pengguna, section
  mock test, dan penyelesaian laporan soal — dilihat lewat
  `/admin/audit-log` (ADMIN-only). `/admin/users` (ADMIN-only) mengelola
  peran STUDENT/TEACHER/ADMIN — diverifikasi lewat E2E bahwa TEACHER
  ditolak akses (RBAC "least privilege" per Master Prompt §11: "guru
  tidak boleh otomatis mendapat akses admin penuh"). `QuestionReport` —
  tombol "Laporkan soal" di Reading/Listening Lab (komponen bersama, bukan
  diduplikasi), antrean di `/admin/question-reports` (ADMIN+TEACHER) untuk
  menyelesaikan/mengabaikan. `/admin/review-queue` — satu daftar lintas-tipe
  konten yang sedang IN_REVIEW, supaya reviewer tidak perlu membuka 6 kartu
  terpisah untuk tahu apa yang perlu ditinjau.
- **Keputusan (analitik soal, tanpa discrimination index):**
  `lib/analytics/question-stats.ts` menghitung facility (% benar), rata-rata
  waktu menjawab, dan jumlah laporan terbuka — langsung dari
  `QuestionAttempt`/`QuestionReport` asli, tidak ada tabel analitik
  terpisah. Discrimination index (korelasi performa soal dengan skor total
  kelompok atas/bawah) SENGAJA TIDAK dihitung — butuh volume data attempt
  skala produksi nyata untuk bermakna secara statistik; menghitungnya dari
  data uji coba kecil saat ini akan menghasilkan angka yang terlihat
  presisi tapi sebenarnya tidak berarti apa-apa, bertentangan dengan
  prinsip "jangan menampilkan estimasi palsu" yang dipegang sejak Fase 1.
  Master Prompt §11 sendiri mensyaratkan ini "bila volume data mencukupi"
  — syarat itu belum terpenuhi.
- **Keputusan (manajemen kelas/penugasan DITUNDA, bukan dibangun sebagian):**
  "Assignment untuk kelas dan teacher review queue" dari Master Prompt
  §11 punya DUA bagian berbeda: teacher review queue SUDAH dibangun
  (`/admin/review-queue`, lihat di atas), tapi "kelas" (Class/Enrollment/
  Assignment pengajar-ke-siswa) TIDAK dibangun sama sekali. Tidak ada
  fondasi apa pun untuk konsep ini di 12 fase sebelumnya (tidak ada model
  `Class`, tidak ada relasi guru-siswa, tidak ada UI pendaftaran) — ini
  murni fitur institusional/B2B yang baru bermakna begitu ada sinyal
  permintaan nyata dari pengguna guru sungguhan, berbeda dari fitur lain
  di fase ini yang semuanya punya fondasi data nyata untuk langsung
  dibangun dengan rigor penuh. Membangun separuh (misalnya hanya model
  tanpa UI, atau UI tanpa alur penugasan yang benar-benar dipakai) akan
  melanggar instruksi "no half-finished implementations" — lebih jujur
  ditunda utuh dan didokumentasikan di sini daripada dipaksakan dangkal.
- **Tinjau ulang:** Begitu ada kebutuhan guru mengelola kelas sungguhan,
  fitur ini butuh fase tersendiri dengan model data yang dipikirkan dari
  awal (Class, Enrollment, Assignment, mungkin ClassInvitation) — bukan
  tempelan di fase ini. Discrimination index layak dihitung ulang begitu
  volume `QuestionAttempt` per soal cukup besar (Master Prompt sendiri
  tidak memberi angka pasti — perlu penilaian praktis saat datanya ada).

## Fase 14

### D-041: Info IELTS dipindah ke luar `(app)` agar benar-benar publik; `proxy.ts` ternyata butuh diupdate terpisah dari struktur route

- **Keputusan:** Halaman `/info-ielts` (Master Prompt §16: panduan IELTS
  independen — format, cara penilaian, kalkulator overall band, FAQ,
  glosarium, tautan resmi) dipindah dari stub `app/(app)/info-ielts/page.tsx`
  (yang mewarisi `requireUser()` dari layout grup `(app)`) ke
  `app/info-ielts/page.tsx` di root `app/`, di luar grup route mana pun,
  supaya pengunjung anonim dan crawler bisa mengaksesnya. Header halaman
  pakai `getSession()` (bukan `requireUser()`) untuk CTA yang sadar-auth
  tanpa memaksa login. `BandCalculator` memakai ulang
  `calculateOverallBand()` dari `lib/scoring/overall-band.ts` (Fase 11) di
  sisi klien murni — fungsi itu sudah tanpa import `server-only` sejak
  awal, jadi tidak perlu round-trip server untuk sekadar menerapkan rumus
  pembulatan resmi ke empat angka yang sudah diketahui pengguna. Lima
  tautan resmi (`OfficialResource`, model baru) di-seed dengan URL nyata
  (ielts.org, takeielts.britishcouncil.org) dan `verifiedAt` yang
  sungguh-sungguh diverifikasi lewat WebSearch, bukan ditebak — konsisten
  dengan `BandConversionTable` di Fase 11. `app/sitemap.ts` dan
  `app/robots.ts` ditambahkan mengikuti konvensi file Next.js, hanya
  mendaftarkan 4 rute yang genuinely publik (`/`, `/info-ielts`, `/login`,
  `/register`) — bukan men-generate ribuan halaman tipis.
- **Bug yang ditemukan lewat E2E, bukan lewat manual check (penting untuk
  dicatat karena hampir lolos):** Setelah memindah halaman keluar dari
  `(app)`, E2E awal (`e2e/info-ielts.spec.ts`) tetap gagal — `/info-ielts`
  DAN `/sitemap.xml` sama-sama di-redirect ke `/login?callbackUrl=...`.
  Root cause BUKAN di struktur route sama sekali: Next.js 16 mengganti
  konvensi `middleware.ts` menjadi `proxy.ts` (nama file berbeda, perilaku
  sama), dan `proxy.ts` proyek ini punya `PUBLIC_PATHS` sendiri yang
  independen dari struktur folder `app/` — pathname yang tidak ada di
  daftar itu otomatis di-redirect ke login oleh matcher `proxy.ts`,
  terlepas dari apakah route-nya ada di grup `(app)` atau tidak. Memindah
  sebuah page keluar dari grup `(app)` menghapus ketergantungannya pada
  `requireUser()` di layout, tapi TIDAK otomatis mendaftarkannya sebagai
  publik di `proxy.ts` — dua mekanisme gating yang terpisah dan harus
  disinkronkan manual. Diperbaiki dengan menambah `/info-ielts`,
  `/sitemap.xml`, `/robots.txt` ke `PUBLIC_PATHS`. Dua bug lanjutan di
  spec-nya sendiri (bukan di aplikasi) juga ditemukan dan diperbaiki:
  `getByText` tanpa `.first()` kena strict-mode violation karena
  `<Disclaimer />` memang sengaja dirender dua kali (atas & bawah
  halaman), dan assertion hasil kalkulator (`getByText("6.5")`) kena
  strict-mode violation karena Base UI `Select` tetap merender opsi
  dropdown yang tertutup ke DOM — diperbaiki dengan scoping
  (`.first()`) dan `data-testid="band-calculator-result"` yang lebih
  presisi daripada pencocokan teks umum.
- **Alternatif dipertimbangkan:** Menjadikan `(app)` grup opt-in per
  halaman (mis. flag `public: true` di layout) — ditolak, terlalu banyak
  perubahan arsitektur untuk satu halaman publik; pola route-group yang
  ada (publik di root, privat di `(app)`) sudah konsisten dipakai sejak
  landing page Fase 1, jadi mengikuti pola itu lebih sederhana daripada
  menciptakan mekanisme baru.
- **Tinjau ulang:** Setiap halaman publik baru di masa depan WAJIB dicek
  terhadap DUA tempat, bukan satu: (1) di luar grup `(app)`/`(admin)` di
  struktur `app/`, DAN (2) ditambahkan ke `PUBLIC_PATHS` di `proxy.ts`.
  Lupa salah satu akan lolos type-check dan lint tapi gagal diam-diam di
  E2E atau production — seperti yang terjadi di fase ini.

## Fase 15

### D-042: PWA (manifest + service worker terbatas), analitik first-party, dan kontrol privasi dibangun — tapi prosesnya menemukan dan memperbaiki regresi nyata pada mekanisme sign-out

- **Keputusan (PWA, lingkup sengaja dipersempit):** `app/manifest.ts` +
  `app/icon-192/route.tsx`/`app/icon-512/route.tsx` (ikon PNG asli
  dirender saat request lewat `next/og`'s `ImageResponse`, bukan file
  placeholder) membuat aplikasi installable. `public/sw.js` HANYA
  meng-cache shell publik (`/`, `/info-ielts`, `/privasi`, `/login`,
  `/register`, `/offline`) plus aset statis `_next/static/*` yang sudah
  content-hashed — SENGAJA TIDAK meng-cache dashboard, Lab manapun,
  Tryout, admin, atau `/api/*` sama sekali: Tryout mengandalkan
  `deadlineAt` server-authoritative (D-038), dan dashboard/submission yang
  stale justru menyesatkan, bukan membantu. Ini "installable + fallback
  offline yang jujur untuk shell publik", bukan offline-first penuh —
  Master Prompt tidak mensyaratkan lebih dari itu dan membangun lebih
  jauh akan melanggar prinsip "jangan setengah-matang".
- **Keputusan (analitik first-party, bukan Google Analytics/dsb.):**
  `AnalyticsEvent` (model baru) mencatat page view anonim —
  `anonymousId` di localStorage klien (bukan cookie lintas situs), tanpa
  IP/user agent, tanpa script pihak ketiga. Dua opt-out dihormati sebelum
  menulis apa pun: header `DNT: 1`, dan (untuk pengguna login)
  `UserPreference.analyticsOptOut` (toggle baru di `/profil`, default
  tracking AKTIF/opt-out false — didokumentasikan jujur di `/privasi`,
  bukan disembunyikan). `/admin/analytics` (ADMIN-only) menampilkan
  agregat asli (`lib/analytics/stats.ts`): total page view, pengunjung
  unik, tren 14 hari, halaman teratas — dengan honest-empty-state saat
  datanya nol, konsisten dengan dashboard Fase 12.
- **Keputusan (privasi, bukan sekadar teks kebijakan):** `/privasi`
  (halaman publik, paralel strukturnya dengan `/info-ielts`) menjelaskan
  data apa yang dikumpulkan, berapa lama, dan hak pengguna. Fitur
  substantifnya: "Hapus Akun" di `/profil` benar-benar menghapus baris
  `User` (bukan soft-delete kosmetik) — relasi `createdBy`/`reviewedBy` ke
  konten (Lesson/Question/dst.) sengaja TIDAK punya `onDelete`, jadi
  Postgres menolak penghapusan ADMIN/TEACHER yang masih punya konten,
  dengan pesan jelas, bukan crash. `AnalyticsEvent.userId` pakai
  `onDelete: SetNull` (dianonimkan, bukan ikut terhapus) supaya statistik
  agregat tetap akurat untuk pengguna lain.
- **Temuan penting — bug asli, bukan flake, ditemukan oleh scan aksesibilitas
  otomatis:** `e2e/accessibility.spec.ts` (axe-core, WCAG 2 A/AA, baru di
  fase ini) menemukan `--brand-teal` (`#14968c`) hanya mencapai kontras
  3.63:1 terhadap putih — di bawah ambang AA 4.5:1 untuk teks normal —
  pada teks logo "IELTS" yang tampil di SETIAP halaman. Diperbaiki di
  level token (`#0b756c`, ~5.56:1 di kedua arah: teks-di-atas-putih DAN
  putih-di-atas-teal), bukan ditambal di satu komponen, supaya semua
  pemakaian `text-brand-teal`/`bg-brand-teal` ikut benar. Scan yang sama
  juga menemukan `BandCalculator`'s `<Label>` tidak pernah di-`htmlFor`-kan
  ke `SelectTrigger`-nya (combobox tanpa accessible name) — diperbaiki
  dengan `id`/`htmlFor` yang konsisten, pola yang sudah dipakai di
  `notification-settings-form.tsx`.
- **Temuan paling signifikan — regresi nyata pada race sign-out yang sudah
  terdokumentasi (D-036), ditemukan lewat pengukuran empiris berulang,
  bukan tebakan:** Setelah menambahkan `<PageViewTracker />` (mount di
  root layout, fire di setiap navigasi), `e2e/auth.spec.ts`'s uji
  sign-out — yang D-036 sudah mendokumentasikan sebagai race ~10% yang
  diterima — tiba-tiba gagal ~60-87% pada run berulang. Investigasi awal
  salah menebak akar masalah dua kali (Server Action analitik lewat
  `proxy.ts`; auto-fetch `manifest.webmanifest` lewat `proxy.ts`) — kedua
  perbaikan itu diterapkan DAN diuji ulang secara empiris, dan TIDAK
  memperbaiki rate-nya, membuktikan hipotesis itu salah. Akar masalah
  sebenarnya ditemukan dengan metode yang sama seperti D-036: `git
  worktree` dibuat dari commit Fase 14 (sebelum fase ini) sebagai
  baseline bersih (~25%, cocok dengan D-036), lalu skrip Playwright
  sekali-pakai yang mereplikasi persis urutan `e2e/auth.spec.ts` (tanpa
  jeda buatan) mencatat SETIAP request/response di sekitar momen
  sign-out. Akar masalahnya: `SignOutButton` memanggil `signOutAction()`
  sebagai Server Action — dan Server Action melakukan POST ke rute
  HALAMAN SAAT INI (`/dashboard`, karena di situ tombolnya diklik), bukan
  ke endpoint terpisah. Karena action itu tidak pernah memanggil
  `redirect()`, Next.js secara otomatis me-render-ulang Server Component
  `/dashboard` sebagai bagian dari respons YANG SAMA — memakai cookies
  dari AWAL request (sebelum `signOut()` sempat membersihkannya) —
  sehingga satu respons HTTP yang sama berisi DUA instruksi `Set-Cookie`
  yang berlawanan: satu yang membersihkan sesi dari `signOut()`, satu lagi
  yang menegaskan ulang sesi lama dari re-render otomatis itu. Browser
  mengikuti yang terakhir, sehingga sesi "dihidupkan kembali" dari SATU
  request, bukan dari dua request terpisah seperti dugaan D-036
  sebelumnya. `deleteAccountAction` (fase ini, baru dibuat) punya pola
  identik dan rentan bug yang sama.
- **Perbaikan:** `signOutAction`/`deleteAccountAction` (Server Action)
  diganti jadi Route Handler murni — `app/api/auth-signout/route.ts` dan
  `app/api/account/delete/route.ts` — dipanggil lewat `fetch()` biasa dari
  `SignOutButton`/`DeleteAccountButton`. Route Handler tidak punya
  mekanisme "auto re-render rute saat ini" sama sekali, jadi tidak ada
  lagi dua `Set-Cookie` yang berebutan. Diverifikasi empiris (bukan
  diasumsikan): rate gagal turun dari ~60-87% ke ~30% dalam 10 run
  berulang — cocok secara statistik dengan baseline bersih (~25%),
  mengonfirmasi perbaikan ini menghilangkan regresi yang ditambahkan fase
  ini, mengembalikannya ke tingkat race D-036 yang sudah diterima dan
  didokumentasikan (bukan menciptakan race baru, dan bukan juga berhasil
  menghilangkan race asli D-036 — itu tetap ditunda ke Fase 17 seperti
  semula). `lib/auth/sign-out.ts` (Server Action lama) dihapus karena
  sudah tidak dipakai di mana pun.
- **Pelajaran untuk versi mendatang:** Server Action yang (a) mengubah
  state autentikasi (sign-out, sign-in, hapus akun) DAN (b) dipanggil dari
  halaman yang butuh sesi aktif DAN (c) tidak memanggil `redirect()` di
  dalamnya, berisiko pada masalah persis ini — Next.js akan me-render-ulang
  halaman saat ini dengan cookies lama sebagai bagian dari respons yang
  sama. Pola aman yang sudah ada di proyek ini untuk endpoint ber-sesi
  tanpa render ulang halaman (lihat `app/api/speaking-recordings/[id]/route.ts`)
  adalah Route Handler + `getSession()` + respons JSON manual — bukan
  Server Action — dan sekarang dipakai konsisten untuk SEMUA aksi yang
  mengubah status autentikasi, tidak hanya untuk operasi baca/tulis data.
- **Tinjau ulang:** Jika Fase 17 (keamanan/deployment) membangun
  token-revocation sisi server, race D-036 yang tersisa (~25%) baru benar-
  benar bisa dihilangkan, bukan hanya dikurangi.
