import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

export type BadgeData = {
  nombre: string;
  cedula?: string;
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
  const badge = data;
  const qrValue = useMemo(() => JSON.stringify({ id: badge?.id ?? "", cedula: badge?.cedula ?? badge?.id ?? "", nombre: badge?.nombre ?? "", evento: badge?.evento ?? "" }), [badge]);
  const [qrSvg, setQrSvg] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(qrValue, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      width: 128,
      color: { dark: "#101828", light: "#ffffff" },
    }).then((svg) => {
      if (!cancelled) setQrSvg(svg);
    });
    return () => {
      cancelled = true;
    };
  }, [qrValue]);

  if (!badge) return null;
  const b = badge;

  async function downloadLabel() {
    const safeName = b.nombre.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const qr = await QRCode.toString(qrValue, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      width: 118,
      color: { dark: "#101828", light: "#ffffff" },
    });
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Etiqueta ${escapeHtml(b.nombre)}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef6f7; font-family: Arial, sans-serif; }
    .label { width: 520px; min-height: 250px; border: 2px solid #138f8c; border-radius: 12px; background: white; padding: 18px 20px; box-shadow: 0 8px 24px rgba(15, 23, 42, .14); color: #101828; }
    .top { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ff6b13; padding-bottom: 10px; }
    .brand-wrap { display: flex; align-items: center; gap: 10px; }
    .brand-wrap img { height: 34px; width: auto; }
    .brand { font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #138f8c; }
    .type { border-radius: 999px; background: #ff6b13; color: white; padding: 3px 9px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .body { display: grid; grid-template-columns: minmax(0, 1fr) 132px; gap: 20px; align-items: end; padding-top: 14px; }
    .eyebrow { margin-top: 10px; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #667085; }
    h1 { margin: 4px 0 0; font-size: 22px; line-height: 1.15; }
    .doc { margin-top: 3px; font-family: monospace; font-size: 12px; font-weight: 700; color: #101828; }
    .muted { margin-top: 4px; color: #475467; font-size: 13px; }
    .event { margin-top: 14px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 12px; color: #475467; }
    .bottom { margin-top: 18px; }
    .id { font-family: monospace; font-size: 12px; }
    .qr { width: 118px; height: 118px; background: #fff; justify-self: end; }
    .qr svg { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <section class="label">
    <div class="top"><div class="brand-wrap"><img src="/logo-cf.png" alt="Costa del Faro" /><div class="brand">Costa del Faro</div></div>${b.tipo ? `<div class="type">${escapeHtml(b.tipo)}</div>` : ""}</div>
    <div class="body">
      <div>
        <div class="eyebrow">Nombre</div>
        <h1>${escapeHtml(b.nombre)}</h1>
        ${b.cedula ? `<div class="doc">${escapeHtml(b.cedula)}</div>` : ""}
        ${b.cargo ? `<div class="eyebrow">Cargo</div><div class="muted">${escapeHtml(b.cargo)}</div>` : ""}
        ${b.institucion ? `<div class="eyebrow">Institucion</div><div class="muted">${escapeHtml(b.institucion)}</div>` : ""}
        ${b.evento ? `<div class="event"><strong>Evento:</strong> ${escapeHtml(b.evento)}</div>` : ""}
        <div class="bottom"><div class="eyebrow">ID</div><div class="id">${escapeHtml(b.id.toUpperCase())}</div></div>
      </div>
      <div class="qr">${qr}</div>
    </div>
  </section>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `etiqueta-${safeName || b.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Etiqueta de identificacion</DialogTitle>
        </DialogHeader>
        <div className="print-area">
          <div className="mx-auto w-full max-w-[560px] rounded-[var(--radius)] border-2 border-[#138f8c] bg-white p-5 text-[#101828] shadow-card-soft">
            <div className="flex items-center justify-between border-b-2 border-accent pb-2">
              <div className="flex items-center gap-2">
                <img src="/logo-cf.png" alt="Costa del Faro" className="h-8 w-auto" />
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#138f8c]">Costa del Faro</div>
              </div>
              {b.tipo && (
                <span className="rounded-full bg-[#ff6b13] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {b.tipo}
                </span>
              )}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-5 pt-4">
              <div className="min-w-0">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#667085]">Nombre</div>
                  <div className="font-display text-xl font-semibold leading-tight text-[#101828]">{b.nombre}</div>
                  {b.cedula && <div className="mt-1 font-mono text-xs font-semibold text-[#101828]">{b.cedula}</div>}
                </div>
                {b.cargo && (
                  <div className="mt-2">
                    <div className="text-[10px] uppercase tracking-widest text-[#667085]">Cargo</div>
                    <div className="text-sm font-medium text-[#101828]">{b.cargo}</div>
                  </div>
                )}
                {b.institucion && (
                  <div className="mt-2">
                    <div className="text-[10px] uppercase tracking-widest text-[#667085]">Institucion</div>
                    <div className="text-sm text-[#101828]">{b.institucion}</div>
                  </div>
                )}
                {b.evento && (
                  <div className="mt-3 border-t border-dashed border-[#cbd5e1] pt-2 text-xs text-[#667085]">
                    <span className="font-medium text-[#138f8c]">Evento:</span> {b.evento}
                  </div>
                )}
                <div className="mt-4 min-w-0 text-[10px] leading-tight text-[#667085]">
                  <div>ID</div>
                  <div className="break-all font-mono text-xs text-[#101828]">{b.id.toUpperCase()}</div>
                </div>
              </div>
              <div
                className="h-28 w-28 shrink-0 bg-white [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
                aria-label={`Codigo QR de ${b.nombre}`}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
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
