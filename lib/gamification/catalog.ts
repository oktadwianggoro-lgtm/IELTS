/**
 * Plain data, no server-only import — needs to be importable from
 * prisma/seed.ts (run via tsx outside Next.js's bundler, where the
 * server-only marker package throws) as well as from
 * lib/gamification/achievements.ts.
 */
export const ACHIEVEMENT_CATALOG = [
  {
    code: "ONBOARDING_DONE",
    title: "Langkah Pertama",
    description: "Menyelesaikan onboarding.",
    icon: "Compass",
  },
  {
    code: "FIRST_DIAGNOSTIC",
    title: "Diagnostic Pertama",
    description: "Menyelesaikan diagnostic test pertama.",
    icon: "ClipboardCheck",
  },
  {
    code: "STREAK_7",
    title: "Seminggu Beruntun",
    description: "Mencapai streak belajar 7 hari berturut-turut.",
    icon: "Flame",
  },
  {
    code: "HUNDRED_QUESTIONS",
    title: "100 Soal Terjawab",
    description: "Menjawab 100 soal latihan.",
    icon: "ListChecks",
  },
  {
    code: "FIRST_WRITING",
    title: "Penulis Pemula",
    description: "Menyelesaikan submission Writing pertama.",
    icon: "PenSquare",
  },
  {
    code: "FIRST_SPEAKING",
    title: "Pembicara Pemula",
    description: "Menyelesaikan attempt Speaking pertama.",
    icon: "Mic",
  },
  {
    code: "FIRST_TRYOUT",
    title: "Tryout Pertama",
    description: "Menyelesaikan tryout pertama.",
    icon: "ClipboardList",
  },
] as const;

export type AchievementCode = (typeof ACHIEVEMENT_CATALOG)[number]["code"];
