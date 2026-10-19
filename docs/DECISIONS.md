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
  + kolom `role` pada `User`, bukan tabel relasi many-to-many terpisah.
- **Alasan:** Tiga peran tetap dan saling eksklusif (satu pengguna = satu
  peran) sesuai seluruh penjelasan RBAC di Master Prompt; tabel `Role`
  terpisah hanya diperlukan untuk multi-role-per-user atau peran dinamis yang
  dikonfigurasi admin, yang tidak diminta.
- **Tinjau ulang:** Jika kebutuhan multi-role-per-user atau peran kustom
  muncul (mis. "guru sekaligus admin kelas tertentu"), migrasi ke tabel relasi.

### D-017: Hanya "Beranda" punya halaman nyata di Fase 0; 15 menu lain pakai stub "segera tersedia"

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
