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

### D-009: Hanya "Beranda" punya halaman nyata di Fase 0; 15 menu lain pakai stub "segera tersedia"

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
