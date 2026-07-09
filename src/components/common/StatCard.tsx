import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, hint, icon: Icon, accent }: {
  label: string; value: string | number; hint?: string; icon: LucideIcon; accent?: boolean;
}) {
  return (
    <Card className={`flex items-start justify-between gap-3 overflow-hidden border-t-2 p-5 transition-shadow hover:shadow-md ${accent ? "border-t-accent" : "border-t-primary"}`}>
      <div className="flex w-full items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] ${accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
