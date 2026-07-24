import { lazy, Suspense } from "react";
import type { CedulaQrResult } from "@/components/common/CedulaQrScanner";

const Scanner = lazy(() =>
  import("@/components/common/CedulaQrScanner").then((module) => ({
    default: module.CedulaQrScanner,
  })),
);

export function LazyCedulaQrScanner({
  onScan,
  onRawScan,
  buttonLabel,
}: {
  onScan: (result: CedulaQrResult) => void | Promise<void>;
  onRawScan?: (rawText: string) => boolean | Promise<boolean>;
  buttonLabel?: string;
}) {
  return (
    <Suspense
      fallback={
        <button type="button" disabled className="h-10 rounded-md border px-4 text-sm opacity-60">
          Cargando escáner...
        </button>
      }
    >
      <Scanner onScan={onScan} onRawScan={onRawScan} buttonLabel={buttonLabel} />
    </Suspense>
  );
}

export type { CedulaQrResult };
