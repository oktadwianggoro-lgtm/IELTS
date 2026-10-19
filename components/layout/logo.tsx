import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "text-foreground flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <span className="bg-brand-navy text-brand-navy-foreground flex h-8 w-8 items-center justify-center rounded-lg">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg leading-none">
        Success <span className="text-brand-teal">IELTS</span>
      </span>
    </Link>
  );
}
