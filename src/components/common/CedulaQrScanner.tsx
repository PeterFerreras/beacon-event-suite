import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  Focus,
  Loader2,
  RefreshCw,
  ScanQrCode,
  SwitchCamera,
  X,
  Zap,
  ZapOff,
  ZoomIn,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats, type CameraDevice } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export type CedulaQrResult = { cedula: string; nombre: string };

type NumericCapability = { min: number; max: number; step?: number };
type ExtendedCapabilities = MediaTrackCapabilities & {
  zoom?: NumericCapability;
  torch?: boolean;
  focusMode?: string[];
};
type ExtendedConstraints = MediaTrackConstraints & { advanced?: Array<Record<string, unknown>> };

function cameraQualityScore(camera: CameraDevice) {
  const label = camera.label.toLocaleLowerCase();
  let score = 0;
  if (/back|rear|environment|trasera|posterior/.test(label)) score += 100;
  if (/main|principal|wide camera|camera 0/.test(label)) score += 35;
  if (/front|user|frontal|selfie/.test(label)) score -= 150;
  if (/macro|ultra.?wide|telephoto|depth|infrared/.test(label)) score -= 40;
  return score;
}

function titleCase(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-DO")
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("es-DO"));
}

function parseCedulaQr(qrText: string): CedulaQrResult {
  const raw = qrText.trim();
  if (!raw) throw new Error("El QR no contiene datos");
  let cedula = "";
  let nombres: string[] = [];

  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    cedula = String(data.cedula ?? data.documento ?? data.document_id ?? "");
    nombres = [data.nombre, data.nombres, data.apellido, data.apellidos].filter(
      (value): value is string => typeof value === "string" && !!value.trim(),
    );
  } catch {
    /* El QR no usa JSON. */
  }

  if (!cedula) {
    try {
      const url = new URL(raw);
      cedula = url.searchParams.get("cedula") ?? url.searchParams.get("documento") ?? "";
      nombres = [
        url.searchParams.get("nombre"),
        url.searchParams.get("nombres"),
        url.searchParams.get("apellido"),
        url.searchParams.get("apellidos"),
      ].filter((value): value is string => !!value?.trim());
    } catch {
      /* El QR no usa una URL. */
    }
  }

  if (!cedula) {
    const possibleDocument = raw.match(/(?:\d[\s-]?){11}/)?.[0];
    if (possibleDocument) cedula = possibleDocument;
  }

  if (!cedula) {
    const parts = raw
      .split(/[/|;,\t\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const documentIndex = parts.findIndex((part) => part.replace(/\D/g, "").length === 11);
    if (documentIndex >= 0) {
      cedula = parts[documentIndex];
      nombres = parts.filter((part, index) => index !== documentIndex && /\p{L}/u.test(part));
    }
  }

  const cleanCedula = cedula.replace(/\D/g, "");
  if (cleanCedula.length !== 11)
    throw new Error("El QR no contiene una cédula válida de 11 dígitos");
  return { cedula: cleanCedula, nombre: titleCase(nombres.join(" ")) };
}

export function CedulaQrScanner({
  onScan,
  onRawScan,
  buttonLabel = "Escanear QR",
}: {
  onScan: (result: CedulaQrResult) => void | Promise<void>;
  onRawScan?: (rawText: string) => boolean | Promise<boolean>;
  buttonLabel?: string;
}) {
  const readerId = `cedula-qr-${useId().replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handled = useRef(false);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [zoomRange, setZoomRange] = useState<NumericCapability | null>(null);
  const [zoom, setZoom] = useState(1);
  const [nativeZoom, setNativeZoom] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torch, setTorch] = useState(false);
  const [focusing, setFocusing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const applyControls = useCallback(
    async (nextZoom = zoom, nextTorch = torch) => {
      const scanner = scannerRef.current;
      if (!scanner?.isScanning) return;
      const video = document.querySelector<HTMLVideoElement>(`#${readerId} video`);
      if (video) {
        video.style.transform = nativeZoom ? "none" : `scale(${nextZoom})`;
        video.style.transition = "transform 180ms ease-out";
      }
      try {
        const cameraCapabilities = scanner.getRunningTrackCameraCapabilities();
        if (cameraCapabilities.zoomFeature().isSupported())
          await cameraCapabilities.zoomFeature().apply(nextZoom);
        if (cameraCapabilities.torchFeature().isSupported())
          await cameraCapabilities.torchFeature().apply(nextTorch);
      } catch {
        // Continúa con las restricciones estándar del navegador.
      }
      const advanced: Record<string, unknown> = {};
      if (nativeZoom) advanced.zoom = nextZoom;
      if (torchAvailable) advanced.torch = nextTorch;
      if (Object.keys(advanced).length)
        await scanner
          .applyVideoConstraints({ advanced: [advanced] } as ExtendedConstraints)
          .catch(() => undefined);
    },
    [nativeZoom, readerId, torch, torchAvailable, zoom],
  );

  const requestFocus = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner?.isScanning) return;
    setFocusing(true);
    try {
      await scanner
        .applyVideoConstraints({ advanced: [{ focusMode: "single-shot" }] } as ExtendedConstraints)
        .catch(() =>
          scanner.applyVideoConstraints({
            advanced: [{ focusMode: "continuous" }],
          } as ExtendedConstraints),
        );
    } catch {
      // Algunos navegadores enfocan al tocar el visor, pero no exponen el control manual.
    } finally {
      window.setTimeout(() => setFocusing(false), 650);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setStarting(true);
    setError("");
    setTorch(false);
    handled.current = false;

    const start = async () => {
      try {
        if (!window.isSecureContext) throw new Error("La cámara requiere HTTPS o localhost.");
        let available = cameras;
        if (!available.length) {
          available = await Html5Qrcode.getCameras();
          if (!available.length) throw new Error("No se encontró ninguna cámara.");
          const initialIndex = available.reduce(
            (bestIndex, camera, index) =>
              cameraQualityScore(camera) > cameraQualityScore(available[bestIndex])
                ? index
                : bestIndex,
            0,
          );
          setCameras(available);
          setCameraIndex(initialIndex);
          if (initialIndex !== cameraIndex) return;
        }
        if (cancelled) return;

        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false,
        });
        scannerRef.current = scanner;
        await scanner.start(
          available[cameraIndex]?.id ?? { facingMode: "environment" },
          {
            fps: 30,
            aspectRatio: 1,
            qrbox: (width, height) => {
              const size = Math.floor(Math.min(width, height) * 0.94);
              return { width: size, height: size };
            },
            videoConstraints: {
              deviceId: { exact: available[cameraIndex].id },
              width: { ideal: 3840, min: 1280 },
              height: { ideal: 2160, min: 720 },
              frameRate: { ideal: 30, min: 15 },
            },
          },
          async (text) => {
            if (cancelled || handled.current) return;
            try {
              if (onRawScan) {
                handled.current = true;
                if (!cancelled) setActive(false);
                if (await onRawScan(text)) return;
              }
              const result = parseCedulaQr(text);
              handled.current = true;
              if (!cancelled) setActive(false);
              await onScan(result);
            } catch (scanError) {
              setError(scanError instanceof Error ? scanError.message : "QR de cédula inválido");
            }
          },
          () => undefined,
        );

        if (cancelled) return;
        const capabilities = scanner.getRunningTrackCapabilities() as ExtendedCapabilities;
        const cameraCapabilities = scanner.getRunningTrackCameraCapabilities();
        const zoomFeature = cameraCapabilities.zoomFeature();
        const range = zoomFeature.isSupported()
          ? { min: zoomFeature.min(), max: zoomFeature.max(), step: zoomFeature.step() }
          : (capabilities.zoom ?? null);
        setZoomRange(range);
        setNativeZoom(!!range);
        setTorchAvailable(
          cameraCapabilities.torchFeature().isSupported() || capabilities.torch === true,
        );
        if (capabilities.focusMode?.includes("continuous")) {
          await scanner
            .applyVideoConstraints({
              advanced: [{ focusMode: "continuous" }],
            } as ExtendedConstraints)
            .catch(() => undefined);
        }
        if (range) {
          const initialZoom = Math.min(range.max, Math.max(range.min, 1));
          setZoom(initialZoom);
        }
        setStarting(false);
      } catch (startError) {
        if (cancelled) return;
        const raw = startError instanceof Error ? startError.message : String(startError);
        setError(
          /NotAllowed|Permission|denied/i.test(raw)
            ? "Permiso de cámara rechazado. Habilítelo en el navegador."
            : raw,
        );
        setStarting(false);
      }
    };

    const timer = window.setTimeout(() => void start(), 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
  }, [active, cameraIndex, cameras, onRawScan, onScan, readerId, retryCount]);

  const changeCamera = () => {
    if (cameras.length > 1) setCameraIndex((index) => (index + 1) % cameras.length);
  };

  return (
    <Dialog open={active} onOpenChange={setActive}>
      <DialogTrigger asChild>
        <Button type="button" className="bg-accent text-accent-foreground hover:opacity-90">
          <ScanQrCode className="mr-2 h-4 w-4" /> {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[95dvh] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Escáner inteligente de cédula
          </DialogTitle>
          <DialogDescription>
            Centre el código dentro del recuadro. Use el zoom si está pequeño o lejos.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-xl bg-black shadow-inner">
          {starting && (
            <div className="absolute inset-0 z-20 grid min-h-72 place-items-center bg-black/80 text-sm text-white">
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Preparando cámara y enfoque…
              </span>
            </div>
          )}
          <div
            id={readerId}
            className="min-h-72 w-full [&_video]:max-h-[62dvh] [&_video]:w-full [&_video]:object-cover"
            onClick={() => void requestFocus()}
          />
          {!starting && !error && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-7 sm:p-12">
              <div className="relative aspect-square w-[min(82%,24rem)]">
                <span className="absolute left-0 top-0 h-14 w-14 rounded-tl-xl border-l-4 border-t-4 border-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,.9)]" />
                <span className="absolute right-0 top-0 h-14 w-14 rounded-tr-xl border-r-4 border-t-4 border-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,.9)]" />
                <span className="absolute bottom-0 left-0 h-14 w-14 rounded-bl-xl border-b-4 border-l-4 border-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,.9)]" />
                <span className="absolute bottom-0 right-0 h-14 w-14 rounded-br-xl border-b-4 border-r-4 border-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,.9)]" />
                <span className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_8px_rgba(52,211,153,.9)]" />
                <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-emerald-500/95 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-lg">
                  BUSCANDO QR
                </span>
              </div>
            </div>
          )}
          {!starting && !error && (
            <div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-center">
              <span className="rounded-full bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur">
                <Focus className="mr-1 inline h-3.5 w-3.5" /> Enfoque continuo activo
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!error && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-3 flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" /> Zoom de cámara
              </Label>
              <span className="text-sm font-semibold tabular-nums">{zoom.toFixed(1)}×</span>
            </div>
            <Slider
              min={zoomRange?.min ?? 1}
              max={zoomRange?.max ?? 3}
              step={zoomRange?.step || 0.1}
              value={[zoom]}
              onValueChange={([value]) => {
                setZoom(value);
                void applyControls(value, torch);
              }}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={starting}
            onClick={() => void requestFocus()}
          >
            {focusing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Focus className="mr-2 h-4 w-4" />
            )}
            {focusing ? "Enfocando…" : "Enfocar ahora"}
          </Button>
          <Button
            type="button"
            variant={torch ? "default" : "outline"}
            disabled={starting || !torchAvailable}
            title={!torchAvailable ? "La linterna no está disponible en esta cámara" : undefined}
            onClick={() => {
              const next = !torch;
              setTorch(next);
              void applyControls(zoom, next);
            }}
          >
            {torch ? <ZapOff className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
            {torch ? "Apagar luz" : "Encender luz"}
          </Button>
          {cameras.length > 1 && (
            <Button type="button" variant="outline" onClick={changeCamera}>
              <SwitchCamera className="mr-2 h-4 w-4" /> Cambiar cámara
            </Button>
          )}
          {error && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError("");
                setRetryCount((count) => count + 1);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="ml-auto"
            onClick={() => setActive(false)}
          >
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Consejo: mantenga el teléfono estable, evite reflejos y acerque el zoom gradualmente hasta
          que el QR se vea nítido.
        </p>
      </DialogContent>
    </Dialog>
  );
}
