import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth/password";
import { ACHIEVEMENT_CATALOG } from "../lib/gamification/catalog";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("[seed] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin seed.");
  } else {
    const passwordHash = await hashPassword(password);

    const admin = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "ADMIN" },
      create: {
        email,
        name: "Admin Success IELTS",
        passwordHash,
        role: "ADMIN",
        emailVerified: new Date(),
        preference: { create: {} },
      },
    });

    console.log(`[seed] Admin user ready: ${admin.email} (${admin.id})`);
  }

  await seedBandConversionTable();
  await seedAchievementCatalog();
}

/** Upsert by code, never delete+recreate — unlike BandConversionTable,
 * `UserAchievement` rows hold a real foreign key to `Achievement.id`, so
 * re-seeding must never orphan/cascade-delete a badge someone already
 * earned. */
async function seedAchievementCatalog() {
  for (const a of ACHIEVEMENT_CATALOG) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: { title: a.title, description: a.description, icon: a.icon },
      create: a,
    });
  }
  console.log(`[seed] Achievement catalog ready: ${ACHIEVEMENT_CATALOG.length} badges.`);
}

/**
 * IELTS does not publish one single official raw-to-band table (the exact
 * mapping can vary slightly between test versions) — Master Prompt
 * §8.9/§13 explicitly forbids hardcoding a conversion as a constant in app
 * logic for this reason, so `rawToBand()` (lib/scoring/raw-to-band.ts)
 * always reads these rows from the database instead. The figures below are
 * cross-referenced from IDP's own published tables (IDP is one of the
 * three organisations — with the British Council and Cambridge Assessment
 * English — that jointly own and administer IELTS), re-verified today.
 * Low raw scores below what's listed here intentionally have no row: the
 * cited sources don't cover them with confidence, and `rawToBand()`
 * returning "no table" for those is the honest Master-Prompt-mandated
 * fallback (show the raw score only) rather than a guessed figure.
 *
 * Re-running this seed replaces the whole table (delete + recreate) —
 * nothing else holds a foreign key to these rows; Attempt results store a
 * resolved band number, not a reference back to this table.
 */
async function seedBandConversionTable() {
  const LISTENING_VERIFIED_AT = new Date("2026-10-19");
  const LISTENING_SOURCE_URL = "https://ielts.idp.com/vietnam/results/scores/listening";
  const READING_VERIFIED_AT = new Date("2026-10-19");
  const READING_SOURCE_URL = "https://ielts.idp.com/egypt/results/scores/reading";

  const listeningRows = [
    { minRaw: 39, maxRaw: 40, band: 9.0 },
    { minRaw: 37, maxRaw: 38, band: 8.5 },
    { minRaw: 35, maxRaw: 36, band: 8.0 },
    { minRaw: 32, maxRaw: 34, band: 7.5 },
    { minRaw: 30, maxRaw: 31, band: 7.0 },
    { minRaw: 26, maxRaw: 29, band: 6.5 },
    { minRaw: 23, maxRaw: 25, band: 6.0 },
    { minRaw: 18, maxRaw: 22, band: 5.5 },
    { minRaw: 16, maxRaw: 17, band: 5.0 },
    { minRaw: 13, maxRaw: 15, band: 4.5 },
    { minRaw: 11, maxRaw: 12, band: 4.0 },
  ];

  const academicReadingRows = [
    { minRaw: 39, maxRaw: 40, band: 9.0 },
    { minRaw: 37, maxRaw: 38, band: 8.5 },
    { minRaw: 35, maxRaw: 36, band: 8.0 },
    { minRaw: 33, maxRaw: 34, band: 7.5 },
    { minRaw: 30, maxRaw: 32, band: 7.0 },
    { minRaw: 27, maxRaw: 29, band: 6.5 },
    { minRaw: 23, maxRaw: 26, band: 6.0 },
    { minRaw: 19, maxRaw: 22, band: 5.5 },
    { minRaw: 15, maxRaw: 18, band: 5.0 },
    { minRaw: 13, maxRaw: 14, band: 4.5 },
    { minRaw: 10, maxRaw: 12, band: 4.0 },
  ];

  const generalTrainingReadingRows = [
    { minRaw: 40, maxRaw: 40, band: 9.0 },
    { minRaw: 39, maxRaw: 39, band: 8.5 },
    { minRaw: 37, maxRaw: 38, band: 8.0 },
    { minRaw: 36, maxRaw: 36, band: 7.5 },
    { minRaw: 34, maxRaw: 35, band: 7.0 },
    { minRaw: 32, maxRaw: 33, band: 6.5 },
    { minRaw: 30, maxRaw: 31, band: 6.0 },
    { minRaw: 27, maxRaw: 29, band: 5.5 },
    { minRaw: 23, maxRaw: 26, band: 5.0 },
    { minRaw: 19, maxRaw: 22, band: 4.5 },
    { minRaw: 15, maxRaw: 18, band: 4.0 },
  ];

  await prisma.bandConversionTable.deleteMany({});
  await prisma.bandConversionTable.createMany({
    data: [
      // Listening is identical for Academic and General Training.
      ...listeningRows.map((r) => ({
        ...r,
        examType: "ACADEMIC" as const,
        section: "LISTENING" as const,
        sourceUrl: LISTENING_SOURCE_URL,
        verifiedAt: LISTENING_VERIFIED_AT,
        notes: "Sama untuk Academic dan General Training.",
      })),
      ...listeningRows.map((r) => ({
        ...r,
        examType: "GENERAL_TRAINING" as const,
        section: "LISTENING" as const,
        sourceUrl: LISTENING_SOURCE_URL,
        verifiedAt: LISTENING_VERIFIED_AT,
        notes: "Sama untuk Academic dan General Training.",
      })),
      ...academicReadingRows.map((r) => ({
        ...r,
        examType: "ACADEMIC" as const,
        section: "READING" as const,
        sourceUrl: READING_SOURCE_URL,
        verifiedAt: READING_VERIFIED_AT,
        notes: null,
      })),
      ...generalTrainingReadingRows.map((r) => ({
        ...r,
        examType: "GENERAL_TRAINING" as const,
        section: "READING" as const,
        sourceUrl: READING_SOURCE_URL,
        verifiedAt: READING_VERIFIED_AT,
        notes: null,
      })),
    ],
  });

  console.log(
    `[seed] Band conversion table ready: ${listeningRows.length * 2 + academicReadingRows.length + generalTrainingReadingRows.length} rows.`,
  );
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
