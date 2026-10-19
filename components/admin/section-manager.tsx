"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addSectionAction, removeSectionAction } from "@/app/(admin)/admin/test-builder/actions";

export function SectionManager({
  mockTestCode,
  sections,
  selectablePassages,
}: {
  mockTestCode: string;
  sections: { id: string; order: number; title: string; code: string }[];
  selectablePassages: { code: string; title: string }[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!selected) return;
    setPending(true);
    setError(null);
    addSectionAction(mockTestCode, selected)
      .then((result) => {
        if ("error" in result) setError(result.error);
        else setSelected(null);
      })
      .finally(() => setPending(false));
  }

  function handleRemove(sectionId: string) {
    setPending(true);
    setError(null);
    removeSectionAction(mockTestCode, sectionId)
      .then((result) => {
        if ("error" in result) setError(result.error);
      })
      .finally(() => setPending(false));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sections ({sections.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sections.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada section.</p>
        ) : (
          <ol className="space-y-2">
            {sections.map((s) => (
              <li
                key={s.id}
                className="border-border flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <span>
                  {s.order}. {s.title} ({s.code})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(s.id)}
                  disabled={pending}
                >
                  Hapus
                </Button>
              </li>
            ))}
          </ol>
        )}

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {selectablePassages.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Select value={selected ?? undefined} onValueChange={(v) => setSelected(v)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Pilih passage untuk ditambahkan" />
              </SelectTrigger>
              <SelectContent>
                {selectablePassages.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" onClick={handleAdd} disabled={pending || !selected}>
              Tambah Section
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Tidak ada passage PUBLISHED lain yang bisa ditambahkan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
