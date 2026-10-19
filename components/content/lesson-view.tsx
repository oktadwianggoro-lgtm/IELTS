import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { LessonContent } from "@/lib/content/schema";
import { PEDAGOGICAL_LEVEL_LABEL, SKILL_AREA_LABEL } from "@/lib/content/labels";
import type { PedagogicalLevel, SkillArea } from "@prisma/client";

export type LessonViewData = {
  title: string;
  level: PedagogicalLevel;
  skill: SkillArea;
  targetBandRange: string | null;
  estimatedMinutes: number;
  objectives: string[];
  content: LessonContent;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}

export function LessonView({ lesson }: { lesson: LessonViewData }) {
  const c = lesson.content;
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{PEDAGOGICAL_LEVEL_LABEL[lesson.level]}</Badge>
          <Badge variant="secondary">{SKILL_AREA_LABEL[lesson.skill]}</Badge>
          {lesson.targetBandRange ? (
            <Badge variant="outline">{lesson.targetBandRange}</Badge>
          ) : null}
          <Badge variant="outline">{lesson.estimatedMinutes} menit</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{lesson.title}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {lesson.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Section title="Penjelasan">
        <p>{c.explanationId}</p>
      </Section>

      <Section title="Core concept">
        <p className="italic">{c.coreConcept}</p>
      </Section>

      <Section title="Contoh">
        <div className="space-y-3">
          {c.examples.map((ex, i) => (
            <div key={i} className="border-border rounded-md border p-3">
              <p>
                <span className="text-success font-medium">✓ Benar:</span> {ex.correct}
              </p>
              {ex.incorrect ? (
                <p>
                  <span className="text-destructive font-medium">✗ Salah:</span> {ex.incorrect}
                </p>
              ) : null}
              <p className="text-muted-foreground mt-1">{ex.reason}</p>
            </div>
          ))}
        </div>
      </Section>

      {c.tables?.length ? (
        <Section title="Tabel">
          {c.tables.map((t, i) => (
            <div key={i} className="overflow-x-auto">
              <p className="mb-1 font-medium">{t.title}</p>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {t.headers.map((h) => (
                      <th key={h} className="border-border bg-muted border p-1.5 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border-border border p-1.5">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </Section>
      ) : null}

      <Section title="Kesalahan umum penutur Indonesia">
        <ul className="space-y-2">
          {c.commonMistakes.map((m, i) => (
            <li key={i} className="border-border rounded-md border p-3">
              <p>
                <span className="text-destructive font-medium">✗</span> {m.mistake}
              </p>
              <p>
                <span className="text-success font-medium">✓</span> {m.correction}
              </p>
              {m.note ? <p className="text-muted-foreground mt-1">{m.note}</p> : null}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Strategi">
        <p>{c.strategy}</p>
      </Section>

      <Section title="Guided practice">
        <ol className="list-decimal space-y-2 pl-5">
          {c.guidedPractice.map((p, i) => (
            <li key={i}>
              {p.prompt}
              {p.hint ? (
                <span className="text-muted-foreground block text-xs">Hint: {p.hint}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Independent practice">
        <ol className="list-decimal space-y-2 pl-5">
          {c.independentPractice.map((p, i) => (
            <li key={i}>
              {p.prompt}
              {p.difficulty ? (
                <Badge variant="outline" className="ml-2">
                  {p.difficulty}
                </Badge>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      <Separator />

      <Section title="Ringkasan">
        <p>{c.summary}</p>
      </Section>

      <Section title="Checklist — Saya sudah bisa…">
        <ul className="space-y-1">
          {c.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span aria-hidden>☐</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {c.applicationTask ? (
        <Section title="Tugas penerapan">
          <p>{c.applicationTask}</p>
        </Section>
      ) : null}

      {c.references?.length ? (
        <Section title="Referensi">
          <ul className="space-y-1">
            {c.references.map((r) => (
              <li key={r.url} className="text-muted-foreground">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  {r.label}
                </a>{" "}
                — diverifikasi {r.verifiedAt}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </article>
  );
}
