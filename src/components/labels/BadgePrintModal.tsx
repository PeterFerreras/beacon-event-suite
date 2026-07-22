import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const printAreaRef = useRef<HTMLDivElement>(null);

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

  function printLabel() {
    const logoUrl = new URL("/logo-cf.png", window.location.href).href;
    const printMarkup = `<main class="label">
      <header>
        <div class="brand"><img src="${logoUrl}" alt="Costa del Faro"><span>COSTA DEL FARO</span></div>
        ${b.tipo ? `<span class="type">${escapeHtml(b.tipo)}</span>` : ""}
      </header>
      <section class="content">
        <div class="details">
          <div class="caption">NOMBRE</div>
          <div class="name">${escapeHtml(b.nombre)}</div>
          ${b.cedula ? `<div class="document">${escapeHtml(b.cedula)}</div>` : ""}
          ${b.evento ? `<div class="event"><span>Evento:</span> ${escapeHtml(b.evento)}</div>` : ""}
          <div class="caption id-caption">ID</div>
          <div class="id">${escapeHtml(b.id.toUpperCase())}</div>
        </div>
        <div class="qr">${qrSvg}</div>
      </section>
    </main>`;
    const printCss = `<style>
      @page { size: 4in 2in; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 4in; height: 2in; margin: 0; padding: 0; overflow: hidden; }
      body { font-family: Arial, sans-serif; color: #101828; direction: ltr; writing-mode: horizontal-tb; }
      .label { position: absolute; inset: 0; width: 4in; height: 2in; padding: 2.2mm; overflow: hidden; border: .45mm solid #667085; border-radius: 3mm; background: #fff; transform: none; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      header { height: 10mm; display: flex; align-items: center; justify-content: space-between; border-bottom: .6mm solid #138f8c; padding: 0 1mm 1.4mm; }
      .brand { display: flex; align-items: center; gap: 2.5mm; color: #344054; font-size: 8pt; font-weight: 800; letter-spacing: 1.3pt; }
      .brand img { width: 15mm; height: 7.5mm; object-fit: contain; }
      .type { border-radius: 4mm; padding: 1.2mm 3mm; background: #667085; color: #fff; font-size: 7pt; font-weight: 800; letter-spacing: .4pt; }
      .content { display: grid; grid-template-columns: minmax(0, 1fr) 20mm; gap: 2.5mm; padding: 2mm 1mm 0; }
      .caption { color: #667085; font-size: 6.5pt; font-weight: 700; letter-spacing: .8pt; }
      .name { margin-top: .5mm; font-size: 12pt; line-height: 1.02; font-weight: 900; color: #101828; }
      .document { margin-top: 1.2mm; font: 800 10pt Consolas, monospace; color: #101828; }
      .event { margin-top: 3mm; padding-top: 1.5mm; border-top: .3mm dashed #cbd5e1; color: #475467; font-size: 7pt; }
      .id-caption { margin-top: 1.5mm; }
      .id { margin-top: .5mm; font: 700 6.5pt Consolas, monospace; }
      .qr { width: 20mm; height: 20mm; align-self: start; justify-self: end; padding: .7mm; border: .3mm solid #e4e7ec; border-radius: 1.5mm; }
      .qr svg { display: block; width: 100%; height: 100%; }
    </style>`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Impresion de etiqueta 4 x 2");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.border = "0";
    iframe.style.opacity = "0";

    let cleanupTimer: number | undefined;
    const cleanup = () => {
      if (cleanupTimer !== undefined) window.clearTimeout(cleanupTimer);
      iframe.remove();
    };

    iframe.onload = () => {
      const printWindow = iframe.contentWindow;
      if (!printWindow) return cleanup();
      printWindow.addEventListener("afterprint", cleanup, { once: true });
      cleanupTimer = window.setTimeout(cleanup, 60_000);
      window.setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (error) {
          cleanup();
          throw error;
        }
      }, 250);
    };
    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8">${printCss}</head><body>${printMarkup}</body></html>`;
    document.body.appendChild(iframe);
  }

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
        <div ref={printAreaRef} className="print-area">
          <div className="ticket-card mx-auto aspect-[2/1] w-full max-w-[560px] overflow-hidden rounded-[var(--radius)] border-2 border-[#138f8c] bg-white p-5 text-[#101828] shadow-card-soft">
            <div className="ticket-header flex items-center justify-between border-b-2 border-accent pb-2">
              <div className="flex items-center gap-2">
                <img src="/logo-cf.png" alt="Costa del Faro" className="h-10 w-auto" />
                <div className="text-xs font-bold uppercase tracking-widest text-[#138f8c]">Costa del Faro</div>
              </div>
              {b.tipo && (
                <span className="rounded-full bg-[#ff6b13] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {b.tipo}
                </span>
              )}
            </div>
            <div className="ticket-body grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-5 pt-4">
              <div className="ticket-details min-w-0">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#667085]">Nombre</div>
                  <div className="ticket-name font-display text-2xl font-extrabold leading-tight text-[#101828]">{b.nombre}</div>
                  {b.cedula && <div className="mt-1 font-mono text-base font-bold text-[#101828]">{b.cedula}</div>}
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
                className="ticket-qr h-28 w-28 shrink-0 bg-white [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
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
          <Button onClick={printLabel}>
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
