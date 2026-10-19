"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { completeOnboardingAction } from "@/app/onboarding/actions";
import type { ActionState } from "@/app/(auth)/actions";
import {
  DAILY_STUDY_MINUTES_LABEL,
  LEARNING_GOAL_LABEL,
  SKILL_LABEL,
  TEST_TYPE_LABEL,
  dailyStudyMinutesValues,
  interfaceLanguageValues,
  learningGoalValues,
  skillNameValues,
  testTypeValues,
} from "@/lib/validation/onboarding";
import { cn } from "@/lib/utils";

const STEPS = ["Tujuan", "Target", "Kebiasaan belajar"];
const TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB — Jakarta" },
  { value: "Asia/Makassar", label: "WITA — Makassar" },
  { value: "Asia/Jayapura", label: "WIT — Jayapura" },
];

function NextButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" onClick={onClick}>
      Lanjut
    </Button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan..." : "Selesai"}
    </Button>
  );
}

export function OnboardingWizard() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    completeOnboardingAction,
    null,
  );
  const [step, setStep] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const hasErrors = Boolean(state?.fieldErrors && Object.keys(state.fieldErrors).length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ceritakan tujuan belajar Anda</CardTitle>
        <CardDescription>
          Langkah {step + 1} dari {STEPS.length}: {STEPS[step]}. Anda bisa melewati ini dan
          mengisinya nanti dari halaman Beranda.
        </CardDescription>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent>
        {hasErrors ? (
          <p className="mb-4 text-sm text-destructive">
            Ada isian yang belum valid. Periksa kembali langkah sebelumnya.
          </p>
        ) : null}
        <form action={formAction} className="space-y-6">
          {/* Step 0: Goal + test type */}
          <section className={cn("space-y-5", step !== 0 && "hidden")}>
            <div className="space-y-2">
              <Label>Apa tujuan utama belajar IELTS Anda?</Label>
              <RadioGroup name="goal" defaultValue="STUDY_SCHOLARSHIP" className="grid-cols-1">
                {learningGoalValues.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-md border border-border p-2.5 text-sm has-[[data-checked]]:border-brand-navy"
                  >
                    <RadioGroupItem value={value} />
                    {LEARNING_GOAL_LABEL[value]}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Tipe tes IELTS</Label>
              <RadioGroup name="testType" defaultValue="UNDECIDED" className="grid-cols-1">
                {testTypeValues.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-md border border-border p-2.5 text-sm has-[[data-checked]]:border-brand-navy"
                  >
                    <RadioGroupItem value={value} />
                    {TEST_TYPE_LABEL[value]}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex justify-between">
              <Button render={<Link href="/dashboard">Lewati, isi nanti</Link>} variant="ghost" />
              <NextButton onClick={() => setStep(1)} />
            </div>
          </section>

          {/* Step 1: Targets */}
          <section className={cn("space-y-5", step !== 1 && "hidden")}>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="targetOverallBand">Target overall band (opsional)</Label>
                <Input
                  id="targetOverallBand"
                  name="targetOverallBand"
                  type="number"
                  step={0.5}
                  min={1}
                  max={9}
                  placeholder="mis. 6.5"
                />
              </div>
              {skillNameValues.map((skill) => (
                <div key={skill} className="space-y-1.5">
                  <Label htmlFor={`target${skill}Band`}>{SKILL_LABEL[skill]}</Label>
                  <Input
                    id={`target${skill}Band`}
                    name={`target${skill[0]}${skill.slice(1).toLowerCase()}Band`}
                    type="number"
                    step={0.5}
                    min={1}
                    max={9}
                    placeholder="opsional"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="testDate">Tanggal tes (opsional)</Label>
              <Input id="testDate" name="testDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label>Skill yang paling Anda rasa sulit (opsional)</Label>
              <Select name="hardestSkill">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih skill" />
                </SelectTrigger>
                <SelectContent>
                  {skillNameValues.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {SKILL_LABEL[skill]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Kembali
              </Button>
              <NextButton onClick={() => setStep(2)} />
            </div>
          </section>

          {/* Step 2: Study habits */}
          <section className={cn("space-y-5", step !== 2 && "hidden")}>
            <div className="space-y-2">
              <Label>Berapa lama Anda bisa belajar per hari?</Label>
              <RadioGroup
                name="dailyStudyMinutes"
                defaultValue="TWENTY"
                className="grid-cols-2 sm:grid-cols-3"
              >
                {dailyStudyMinutesValues.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-md border border-border p-2.5 text-sm has-[[data-checked]]:border-brand-navy"
                  >
                    <RadioGroupItem value={value} />
                    {DAILY_STUDY_MINUTES_LABEL[value]}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Zona waktu</Label>
              <Select name="timezone" defaultValue="Asia/Jakarta">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bahasa antarmuka</Label>
              <RadioGroup name="interfaceLanguage" defaultValue="ID" className="grid-cols-2">
                {interfaceLanguageValues.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-md border border-border p-2.5 text-sm has-[[data-checked]]:border-brand-navy"
                  >
                    <RadioGroupItem value={value} />
                    {value === "ID" ? "Bahasa Indonesia" : "English"}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Pengingat belajar harian</p>
                <p className="text-xs text-muted-foreground">Bisa dimatikan kapan saja.</p>
              </div>
              <Switch
                name="reminderEnabled"
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>
            {reminderEnabled ? (
              <div className="space-y-1.5">
                <Label htmlFor="reminderTime">Jam pengingat</Label>
                <Input id="reminderTime" name="reminderTime" type="time" defaultValue="19:00" />
              </div>
            ) : null}
            {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Kembali
              </Button>
              <SubmitButton />
            </div>
          </section>
        </form>
      </CardContent>
    </Card>
  );
}
