import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, hint, icon: Icon, accent }: {
  label: string; value: string | number; hint?: string; icon: LucideIcon; accent?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accent ? "bg-gold" : "bg-primary"}`} />
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold text-primary">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${accent ? "bg-gold/15 text-gold" : "bg-primary/5 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
