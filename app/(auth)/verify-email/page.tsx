import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

async function verifyToken(token: string): Promise<"verified" | "invalid"> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => undefined);
    }
    return "invalid";
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return "verified";
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Periksa email Anda</CardTitle>
          <CardDescription>
            Kami mengirim tautan verifikasi ke email Anda. Buka email tersebut dan klik
            tautannya untuk memverifikasi akun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            render={<Link href="/dashboard">Lanjut ke Beranda</Link>}
            variant="outline"
            className="w-full"
          />
        </CardContent>
      </Card>
    );
  }

  const result = await verifyToken(token);

  if (result === "verified") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email terverifikasi</CardTitle>
          <CardDescription>Terima kasih, email Anda sudah terverifikasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            render={<Link href="/dashboard">Lanjut ke Beranda</Link>}
            className="w-full"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tautan tidak valid</CardTitle>
        <CardDescription>
          Tautan verifikasi tidak valid, sudah kedaluwarsa, atau sudah dipakai. Jika email Anda
          sudah terverifikasi, Anda bisa langsung masuk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button render={<Link href="/login">Ke halaman masuk</Link>} variant="outline" className="w-full" />
      </CardContent>
    </Card>
  );
}
