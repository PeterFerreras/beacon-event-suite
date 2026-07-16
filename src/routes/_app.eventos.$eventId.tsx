import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Printer,
  Search,
  Sun,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BadgePrintModal, type BadgeData } from "@/components/labels/BadgePrintModal";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type Guest } from "@/lib/api";
import { toast } from "sonner";

type FilterTab = "all" | "guest" | "visitor" | "pending";
type ConfirmAction = { attendee: Guest; kind: "entrada" | "salida" };
type QrCedulaData = { cedula: string; nombre: string };

const QR_READER_ID = "lector-qr-cedula";

function titleCase(value: string) {
  return value.trim().toLocaleLowerCase("es-DO").replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("es-DO"));
}

export function procesarQrCedula(qrText: string): QrCedulaData {
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

export const Route = createFileRoute("/_app/eventos/$eventId")({
  head: () => ({ meta: [{ title: "Detalle de evento - G-Visitantes" }] }),
  component: EventDetail,
});

function displayTime(value?: string | null) {
  if (!value) return "";
  return value.includes(" ") ? value.slice(11, 16) : value.slice(11, 16) || value;
}

function EventDetail() {
  const { eventId } = Route.useParams();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [visitorForm, setVisitorForm] = useState({ nombre: "", cedula: "", cargo: "", institucion: "", correo: "" });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerStarting, setScannerStarting] = useState(false);
  const [buscandoPadron, setBuscandoPadron] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const scanHandledRef = useRef(false);

  const eventQuery = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiClient.event(eventId),
  });
  const attendeesQuery = useQuery({
    queryKey: ["guests", eventId],
    queryFn: () => apiClient.guests(eventId),
  });

  const event = eventQuery.data;
  const attendees = attendeesQuery.data ?? [];
  const finalized = event?.estado === "finalizado";

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const checkIn = useMutation({
    mutationFn: (attendee: Guest) => apiClient.checkInGuest(attendee.id),
    onSuccess: (_, attendee) => {
      invalidate();
      setBadge({ id: attendee.id, nombre: attendee.nombre, cargo: attendee.cargo, institucion: attendee.institucion, evento: event?.nombre, tipo: attendee.tipo });
      setBadgeOpen(true);
      toast.success(`Entrada registrada: ${attendee.nombre}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo registrar la entrada"),
  });

  const checkOut = useMutation({
    mutationFn: (attendee: Guest) => apiClient.checkOutGuest(attendee.id),
    onSuccess: (_, attendee) => {
      invalidate();
      toast.success(`Salida registrada: ${attendee.nombre}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo registrar la salida"),
  });

  const removeGuest = useMutation({
    mutationFn: apiClient.deleteGuest,
    onSuccess: () => {
      invalidate();
      toast.success("Registro eliminado");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo eliminar el registro"),
  });

  const createWalkIn = useMutation({
    mutationFn: () => apiClient.createWalkIn(eventId, visitorForm),
    onSuccess: (next) => {
      invalidate();
      setVisitorOpen(false);
      setVisitorForm({ nombre: "", cedula: "", cargo: "", institucion: "", correo: "" });
      setBadge({ id: next.id, nombre: next.nombre, cargo: next.cargo, institucion: next.institucion, evento: event?.nombre, tipo: "Visitante" });
      setBadgeOpen(true);
      toast.success(`Visitante registrado: ${next.nombre}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo registrar el visitante"),
  });

  const finalizeEvent = useMutation({
    mutationFn: () => apiClient.updateEvent(eventId, { estado: "finalizado" }),
    onSuccess: () => {
      invalidate();
      setFinalizeOpen(false);
      toast.success("Evento finalizado");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo finalizar el evento"),
  });
  useEffect(() => {
    if (!scannerOpen) return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    scanHandledRef.current = false;
    setScannerError("");
    setScannerStarting(true);

    const startScanner = async () => {
      try {
        if (!window.isSecureContext) {
          throw new Error("La cámara solo funciona en una conexión HTTPS o en localhost.");
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Este navegador no permite acceder a la cámara.");
        }

        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (!cameras.length) throw new Error("No se encontró ninguna cámara disponible.");

        const backCamera = cameras.find((camera) => /back|rear|environment|trasera/i.test(camera.label));
        const cameraId = (backCamera ?? cameras[cameras.length - 1]).id;
        scanner = new Html5Qrcode(QR_READER_ID, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
          async (qrText) => {
            if (cancelled || scanHandledRef.current) return;

            let persona: QrCedulaData;
            try {
              persona = procesarQrCedula(qrText);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "QR de cédula inválido");
              return;
            }

            scanHandledRef.current = true;
            setVisitorForm((current) => ({ ...current, cedula: persona.cedula, nombre: persona.nombre || current.nombre }));

            if (!persona.nombre) {
              try {
                const padron = await apiClient.padronBuscar(persona.cedula);
                if (!cancelled) setVisitorForm((current) => ({ ...current, nombre: padron.nombre || current.nombre }));
              } catch {
                toast.info("Cédula leída. Complete el nombre manualmente.");
              }
            }

            toast.success("Cédula escaneada correctamente");
            setScannerOpen(false);
          },
          () => undefined,
        );
        if (cancelled && scanner.isScanning) await scanner.stop();
        if (!cancelled) setScannerStarting(false);
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        const rawMessage = error instanceof Error ? error.message : String(error);
        const message = /NotAllowed|Permission|denied|permiso/i.test(rawMessage)
          ? "Permiso de cámara rechazado. Habilítelo en la configuración del navegador y vuelva a intentar."
          : /NotFound|DevicesNotFound/i.test(rawMessage)
            ? "No se encontró una cámara en este dispositivo."
            : rawMessage || "No se pudo iniciar la cámara.";
        setScannerStarting(false);
        setScannerError(message);
        toast.error(message);
      }
    };

    // Espera a que Radix Dialog termine de montar el contenedor. También evita
    // el doble arranque que React StrictMode ejecuta durante el desarrollo.
    const timer = window.setTimeout(() => void startScanner(), 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
  }, [scannerOpen]);
  const stats = useMemo(() => ({
    total: attendees.length,
    guests: attendees.filter((item) => item.tipo !== "Protocolo").length,
    visitors: attendees.filter((item) => item.tipo === "Protocolo").length,
    checkedIn: attendees.filter((item) => !!item.llegada).length,
    pending: attendees.filter((item) => !item.llegada).length,
  }), [attendees]);

  const filtered = useMemo(() => {
    let list = attendees;
    if (tab === "guest") list = list.filter((item) => item.tipo !== "Protocolo");
    if (tab === "visitor") list = list.filter((item) => item.tipo === "Protocolo");
    if (tab === "pending") list = list.filter((item) => !item.llegada);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((item) =>
        item.nombre.toLowerCase().includes(q) ||
        item.cedula.includes(q) ||
        item.institucion.toLowerCase().includes(q) ||
        item.correo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [attendees, query, tab]);

  if (eventQuery.isLoading) {
    return <Card className="border-t-2 border-t-primary p-10 text-center text-sm text-muted-foreground">Cargando evento...</Card>;
  }

  if (!event) {
    return (
      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/eventos"><ArrowLeft className="h-4 w-4" /> Eventos</Link>
        </Button>
        <Card className="border-t-2 border-t-primary p-10 text-center text-sm text-muted-foreground">
          Evento no encontrado.
        </Card>
      </div>
    );
  }

  const mainSession = event.sesiones[0];
  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: stats.total },
    { key: "guest", label: "Invitados", count: stats.guests },
    { key: "visitor", label: "Visitantes", count: stats.visitors },
    { key: "pending", label: "Pendientes", count: stats.pending },
  ];

  function requestToggle(attendee: Guest) {
    if (finalized) {
      toast.error("El evento está finalizado. No se pueden registrar movimientos.");
      return;
    }
    if (attendee.llegada && attendee.salida) {
      toast("Este invitado ya registró entrada y salida.");
      return;
    }
    setConfirmAction({ attendee, kind: attendee.llegada ? "salida" : "entrada" });
  }

  function performToggle() {
    if (!confirmAction) return;
    if (confirmAction.kind === "entrada") {
      checkIn.mutate(confirmAction.attendee);
    } else {
      checkOut.mutate(confirmAction.attendee);
    }
    setConfirmAction(null);
  }

  function setVisitorField(key: keyof typeof visitorForm, value: string) {
    setVisitorForm((current) => ({ ...current, [key]: value }));
  }
async function consultarCedula() {
  if (!visitorForm.cedula.trim()) {
    toast.error("Ingrese una cédula");
    return;
  }

  try {
    setBuscandoPadron(true);

    const persona = await apiClient.padronBuscar(visitorForm.cedula);

    setVisitorForm((current) => ({
      ...current,
      nombre: persona.nombre || current.nombre,
    }));

    toast.success("Datos cargados desde el padrón");
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "No se encontró la cédula en el padrón"
    );
  } finally {
    setBuscandoPadron(false);
  }
}

function escanearCedula() {
  setScannerError("");
  setScannerOpen(true);
}

  function registerWalkIn() {
    if (finalized) {
      toast.error("El evento está finalizado.");
      return;
    }
    if (!visitorForm.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    createWalkIn.mutate();
  }

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4">
        <Link to="/eventos"><ArrowLeft className="h-4 w-4" /> Eventos</Link>
      </Button>

      <PageHeader
        title={event.nombre}
        subtitle="Gestiona la lista de invitados, visitantes y registro de llegada."
        actions={
          <>
            <Button onClick={() => setVisitorOpen(true)} disabled={finalized}>
              <UserPlus className="mr-2 h-4 w-4" /> Registrar visitante
            </Button>
            <Button variant="outline" onClick={() => toast("Importacion CSV pendiente")} disabled={finalized}>
              <Upload className="mr-2 h-4 w-4" /> Importar lista
            </Button>
            {finalized ? (
              <Button variant="outline" disabled>
                <Lock className="mr-2 h-4 w-4" /> Evento finalizado
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setFinalizeOpen(true)}>
                <Lock className="mr-2 h-4 w-4" /> Finalizar evento
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-6 overflow-hidden border-t-2 border-t-primary p-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> {event.fechaInicio}</span>
          {mainSession && (
            <span className="flex items-center gap-1.5">
              {mainSession.inicio === "00:00" && mainSession.fin === "23:59"
                ? <Sun className="h-4 w-4 text-primary" />
                : <Clock className="h-4 w-4 text-primary" />}
              {mainSession.inicio === "00:00" && mainSession.fin === "23:59" ? "Todo el dia" : `${mainSession.inicio} - ${mainSession.fin}`}
            </span>
          )}
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {event.lugar}</span>
          {finalized ? (
            <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">finalizado</Badge>
          ) : (
            <Badge className="bg-success/15 text-success hover:bg-success/15">{event.estado}</Badge>
          )}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={Users} />
        <StatCard label="Registrados" value={stats.checkedIn} icon={CheckCircle2} accent />
        <StatCard label="Invitados" value={stats.guests} icon={UserPlus} />
        <StatCard label="Pendientes" value={stats.pending} icon={Clock} accent />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === item.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground shadow-card-soft hover:bg-muted"
              }`}
            >
              {item.label}
              <span className={`rounded-full px-1.5 text-xs ${tab === item.key ? "bg-primary-foreground/20" : "bg-muted"}`}>{item.count}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(inputEvent) => setQuery(inputEvent.target.value)} placeholder="Buscar por nombre, cedula..." className="pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden border-t-2 border-t-primary">
        {attendeesQuery.isLoading || filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {attendeesQuery.isLoading ? "Cargando asistentes..." : "No hay asistentes que coincidan."}
          </div>
        ) : (
          <div className="overflow-x-auto p-4 sm:p-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((attendee) => {
                  const hasEntry = !!attendee.llegada;
                  const hasExit = !!attendee.salida;
                  const btnClass = hasExit
                    ? "border-destructive/30 bg-destructive/15 text-destructive"
                    : hasEntry
                      ? "border-success/30 bg-success/15 text-success"
                      : "border-border bg-card text-muted-foreground hover:bg-muted";
                  const btnIcon = hasEntry && !hasExit ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />;
                  const btnLabel = hasExit
                    ? `${attendee.nombre} ya registró salida`
                    : hasEntry
                      ? `Registrar salida de ${attendee.nombre}`
                      : `Registrar entrada de ${attendee.nombre}`;
                  return (
                    <TableRow key={attendee.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => requestToggle(attendee)}
                          disabled={finalized || (hasEntry && hasExit)}
                          className={`grid h-8 w-8 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${btnClass}`}
                          aria-label={btnLabel}
                          title={btnLabel}
                        >
                          {btnIcon}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{attendee.nombre}</div>
                        <div className="text-xs text-muted-foreground">{attendee.institucion}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{attendee.correo}</div>
                        <div className="text-xs">{attendee.cedula}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={attendee.tipo === "VIP" ? "border-accent/40 bg-accent/10 text-accent" : ""}>{attendee.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        {attendee.llegada
                          ? <span className="inline-flex items-center gap-1.5 text-success"><CheckCircle2 className="h-4 w-4" /> {displayTime(attendee.llegada)}</span>
                          : <span className="text-muted-foreground">Sin registrar</span>}
                      </TableCell>
                      <TableCell>
                        {attendee.salida
                          ? <span className="inline-flex items-center gap-1.5 text-destructive"><LogOut className="h-4 w-4" /> {displayTime(attendee.salida)}</span>
                          : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Etiqueta ${attendee.nombre}`}
                            onClick={() => {
                              setBadge({ id: attendee.id, nombre: attendee.nombre, cargo: attendee.cargo, institucion: attendee.institucion, evento: event.nombre, tipo: attendee.tipo });
                              setBadgeOpen(true);
                            }}
                          >
                            <Printer className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={`Eliminar ${attendee.nombre}`} onClick={() => removeGuest.mutate(attendee.id)} disabled={finalized}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={visitorOpen} onOpenChange={(open) => {
        setVisitorOpen(open);
        if (!open) setScannerOpen(false);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar visitante al evento</DialogTitle>
            <DialogDescription>Use este flujo para alguien que llego y no estaba en la lista de invitados.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
  <Button
    type="button"
    variant="outline"
    onClick={escanearCedula}
  >
    Escanear cédula
  </Button>
  {scannerOpen && (
  <div className="mt-4">
    {scannerStarting && <p className="mb-2 text-sm text-muted-foreground">Solicitando acceso a la cámara…</p>}
    {scannerError && (
      <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        <p>{scannerError}</p>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => {
          setScannerOpen(false);
          window.setTimeout(() => setScannerOpen(true), 0);
        }}>
          Reintentar
        </Button>
      </div>
    )}
    <div
      id={QR_READER_ID}
      className={scannerError ? "hidden" : "min-h-64 overflow-hidden rounded-lg border bg-black"}
    />
    
    <Button
      type="button"
      variant="outline"
      className="mt-3"
      onClick={() => setScannerOpen(false)}
    >
      Cancelar escaneo
    </Button>
  </div>
)}
</div>
            <div className="sm:col-span-2">
              <Label>Nombre completo</Label>
              <Input value={visitorForm.nombre} onChange={(inputEvent) => setVisitorField("nombre", inputEvent.target.value)} className="mt-1.5" autoFocus />
            </div>
            <div>
  <Label>Cedula / Documento</Label>

  <div className="mt-1.5 flex gap-2">
    <Input
      value={visitorForm.cedula}
      onChange={(inputEvent) =>
        setVisitorField("cedula", inputEvent.target.value)
      }
    />

    <Button
      type="button"
      variant="outline"
      onClick={consultarCedula}
      disabled={buscandoPadron}
    >
      <Search className="h-4 w-4" />
    </Button>
  </div>
</div>
            <div>
              <Label>Cargo</Label>
              <Input value={visitorForm.cargo} onChange={(inputEvent) => setVisitorField("cargo", inputEvent.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Institucion</Label>
              <Input value={visitorForm.institucion} onChange={(inputEvent) => setVisitorField("institucion", inputEvent.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Correo</Label>
              <Input value={visitorForm.correo} onChange={(inputEvent) => setVisitorField("correo", inputEvent.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVisitorOpen(false)}>Cancelar</Button>
            <Button className="bg-accent text-accent-foreground hover:opacity-90" onClick={registerWalkIn} disabled={createWalkIn.isPending}>
              Registrar llegada y etiqueta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirmar {confirmAction?.kind === "entrada" ? "entrada" : "salida"}
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de registrar la {confirmAction?.kind} del siguiente invitado?
            </DialogDescription>
          </DialogHeader>
          {confirmAction && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <div className="text-base font-semibold text-foreground">{confirmAction.attendee.nombre}</div>
              <div className="mt-1 text-muted-foreground">{confirmAction.attendee.cargo} · {confirmAction.attendee.institucion}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground">Cédula:</span> {confirmAction.attendee.cedula}</div>
                <div><span className="font-medium text-foreground">Tipo:</span> {confirmAction.attendee.tipo}</div>
                <div className="col-span-2"><span className="font-medium text-foreground">Correo:</span> {confirmAction.attendee.correo}</div>
                {confirmAction.attendee.llegada && (
                  <div className="col-span-2"><span className="font-medium text-foreground">Entrada:</span> {confirmAction.attendee.llegada}</div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              className={confirmAction?.kind === "salida" ? "bg-destructive text-destructive-foreground hover:opacity-90" : ""}
              onClick={performToggle}
              disabled={checkIn.isPending || checkOut.isPending}
            >
              Confirmar {confirmAction?.kind}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar evento</DialogTitle>
            <DialogDescription>
              Una vez finalizado no se podrán registrar entradas ni salidas, ni agregar nuevos invitados. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => finalizeEvent.mutate()} disabled={finalizeEvent.isPending}>
              <Lock className="mr-2 h-4 w-4" /> Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BadgePrintModal open={badgeOpen} onOpenChange={setBadgeOpen} data={badge} />
    </div>
  );
}
