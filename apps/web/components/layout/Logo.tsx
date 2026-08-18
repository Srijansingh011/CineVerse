import Link from "next/link";
import { cn } from "../../lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 shrink-0", className)}>
      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
      <span className="text-[13px] font-semibold tracking-[0.22em] uppercase text-white">
        CineVerse
      </span>
    </Link>
  );
}
