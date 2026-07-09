import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrMock } from "@/components/common/QrMock";
import { Download, Printer } from "lucide-react";

export type BadgeData = {
  nombre: string;
  cargo?: string;
  institucion?: string;
  evento?: string;
  tipo?: string;
  id: string;
};

export function BadgePrintModal({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: BadgeData | null;
}) {
  if (!data) return null;

  function downloadLabel() {
    const safeName = data.nombre.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Etiqueta ${escapeHtml(data.nombre)}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef6f7; font-family: Arial, sans-serif; }
    .label { width: 340px; border: 2px solid #138f8c; border-radius: 12px; background: white; padding: 20px; box-shadow: 0 8px 24px rgba(15, 23, 42, .14); color: #101828; }
    .top { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ff6b13; padding-bottom: 10px; }
    .brand { font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #138f8c; }
    .type { border-radius: 999px; background: #ff6b13; color: white; padding: 3px 9px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .eyebrow { margin-top: 18px; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #667085; }
    h1 { margin: 4px 0 0; font-size: 22px; line-height: 1.15; }
    .muted { margin-top: 8px; color: #475467; font-size: 13px; }
    .event { margin-top: 14px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 12px; color: #475467; }
    .bottom { margin-top: 18px; display: flex; align-items: center; justify-content: space-between; }
    .id { font-family: monospace; font-size: 12px; }
    .qr { width: 92px; height: 92px; border: 2px solid #101828; display: grid; place-items: center; font-size: 10px; font-weight: 700; }
  </style>
</head>
<body>
  <section class="label">
    <div class="top"><div class="brand">Costa del Faro</div>${data.tipo ? `<div class="type">${escapeHtml(data.tipo)}</div>` : ""}</div>
    <div class="eyebrow">Nombre</div>
    <h1>${escapeHtml(data.nombre)}</h1>
    ${data.cargo ? `<div class="muted">${escapeHtml(data.cargo)}</div>` : ""}
    ${data.institucion ? `<div class="muted">${escapeHtml(data.institucion)}</div>` : ""}
    ${data.evento ? `<div class="event"><strong>Evento:</strong> ${escapeHtml(data.evento)}</div>` : ""}
    <div class="bottom"><div><div class="eyebrow">ID</div><div class="id">${escapeHtml(data.id.toUpperCase())}</div></div><div class="qr">QR</div></div>
  </section>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `etiqueta-${safeName || data.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Etiqueta de identificacion</DialogTitle>
        </DialogHeader>
        <div className="print-area">
          <div className="mx-auto w-[340px] rounded-[var(--radius)] border-2 border-primary bg-white p-5 shadow-card-soft">
            <div className="flex items-center justify-between border-b-2 border-accent pb-2">
              <div className="flex items-center gap-2">
                <img src="/logo-cf.png" alt="Costa del Faro" className="h-8 w-auto" />
                <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Costa del Faro</div>
              </div>
              {data.tipo && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                  {data.tipo}
                </span>
              )}
            </div>
            <div className="mt-4 min-h-[3.5rem]">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Nombre</div>
              <div className="font-display text-xl font-semibold leading-tight text-foreground">{data.nombre}</div>
            </div>
            {data.cargo && (
              <div className="mt-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cargo</div>
                <div className="text-sm font-medium text-foreground">{data.cargo}</div>
              </div>
            )}
            {data.institucion && (
              <div className="mt-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Institucion</div>
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
          <Button variant="outline" onClick={downloadLabel}>
            <Download className="mr-2 h-4 w-4" /> Descargar etiqueta
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
