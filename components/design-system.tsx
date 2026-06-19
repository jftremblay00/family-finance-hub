import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "./ui/utils";

type Tone = "ink" | "paper" | "mint" | "coral" | "lavender";

const toneStyles: Record<Tone, string> = {
  ink: "border-primary/20 bg-primary text-primary-foreground",
  paper: "bg-card",
  mint: "border-success/25 bg-success/10",
  coral: "border-accent/30 bg-accent/12",
  lavender: "border-lavender/30 bg-lavender/12",
};

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-2 text-[2rem] font-semibold leading-[1.03] tracking-[-0.035em] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="ghost" size="sm" onClick={onAction}>
          {actionLabel} <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "paper",
  icon,
  action,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: Tone;
  icon?: ReactNode;
  action?: string;
}) {
  const isDark = tone === "ink";
  return (
    <Card className={cn("min-h-[156px] overflow-hidden", toneStyles[tone])}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground", isDark && "text-primary-foreground/66")}>{label}</p>
        </div>
        {icon && <div className={cn("rounded-lg border border-border/70 bg-background/60 p-2 text-muted-foreground", isDark && "border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground")}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <p className="money-figure text-[2rem] font-semibold leading-none tracking-[-0.04em] sm:text-4xl">{value}</p>
        <div className={cn("mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground", isDark && "text-primary-foreground/70")}>
          <span>{detail}</span>
          {action && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold">
              {action} <ArrowUpRight className="size-3" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function InsightCard({
  title,
  children,
  actionLabel,
  onAction,
  className,
}: {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        {actionLabel && onAction && (
          <Button variant="ghost" size="sm" onClick={onAction}>
            {actionLabel} <ChevronRight className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function StatusBadge({ children, tone = "paper" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium", toneStyles[tone])}>
      {children}
    </span>
  );
}

export function ActivityRow({
  title,
  meta,
  amount,
  badge,
}: {
  title: string;
  meta: string;
  amount: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-border/70 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-[-0.01em]">{title}</p>
          {badge}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </div>
      <p className="money-figure shrink-0 text-sm font-semibold">{amount}</p>
    </div>
  );
}

export function MiniRail({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(4, Math.min(100, (value / Math.max(max, 1)) * 100));
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="money-figure font-semibold">{Math.round(width)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
