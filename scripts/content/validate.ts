import { join } from "node:path";
import { loadContent } from "../../lib/content/loader";

const contentRoot = join(process.cwd(), "content");
const result = loadContent(contentRoot);

const lessonQuestionCount = result.lessons.reduce((n, l) => n + l.questions.length, 0);
const listeningQuestionCount = result.listeningPassages.reduce((n, p) => n + p.questions.length, 0);
console.log(
  `[content:validate] ${result.coursePaths.length} course path(s), ${result.modules.length} module(s), ${result.lessons.length} lesson(s), ${lessonQuestionCount} lesson question(s), ${result.listeningPassages.length} listening passage(s), ${listeningQuestionCount} listening question(s), ${result.topics.length} topic(s) terbaca.`,
);

if (result.ok) {
  console.log("[content:validate] OK — semua file valid.");
  process.exit(0);
}

console.error(`[content:validate] ${result.errors.length} masalah ditemukan:\n`);
for (const err of result.errors) {
  console.error(`  ✗ ${err.file}\n    ${err.message}`);
}
process.exit(1);
