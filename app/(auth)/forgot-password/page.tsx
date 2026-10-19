"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, type ActionState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Mengirim..." : "Kirim tautan reset"}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(forgotPasswordAction, null);
  const submitted = Boolean(state?.success);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lupa password</CardTitle>
        <CardDescription>
          Masukkan email akun Anda. Jika terdaftar, kami kirim tautan reset password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state?.fieldErrors?.email ? (
              <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <SubmitButton />
        </form>
        {submitted ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Jika email terdaftar, tautan reset password telah dikirim. Periksa kotak masuk Anda.
          </p>
        ) : null}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2">
            Kembali ke halaman masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
