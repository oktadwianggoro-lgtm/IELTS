"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type ActionState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Memproses..." : "Masuk"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(loginAction, null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Masuk ke Success IELTS</CardTitle>
        <CardDescription>Lanjutkan jalur belajar IELTS Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state?.fieldErrors?.email ? (
              <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            {state?.fieldErrors?.password ? (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            ) : null}
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <SubmitButton />
        </form>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="underline underline-offset-2">
            Lupa password?
          </Link>
          <p>
            Belum punya akun?{" "}
            <Link href="/register" className="text-brand-navy underline underline-offset-2">
              Daftar
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
