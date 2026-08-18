import { cn } from "../../lib/cn";

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-[var(--border)]">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "relative shrink-0 px-3 py-2.5 text-[13px] font-medium transition-colors",
            value === item.id ? "text-white" : "text-muted hover:text-foreground"
          )}
        >
          {item.label}
          {value === item.id ? (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
