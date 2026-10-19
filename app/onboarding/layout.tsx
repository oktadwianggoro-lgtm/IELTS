import { Logo } from "@/components/layout/logo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-muted/40 p-4 py-10 sm:p-6">
      <Logo />
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}
