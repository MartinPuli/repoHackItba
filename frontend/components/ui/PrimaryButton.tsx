import { cn } from "@/lib/utils";

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "ghost" | "outline";
}

export function PrimaryButton({
  className,
  variant = "solid",
  children,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40",
        variant === "solid" &&
          "bg-brand text-white shadow-panel hover:bg-brand/90",
        variant === "ghost" &&
          "text-ink-muted hover:bg-surface-muted hover:text-ink",
        variant === "outline" &&
          "border border-line bg-white text-ink hover:border-line-strong hover:bg-surface-muted/50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
