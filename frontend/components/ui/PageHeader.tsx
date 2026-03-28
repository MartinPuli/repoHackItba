import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-10 flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="section-label">{eyebrow}</p>
        ) : null}
        <h1 className="text-display font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-[15px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}
