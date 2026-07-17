import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Sistema institucional</div>
        <h1 className="mt-2 max-w-full break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-accent" />
        {subtitle && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </div>
  );
}
