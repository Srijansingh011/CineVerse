import Link from "next/link";
import { cn } from "../../lib/cn";

export function SectionHeader({
  eyebrow,
  title,
  href,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-5", className)}>
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-1">{eyebrow}</p>
        ) : null}
        <h2 className="font-display text-[24px] md:text-[28px] leading-tight text-white">{title}</h2>
      </div>
      {action
        ? action
        : href
          ? (
            <Link href={href} className="text-[13px] font-medium text-muted hover:text-white transition-colors shrink-0">
              See all
            </Link>
          )
          : null}
    </div>
  );
}
