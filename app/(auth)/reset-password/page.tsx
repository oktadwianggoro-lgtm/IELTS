"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type ActionState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Menyimpan..." : "Simpan password baru"}
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(resetPasswordAction, null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  if (state?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password berhasil diubah</CardTitle>
          <CardDescription>Silakan masuk dengan password baru Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/login">Ke halaman masuk</Link>} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tautan tidak valid</CardTitle>
          <CardDescription>
            Buka tautan reset password dari email Anda, atau minta tautan baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            render={<Link href="/forgot-password">Minta tautan reset</Link>}
            variant="outline"
            className="w-full"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atur password baru</CardTitle>
        <CardDescription>Pilih password baru untuk akun Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-1.5">
            <Label htmlFor="password">Password baru</Label>
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
      </CardContent>
    </Card>
  );
}
