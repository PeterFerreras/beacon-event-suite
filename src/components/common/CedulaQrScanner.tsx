import { useEffect, useId, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";

export type CedulaQrResult = { cedula: string; nombre: string };

function titleCase(value: string) {
  return value.trim().toLocaleLowerCase("es-DO").replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("es-DO"));
}

function parseCedulaQr(qrText: string): CedulaQrResult {
  const raw = qrText.trim();
  if (!raw) throw new Error("El QR no contiene datos");
  let cedula = "";
  let nombres: string[] = [];

  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    cedula = String(data.cedula ?? data.documento ?? data.document_id ?? "");
    nombres = [data.nombre, data.nombres, data.apellido, data.apellidos]
      .filter((value): value is string => typeof value === "string" && !!value.trim());
  } catch { /* El QR no usa JSON. */ }

  if (!cedula) {
    try {
      const url = new URL(raw);
      cedula = url.searchParams.get("cedula") ?? url.searchParams.get("documento") ?? "";
      nombres = [url.searchParams.get("nombre"), url.searchParams.get("nombres"), url.searchParams.get("apellido"), url.searchParams.get("apellidos")]
        .filter((value): value is string => !!value?.trim());
    } catch { /* El QR no usa una URL. */ }
  }

  if (!cedula) {
    const parts = raw.split(/[\/|;,\t\n]+/).map((part) => part.trim()).filter(Boolean);
    const documentIndex = parts.findIndex((part) => part.replace(/\D/g, "").length === 11);
    if (documentIndex >= 0) {
      cedula = parts[documentIndex];
      nombres = parts.filter((part, index) => index !== documentIndex && /\p{L}/u.test(part));
    }
  }

  const cleanCedula = cedula.replace(/\D/g, "");
  if (cleanCedula.length !== 11) throw new Error("El QR no contiene una cédula válida de 11 dígitos");
  return { cedula: cleanCedula, nombre: titleCase(nombres.join(" ")) };
}

export function CedulaQrScanner({ onScan }: { onScan: (result: CedulaQrResult) => void | Promise<void> }) {
  const reactId = useId();
  const readerId = `cedula-qr-${reactId.replace(/:/g, "")}`;
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    setStarting(true);
    setError("");
    handled.current = false;

    const start = async () => {
      try {
        if (!window.isSecureContext) throw new Error("La cámara requiere HTTPS o localhost.");
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (!cameras.length) throw new Error("No se encontró ninguna cámara.");
        const preferred = cameras.find((camera) => /back|rear|environment|trasera/i.test(camera.label)) ?? cameras[cameras.length - 1];
        scanner = new Html5Qrcode(readerId, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
        await scanner.start(preferred.id, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 }, async (text) => {
          if (cancelled || handled.current) return;
          try {
            const result = parseCedulaQr(text);
            handled.current = true;
            await onScan(result);
            if (!cancelled) setActive(false);
          } catch (scanError) {
            setError(scanError instanceof Error ? scanError.message : "QR de cédula inválido");
          }
        }, () => undefined);
        if (!cancelled) setStarting(false);
      } catch (startError) {
        if (cancelled) return;
        const raw = startError instanceof Error ? startError.message : String(startError);
        setError(/NotAllowed|Permission|denied/i.test(raw) ? "Permiso de cámara rechazado. Habilítelo en el navegador." : raw);
        setStarting(false);
      }
    };

    const timer = window.setTimeout(() => void start(), 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
  }, [active, onScan, readerId]);

  if (!active) {
    return <Button type="button" variant="outline" onClick={() => setActive(true)}><Camera className="mr-2 h-4 w-4" /> Escanear cédula por QR</Button>;
  }

  return (
    <div className="space-y-3 rounded-[var(--radius)] border p-3 sm:col-span-2">
      {starting && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Abriendo cámara…</p>}
      {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
      <div id={readerId} className={error ? "hidden" : "min-h-64 overflow-hidden rounded-lg bg-black"} />
      <Button type="button" size="sm" variant="outline" onClick={() => setActive(false)}><X className="mr-2 h-4 w-4" /> Cancelar escaneo</Button>
    </div>
  );
}
