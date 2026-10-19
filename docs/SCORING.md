# Scoring — Success IELTS

Dibangun Fase 11 per Master Prompt §8.9/§13: "Semua fungsi scoring harus terpisah,
terdokumentasi, deterministik bila relevan, dan diberi unit test." Dokumen ini
mencakup definisi, rumus, sumber, asumsi, keterbatasan, dan test case untuk setiap
fungsi scoring di aplikasi.

## 1. Prinsip umum

- **Tidak ada angka konversi yang di-hardcode sebagai konstanta permanen di kode
  aplikasi.** Raw-score-ke-band SELALU dibaca dari tabel aktif di database
  (`BandConversionTable`), bukan dipasang langsung di `lib/scoring/`.
- **Setiap estimasi band ditampilkan dengan disclaimer** bahwa itu estimasi untuk
  pembelajaran, bukan skor resmi IELTS (lihat disclaimer wajib di Master Prompt §2,
  sudah diimplementasikan di `components/content/disclaimer.tsx` sejak Fase 0/1).
- **Diagnostic test dan Grammar Practice TIDAK dipakai sebagai overall IELTS band**
  (Master Prompt §8.9's catatan eksplisit) — hanya hasil Tryout (mock
  test/sectional test resmi lewat `Attempt`) yang menghasilkan estimasi band.

## 2. Raw score → band (Listening, Reading)

`lib/scoring/raw-to-band.ts` — `rawToBand(rawScore, section, examType)`.

### 2.1 Kenapa tidak ada "tabel resmi" yang presisi

IELTS (ielts.org) **tidak mempublikasikan satu tabel konversi raw-to-band tunggal
yang presisi dan berlaku universal** — pemetaan raw score ke band bisa berbeda
sedikit antar versi tes (kalibrasi statistik per paket soal). Ini bukan kelalaian
sumber data; ini memang bagaimana IELTS mendesain sistem skornya. Karena itu Master
Prompt eksplisit melarang "mengunci" angka konversi sebagai fakta presisi dan
meminta menyimpan `sourceUrl`/`verifiedAt` per baris tabel.

### 2.2 Sumber yang dipakai

Data di-cross-reference dari halaman resmi **IDP** — salah satu dari tiga organisasi
(bersama British Council dan Cambridge Assessment English) yang memiliki dan
menyelenggarakan IELTS secara bersama — bukan blog pihak ketiga yang tidak
terverifikasi:

- **Listening** (sama untuk Academic & General Training):
  <https://ielts.idp.com/vietnam/results/scores/listening> (versi half-band),
  diverifikasi 2026-10-19.
- **Reading** (Academic dan General Training berbeda tabel):
  <https://ielts.idp.com/egypt/results/scores/reading>, diverifikasi 2026-10-19.

Baris lengkap ada di `prisma/seed.ts` (`seedBandConversionTable()`) dan dibaca
langsung dari tabel `band_conversion_table` saat runtime — **bukan** dari dokumen
ini atau dari kode `lib/scoring/`.

### 2.3 Keterbatasan yang diterima secara sadar

- **Raw score rendah tidak punya baris** (di bawah ~band 4) karena sumber yang
  dikutip tidak mencakupnya dengan keyakinan yang sama seperti baris band 4+.
  `rawToBand()` mengembalikan `{ band: null, reason: "no_conversion_table" }` untuk
  kasus ini — UI menampilkan **raw score saja**, bukan menebak band-nya. Ini persis
  mengikuti instruksi Master Prompt: _"Jika sumber tidak mendukung konversi
  presisi, gunakan rentang estimasi atau tampilkan raw score saja."_
- Sumber sendiri mencatat variasi ±1 raw score antar versi tes adalah hal normal.
  Band yang ditampilkan selalu berlabel "estimasi".
- Writing dan Speaking **tidak punya raw score** sama sekali (dinilai langsung
  lewat kriteria/rubrik oleh examiner resmi, bukan dihitung dari jumlah benar) —
  `rawToBand()` hanya berlaku untuk `section: LISTENING | READING`. Di aplikasi
  ini, Writing/Speaking Lab (Fase 9/10) memakai self-assessment checklist, bukan
  skor numerik otomatis (lihat D-035, D-037) — jadi tidak ada "raw-to-band" untuk
  dikonversi untuk kedua skill ini.

