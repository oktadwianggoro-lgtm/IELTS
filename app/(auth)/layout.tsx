import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/40 p-4 sm:p-6">
      <Logo />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
