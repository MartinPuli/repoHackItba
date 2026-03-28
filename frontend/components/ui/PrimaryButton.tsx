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
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-40",
        variant === "solid" && "bg-pistachio text-white hover:bg-pistachio/85",
        variant === "ghost" &&
          "text-ink-muted hover:bg-pistachio-muted/40 hover:text-ink",
        variant === "outline" &&
          "border border-pistachio-light bg-transparent text-pistachio hover:border-pistachio hover:bg-pistachio-muted/30",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
