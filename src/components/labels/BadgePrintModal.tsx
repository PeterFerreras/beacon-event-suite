import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrMock } from "@/components/common/QrMock";
import { Printer, Download } from "lucide-react";
import { toast } from "sonner";

export type BadgeData = {
  nombre: string;
  cargo?: string;
  institucion?: string;
  evento?: string;
  tipo?: string;
  id: string;
};

export function BadgePrintModal({
  open, onOpenChange, data,
}: { open: boolean; onOpenChange: (v: boolean) => void; data: BadgeData | null }) {
  if (!data) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Etiqueta de identificación</DialogTitle>
        </DialogHeader>
        <div className="print-area">
          <div className="mx-auto w-[340px] rounded-md border-2 border-primary bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b-2 border-gold pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Costa del Faro</div>
              {data.tipo && (
                <span className="rounded-sm bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-foreground">
                  {data.tipo}
                </span>
              )}
            </div>
            <div className="mt-4 min-h-[3.5rem]">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Nombre</div>
              <div className="font-display text-xl font-semibold leading-tight text-primary">{data.nombre}</div>
            </div>
            {data.cargo && (
              <div className="mt-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cargo</div>
                <div className="text-sm font-medium text-foreground">{data.cargo}</div>
              </div>
            )}
            {data.institucion && (
              <div className="mt-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Institución</div>
                <div className="text-sm text-foreground">{data.institucion}</div>
              </div>
            )}
            {data.evento && (
              <div className="mt-3 border-t border-dashed pt-2 text-xs text-muted-foreground">
                <span className="font-medium text-primary">Evento:</span> {data.evento}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-[10px] leading-tight text-muted-foreground">
                <div>ID</div>
                <div className="font-mono text-xs text-foreground">{data.id.toUpperCase()}</div>
              </div>
              <QrMock value={data.id} size={96} />
            </div>
          </div>
        </div>
        <DialogFooter className="no-print gap-2">
          <Button variant="outline" onClick={() => toast.success("Etiqueta descargada (simulado)")}>
            <Download className="mr-2 h-4 w-4" /> Descargar PDF
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
