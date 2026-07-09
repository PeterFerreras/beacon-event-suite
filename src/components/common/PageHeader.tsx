import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.2em] text-gold">G-Visitantes</div>
        <h1 className="gold-line mt-1 font-display text-2xl font-semibold text-primary sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
