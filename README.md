# Success IELTS

Platform belajar dan latihan IELTS komprehensif dari dasar hingga mahir.
_Learn Smart. Practice with Purpose. Achieve Your IELTS Goal._

> Status saat ini: **Fase 0 — fondasi**. Lihat `docs/ARCHITECTURE.md` dan
> `CHANGELOG.md` untuk apa yang sudah dan belum dibangun.

## Menjalankan secara lokal

Prasyarat: Node.js 24+, npm 11+.

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

> **Jaringan korporat / TLS inspection:** jika `npm install` atau `npx` gagal dengan
> `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, set `NODE_OPTIONS=--use-system-ca` sebelum
> menjalankan perintah npm (lihat `docs/DECISIONS.md` D-007).
>
> ```bash
> # PowerShell
> $env:NODE_OPTIONS = "--use-system-ca"
> # bash
> export NODE_OPTIONS="--use-system-ca"
> ```

## Skrip yang tersedia

| Perintah                          | Kegunaan                                             |
| --------------------------------- | ---------------------------------------------------- |
| `npm run dev`                     | Server development di port 3000                      |
| `npm run build`                   | Build production                                     |
| `npm run start`                   | Jalankan hasil build                                 |
| `npm run lint`                    | ESLint                                               |
| `npm run typecheck`               | `tsc --noEmit`                                       |
| `npm run format` / `format:check` | Prettier (dengan plugin Tailwind)                    |
| `npm run test`                    | Unit test (Vitest)                                   |
| `npm run test:watch`              | Vitest mode watch                                    |
| `npm run test:e2e`                | Playwright E2E (build + start otomatis di port 3100) |

## Dokumentasi

- `docs/ARCHITECTURE.md` — stack, struktur folder, design tokens, i18n.
- `docs/DECISIONS.md` — keputusan teknis dan alasannya per fase.
- `CHANGELOG.md` — riwayat perubahan per fase.
