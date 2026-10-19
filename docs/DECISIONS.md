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
