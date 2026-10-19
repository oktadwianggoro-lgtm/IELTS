"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type ActionState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Memproses..." : "Daftar"}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(registerAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat akun Success IELTS</CardTitle>
        <CardDescription>Mulai jalur belajar IELTS Anda, gratis.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" autoComplete="name" required />
            {state?.fieldErrors?.name ? (
              <p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state?.fieldErrors?.email ? (
              <p className="text-destructive text-xs">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            <p className="text-muted-foreground text-xs">
              Minimal 8 karakter, mengandung huruf dan angka.
            </p>
            {state?.fieldErrors?.password ? (
              <p className="text-destructive text-xs">{state.fieldErrors.password[0]}</p>
            ) : null}
          </div>
          {state?.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
          <SubmitButton />
        </form>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-brand-navy underline underline-offset-2">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
