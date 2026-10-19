"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteAccountButton({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setDeleting(true);
    setError(null);
    fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationEmail: confirmation }),
    })
      .then(async (res) => {
        const result = (await res.json()) as { ok?: true; error?: string };
        if (result.error) {
          setError(result.error);
          return;
        }
        // The route handler already cleared the session server-side; hard
        // navigate (not router.push) for the same reason as SignOutButton
        // (D-036/D-042): a soft redirect can race an in-flight session read.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard navigation, see comment above
        window.location.href = "/";
      })
      .finally(() => setDeleting(false));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>Hapus Akun</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus akun secara permanen?</DialogTitle>
          <DialogDescription>
            Semua data akun dan data belajar Anda (submission, progress, bookmark, catatan, hasil
            tryout) akan dihapus permanen dan tidak bisa dikembalikan. Ketik email Anda ({email})
            untuk konfirmasi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="delete-confirmation">Email</Label>
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={email}
          />
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || confirmation.trim().toLowerCase() !== email.toLowerCase()}
          >
            {deleting ? "Menghapus..." : "Hapus Akun Permanen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
