"use client";

import { ComingSoon } from "@/components/coming-soon";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function Page() {
  const { t } = useLocale();
  return <ComingSoon title={t.nav.grammarVocabulary} plannedPhase="Fase 3" />;
}
