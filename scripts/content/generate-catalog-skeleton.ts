/**
 * One-off generator for the Fase 3 catalog skeleton: writes CoursePath and
 * Module JSON files under content/ for the full curriculum taxonomy in
 * Master Prompt §6. This only creates navigational metadata (titles,
 * descriptions, level/skill, order) — no Lesson content. Re-run any time the
 * taxonomy changes; it overwrites its own output files deterministically, so
 * re-running is safe and idempotent (same input -> same files -> same DB
 * rows via `npm run content:import`).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type SkillKey = "GRAMMAR" | "VOCABULARY" | "LISTENING" | "READING" | "WRITING" | "SPEAKING";

type LevelDef = {
  code: string;
  pedagogicalLevel: string;
  title: string;
  targetBand: string | null;
  order: number;
  skills: Record<SkillKey, string>;
};

const levels: LevelDef[] = [
  {
    code: "STARTER",
    pedagogicalLevel: "STARTER",
    title: "Starter / Pre-A1 — Mengenal Bahasa Inggris",
    targetBand: null,
    order: 0,
    skills: {
      GRAMMAR:
        "Alphabet, spelling, verb be, kata ganti, demonstratives, there is/are, kalimat sangat sederhana, angka dan tanggal.",
      VOCABULARY:
        "Informasi pribadi, keluarga, rumah, makanan, rutinitas harian, tempat, transportasi, waktu, dan angka.",
      LISTENING: "Mengenali huruf, angka, nama, tanggal, instruksi dan informasi eksplisit.",
      READING: "Memahami label, formulir, pengumuman pendek, dan kalimat sederhana.",
      WRITING: "Melengkapi formulir dan menulis kalimat/paragraf sangat pendek (3-5 kalimat).",
      SPEAKING: "Memperkenalkan diri, mengeja nama, dan menyebut kebiasaan sederhana.",
    },
  },
  {
    code: "A1",
    pedagogicalLevel: "A1",
    title: "A1 — Basic English Foundation",
    targetBand: null,
    order: 1,
    skills: {
      GRAMMAR:
        "Sentence order dasar, be/have/do, present simple vs continuous, past simple dasar, countable/uncountable, preposisi, konjungsi dasar, comparative/superlative dasar, modal can/must.",
      VOCABULARY:
        "Daily routines, hobbies, keluarga, pendidikan, pekerjaan, travel, cuaca, kesehatan, belanja, kota, teknologi dasar; word stress dan pelafalan dasar.",
      LISTENING: "Menangkap nama, tempat, waktu, angka, arah, harga; membedakan angka/homophone.",
      READING: "Skimming teks pendek, scanning nama/tanggal/angka, memahami iklan/email/jadwal.",
      WRITING:
        "Kalimat benar, paragraf pendek, deskripsi diri dan rutinitas, topic sentence pengantar.",
      SPEAKING:
        "Menjawab pertanyaan personal, memperpanjang jawaban 1-3 kalimat, latihan kelancaran dasar.",
    },
  },
  {
    code: "A2",
    pedagogicalLevel: "A2",
    title: "A2 — Elementary to Pre-IELTS",
    targetBand: null,
    order: 2,
    skills: {
      GRAMMAR:
        "Past simple vs continuous, present perfect pengantar, future forms dasar, modals should/could/may, zero/first conditional, relative clause sederhana, passive voice pengantar.",
      VOCABULARY:
        "Pendidikan, lingkungan, transportasi, kesehatan, pekerjaan, komunitas, budaya, media, uang, pariwisata; word families dan collocations dasar.",
      LISTENING: "Paraphrase sederhana, purpose dan attitude dasar, form/note/table completion.",
      READING:
        "True/False/Not Given pengantar, matching information, short-answer, teks 300-500 kata.",
      WRITING: "Paragraf opini/deskriptif, email/surat sederhana, mendeskripsikan tren sederhana.",
      SPEAKING:
        "IELTS Speaking Part 1 pengantar, struktur answer+reason+example, cerita pengalaman masa lalu.",
    },
  },
  {
    code: "B1",
    pedagogicalLevel: "B1",
    title: "B1 — IELTS Foundation",
    targetBand: "4.0-5.5",
    order: 3,
    skills: {
      GRAMMAR:
        "Seluruh tenses utama, present perfect vs continuous, passive voice, conditionals 0-2, relative clauses, word forms, prepositions dan collocations yang kerap salah.",
      VOCABULARY:
        "Academic word families dan tema umum IELTS (education, environment, technology, health, work, crime, government, culture, transport, media), synonym/paraphrase, register formal vs informal.",
      LISTENING:
        "Empat part/konteks sesuai format IELTS, multiple choice, matching, completion berbagai tipe, map/plan/diagram labelling, mengenali distractors.",
      READING:
        "True/False/Not Given, Yes/No/Not Given, matching headings/information, multiple choice, completion, main idea dan inference dasar.",
      WRITING:
        "Struktur paragraf topic-explanation-evidence, Task 2 (opinion/discussion/advantages-disadvantages/problem-solution), Task 1 Academic charts dasar, Task 1 GT letters.",
      SPEAKING:
        "Part 1 jawaban relevan, Part 2 cue card dengan preparation notes, Part 3 alasan dan contoh sederhana.",
    },
  },
  {
    code: "B2",
    pedagogicalLevel: "B2",
    title: "B2 — Intermediate to Upper-Intermediate",
    targetBand: "5.5-6.5+",
    order: 4,
    skills: {
      GRAMMAR:
        "Seluruh tense dan aspek, passive voice beragam, reporting structures, conditionals 0-3 dan mixed, relative clauses lanjut, noun/adverbial clauses, modal perfect, nominalisation pengantar.",
      VOCABULARY:
        "Academic collocations dan topic vocabulary dengan word family/register/common error, paraphrasing, hedging dasar, stance verbs, phrasal verbs untuk speaking.",
      LISTENING:
        "Attitude, purpose, implication, diskusi multi-pembicara, distractors tingkat lanjut, signposting kuliah/ceramah.",
      READING:
        "Inference, writer's opinion/claims, matching headings/information/features, paraphrase lanjut, alokasi waktu per passage.",
      WRITING:
        "Task 2 dengan posisi jelas dan argumen logis, Task 1 Academic overview tajam, Task 1 GT register konsisten, sentence variety dan lexical precision.",
      SPEAKING:
        "Part 1 ringkas-diperluas, Part 2 alur dan detail spesifik, Part 3 sebab-akibat dan perbandingan, connected speech.",
    },
  },
  {
    code: "C1",
    pedagogicalLevel: "C1_ENRICHMENT",
    title: "C1 — Advanced IELTS",
    targetBand: "6.5-7.5+",
    order: 5,
    skills: {
      GRAMMAR:
        "Complex/compound-complex structures, inversion, cleft sentences, participle clauses, nominalisation, hedging/qualification/concession, parallelism dan cohesive devices.",
      VOCABULARY:
        "Academic collocations presisi, nuanced adjectives/adverbs, word families lanjut, connotation dan register, paraphrasing tingkat paragraf, idiomatic language alami.",
      LISTENING:
        "Inferensi sikap dan maksud implisit, kuliah akademik dan monolog panjang, akurasi tinggi tanpa transkrip.",
      READING:
        "Dense academic passages, argument structure, claims/counterclaims, perbedaan fakta-opini-inferensi, paraphrase subtle.",
      WRITING:
        "Task Response tajam dengan argumen berimbang, Task 1 seleksi data penting dan grammar tren kompleks, lexical resource presisi, kohesi antarparagraf.",
      SPEAKING:
        "Part 3 analisis-evaluasi-spekulasi, jawaban spontan dan fleksibel, nuance dan reformulation, pronunciation untuk intelligibility.",
    },
  },
  {
    code: "ENRICHMENT",
    pedagogicalLevel: "C1_ENRICHMENT",
    title: "Band 7.5-9 Enrichment — Precision, Consistency & Exam Mastery",
    targetBand: "7.5+",
    order: 6,
    skills: {
      GRAMMAR:
        "Presisi bahasa dan konsistensi grammar lanjutan; mengurangi kesalahan kecil yang berulang.",
      VOCABULARY:
        "Precision leksikal lanjutan dan analisis kesalahan kosakata berulang dari data pengguna.",
      LISTENING:
        "Menangani audio kompleks dengan batas waktu nyata, evaluasi argumen dan implikasi.",
      READING:
        "Evaluasi argumen, nuansa, counterargument, dan synthesis pada teks kompleks dengan batas waktu nyata.",
      WRITING:
        "Task fulfilment menyeluruh, argument development matang, paragraph cohesion tingkat lanjut.",
      SPEAKING: "Fleksibilitas, detail terpilih, spontanitas, discourse control tingkat lanjut.",
    },
  },
];

const specialTracks = [
  {
    coursePathCode: "PATH-GRAMMAR-LAB",
    coursePathTitle: "Grammar Lab",
    coursePathDescription:
      "Materi grammar lengkap sebagai jalur khusus, dari parts of speech hingga struktur lanjutan (25 topik berurutan).",
    moduleCode: "GRAMMAR-LAB",
    moduleTitle: "Grammar Lab — Urutan Lengkap",
    moduleDescription:
      "Parts of speech, sentence structure, nouns, articles, pronouns, tenses, subject-verb agreement, adjectives/adverbs, prepositions, modals, gerund/infinitive, passive voice, questions, conditionals, relative clauses, conjunctions, reported speech, complex sentences, nominalisation, hedging, punctuation, grammar untuk Writing/Speaking, dan kesalahan umum penutur Indonesia.",
    level: "STARTER",
    skill: "GRAMMAR" as const,
  },
  {
    coursePathCode: "PATH-VOCAB-BUILDER",
    coursePathTitle: "Vocabulary Builder",
    coursePathDescription:
      "Kosakata lintas tema (high-frequency, academic, topic-based) dengan flashcard dan spaced repetition.",
    moduleCode: "VOCAB-BUILDER",
    moduleTitle: "Vocabulary Builder — Lintas Tema",
    moduleDescription:
      "High-frequency vocabulary, academic word list, kosakata tematik (education, environment, technology, health, work, business, government, cities, transport, crime, media, culture, tourism, food, energy, science, globalisation, family, society, housing, public services), word families, collocations, phrasal verbs.",
    level: "STARTER",
    skill: "VOCABULARY" as const,
  },
  {
    coursePathCode: "PATH-PRONUNCIATION",
    coursePathTitle: "Pronunciation & Fluency",
    coursePathDescription:
      "Bunyi, word/sentence stress, connected speech, dan kelancaran berbicara yang mudah dipahami.",
    moduleCode: "PRONUNCIATION-FLUENCY",
    moduleTitle: "Pronunciation & Fluency",
    moduleDescription:
      "Bunyi vokal/konsonan, word stress, sentence stress, rhythm, connected speech, linking, intonation, chunking, minimal pairs, shadowing, read aloud.",
    level: "A1",
    skill: "PRONUNCIATION" as const,
  },
  {
    coursePathCode: "PATH-TEST-STRATEGY",
    coursePathTitle: "Modul Strategi Tes",
    coursePathDescription:
      "Strategi mengerjakan setiap bagian IELTS dan manajemen waktu/hari ujian.",
    moduleCode: "TEST-STRATEGY",
    moduleTitle: "Strategi Tes IELTS",
    moduleDescription:
      "Memahami instruksi dan word limit, manajemen waktu per section, prediction/skimming/scanning/elimination/note-taking, strategi per tipe soal, persiapan hari ujian, penggunaan full mock test.",
    level: "B1",
    skill: "TEST_STRATEGY" as const,
  },
];

const skillOrder: SkillKey[] = [
  "GRAMMAR",
  "VOCABULARY",
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
];

const contentRoot = join(process.cwd(), "content");
const coursePathsDir = join(contentRoot, "course-paths");
const modulesDir = join(contentRoot, "modules");
mkdirSync(coursePathsDir, { recursive: true });
mkdirSync(modulesDir, { recursive: true });

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

let coursePathCount = 0;
let moduleCount = 0;

for (const level of levels) {
  const coursePathCode = `PATH-${level.code}`;
  // PATH-STARTER already exists by hand from Fase 2 with slightly different
  // wording; skip overwriting it so that file stays the hand-authored one.
  if (coursePathCode !== "PATH-STARTER") {
    writeJson(join(coursePathsDir, `${coursePathCode.toLowerCase()}.json`), {
      code: coursePathCode,
      title: level.title,
      description: level.targetBand
        ? `Target latihan IELTS sekitar band ${level.targetBand} (estimasi, bukan konversi resmi).`
        : "Jalur fondasi bahasa Inggris sebelum materi IELTS inti.",
      order: level.order,
    });
    coursePathCount++;
  }

  skillOrder.forEach((skill, skillIndex) => {
    const moduleCode = `${level.code}-${skill}`;
    if (moduleCode === "STARTER-GRAMMAR") return; // STARTER-FOUNDATIONS already covers this, hand-authored.
    writeJson(join(modulesDir, `${moduleCode.toLowerCase()}.json`), {
      code: moduleCode,
      coursePathCode,
      title: `${level.title.split("—")[0].trim()} — ${skill.charAt(0) + skill.slice(1).toLowerCase().replace("_", " ")}`,
      description: level.skills[skill],
      level: level.pedagogicalLevel,
      skill,
      order: skillIndex,
    });
    moduleCount++;
  });
}

for (const track of specialTracks) {
  writeJson(join(coursePathsDir, `${track.coursePathCode.toLowerCase()}.json`), {
    code: track.coursePathCode,
    title: track.coursePathTitle,
    description: track.coursePathDescription,
    order: 100,
  });
  coursePathCount++;

  writeJson(join(modulesDir, `${track.moduleCode.toLowerCase()}.json`), {
    code: track.moduleCode,
    coursePathCode: track.coursePathCode,
    title: track.moduleTitle,
    description: track.moduleDescription,
    level: track.level,
    skill: track.skill,
    order: 0,
  });
  moduleCount++;
}

console.log(
  `[generate-catalog-skeleton] Wrote ${coursePathCount} course path file(s), ${moduleCount} module file(s).`,
);
console.log("Run `npm run content:validate` then `npm run content:import` next.");
