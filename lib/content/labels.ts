import type { ErrorReason, ListeningSection, PedagogicalLevel, SkillArea } from "@prisma/client";

export const PEDAGOGICAL_LEVEL_LABEL: Record<PedagogicalLevel, string> = {
  STARTER: "Starter / Pre-A1",
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  C1_ENRICHMENT: "C1 Enrichment",
};

export const SKILL_AREA_LABEL: Record<SkillArea, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
  PRONUNCIATION: "Pronunciation",
  TEST_STRATEGY: "Test Strategy",
};

export const LISTENING_SECTION_LABEL: Record<ListeningSection, string> = {
  SECTION_1: "Section 1 — Percakapan sehari-hari",
  SECTION_2: "Section 2 — Monolog sehari-hari",
  SECTION_3: "Section 3 — Diskusi akademik",
  SECTION_4: "Section 4 — Monolog akademik",
};

export const ERROR_REASON_LABEL: Record<ErrorReason, string> = {
  VOCAB_UNKNOWN: "Tidak tahu kosakata",
  MISUNDERSTOOD_INSTRUCTION: "Salah memahami instruksi",
  MISSED_DETAIL: "Kehilangan detail",
  GRAMMAR: "Salah grammar",
  WRONG_STRATEGY: "Salah strategi",
  RUSHED: "Terburu-buru",
  TYPO: "Salah ketik",
};
