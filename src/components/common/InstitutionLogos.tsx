import { cn } from "@/lib/utils";

export function InstitutionLogos({
  className,
  asdeClassName,
  costaClassName,
}: {
  className?: string;
  asdeClassName?: string;
  costaClassName?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)} aria-label="Alcaldía de Santo Domingo Este y Costa del Faro">
      <span className="flex h-full min-w-0 flex-1 items-center justify-center overflow-hidden">
        <img
          src="/logo-asde.png"
          alt="Alcaldía de Santo Domingo Este"
          className={cn("h-full w-full scale-[1.65] object-contain", asdeClassName)}
        />
      </span>
      <span className="h-3/5 w-px shrink-0 bg-slate-300" aria-hidden="true" />
      <span className="flex h-full min-w-0 flex-1 items-center justify-center overflow-hidden">
        <img
          src="/logo-cf.png"
          alt="Costa del Faro"
          className={cn("h-full w-full object-contain", costaClassName)}
        />
      </span>
    </div>
  );
}
