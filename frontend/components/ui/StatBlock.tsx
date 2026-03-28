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
        "rounded-lg border border-line bg-white px-4 py-4 shadow-panel transition-colors hover:border-line-strong",
        className
      )}
    >
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs leading-snug text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
