import { cn } from "@/lib/utils";

interface StatBlockProps {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

export function StatBlock({ label, value, hint, className }: StatBlockProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-pistachio-muted bg-cream px-4 py-4 transition-colors hover:border-pistachio-light",
        className
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-ink-muted leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}