## 3. Overall band (rata-rata 4 skill)

`lib/scoring/overall-band.ts` — `calculateOverallBand([listening, reading, writing, speaking])`.

### 3.1 Aturan resmi

Sumber: **ielts.org**, "How IELTS is scored" / "IELTS scoring in detail"
(<https://ielts.org/for-test-takers/how-ielts-is-scored> dan
<https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail>), diverifikasi
2026-10-19. Overall band score adalah **rata-rata dari empat skill band**, dengan
aturan pembulatan:

- Jika rata-rata berakhiran **.25** → dibulatkan **naik** ke half band berikutnya
  (contoh resmi: 6.25 → 6.5).
- Jika rata-rata berakhiran **.75** → dibulatkan **naik** ke whole band berikutnya
  (contoh resmi: 6.75 → 7.0).
- Sisa kasus lain (rata-rata berakhiran .125/.375/.625/.875) dibulatkan ke half
  band terdekat secara normal (contoh resmi dari ielts.org: 6.125 → 6.0).

### 3.2 Implementasi

Aturan di atas **setara penuh** dengan "bulatkan rata-rata ke grid 0.5 terdekat,
dengan titik tengah .25/.75 dibulatkan ke atas" — yaitu _round-half-up_ standar
pada grid 0.5. Diimplementasikan dalam unit "setengah-band" berupa integer
(`band * 2`) di sepanjang perhitungan, baru dibagi 2 di langkah terakhir, supaya
tidak terpengaruh floating-point error pada nilai seperti 0.25.

### 3.3 Test case (lihat `tests/unit/overall-band.test.ts`)

| Input (L, R, W, S)      | Rata-rata | Hasil resmi | Diverifikasi     |
| ----------------------- | --------- | ----------- | ---------------- |
| 6, 6, 6.5, 6.5          | 6.25      | 6.5         | ielts.org        |
| 6.5, 7, 7, 6.5          | 6.75      | 7.0         | ielts.org        |
| 6, 6, 6, 6.5            | 6.125     | 6.0         | ielts.org        |
| 7, 7, 7, 7              | 7.0       | 7.0         | trivial          |
| 0, 0, 0, 0 / 9, 9, 9, 9 | 0 / 9     | 0 / 9       | batas bawah/atas |

## 4. Hasil Tryout (Attempt)

Satu `Attempt` (lihat `docs/ARCHITECTURE.md` §16) menghasilkan, saat submit
(manual atau auto-submit):

- `rawScore` / `maxRawScore` — jumlah jawaban benar dari `gradeAnswer()` (fungsi
  grading yang sama dipakai sejak Fase 3, tidak ada logika grading baru).
- `band` — hasil `rawToBand(rawScore, blueprint.skill, blueprint.examType)`, bisa
  `null` jika raw score di luar cakupan tabel (lihat §2.3).
- `accuracyByType` — akurasi dikelompokkan per `QuestionType`.
- `timeUsedSeconds` — `min(now, deadlineAt) - startedAt`, dibatasi `deadlineAt`
  supaya auto-submit yang terlambat diproses tidak melaporkan waktu lebih dari
  durasi blueprint.
- `weakTopics` — topik (dari `Question.topics`) dengan proporsi salah tertinggi di
  attempt ini, dipakai untuk rekomendasi lesson.

Karena setiap `MockTest` yang di-seed di fase ini hanya mencakup **satu skill**
(LISTENING atau READING — lihat D-038), `Attempt` saat ini TIDAK menghasilkan
overall band 4-skill secara otomatis; `calculateOverallBand()` tersedia dan diuji
penuh untuk dipakai begitu alur full mock test 4-skill dibangun (di luar cakupan
fase ini, lihat D-038).

## 5. Keterbatasan fase ini (ringkasan)

- Tidak ada "Full Mock Test" 4-skill gabungan — hanya sectional/mini-mock
  Listening dan Reading. Lihat D-038.
- `BandConversionTable` diisi lewat `prisma/seed.ts`, bukan lewat UI admin
  penuh — "test builder" admin ada di cakupan Fase 13.
