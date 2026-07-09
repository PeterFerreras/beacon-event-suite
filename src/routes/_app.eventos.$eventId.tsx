import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  LogIn,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { events, guests, type Guest } from "@/lib/mock-data";
import { toast } from "sonner";

type FilterTab = "all" | "guest" | "visitor" | "pending";

export const Route = createFileRoute("/_app/eventos/$eventId")({
  head: () => ({ meta: [{ title: "Detalle de evento - G-Visitantes" }] }),
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = Route.useParams();
  const event = events.find((item) => item.id === eventId);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [attendees, setAttendees] = useState<Guest[]>(() => guests.filter((guest) => guest.eventoId === eventId));
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [visitorForm, setVisitorForm] = useState({ nombre: "", cedula: "", cargo: "", institucion: "", correo: "" });

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

  function toggleArrival(attendee: Guest) {
    const nextArrival = attendee.llegada ? undefined : new Date().toISOString().slice(0, 16).replace("T", " ");
    setAttendees((current) => current.map((item) => item.id === attendee.id ? { ...item, llegada: nextArrival } : item));
    if (nextArrival) {
      setBadge({ id: attendee.id, nombre: attendee.nombre, cargo: attendee.cargo, institucion: attendee.institucion, evento: event.nombre, tipo: attendee.tipo });
      setBadgeOpen(true);
    }
    toast.success(nextArrival ? `Llegada registrada: ${attendee.nombre}` : `Llegada retirada: ${attendee.nombre}`);
  }

  function removeAttendee(id: string) {
    setAttendees((current) => current.filter((item) => item.id !== id));
    toast.success("Registro eliminado");
  }

  function setVisitorField(key: keyof typeof visitorForm, value: string) {
    setVisitorForm((current) => ({ ...current, [key]: value }));
  }

  function registerWalkIn() {
    if (!visitorForm.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const id = `walk-${Date.now().toString(36)}`;
    const next: Guest = {
      id,
      eventoId: event.id,
      nombre: visitorForm.nombre.trim(),
      cedula: visitorForm.cedula.trim() || "Sin documento",
      cargo: visitorForm.cargo.trim() || "Visitante",
      institucion: visitorForm.institucion.trim() || "No especificada",
      correo: visitorForm.correo.trim() || "-",
      tipo: "Protocolo",
      confirmacion: "aceptado",
      llegada: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    setAttendees((current) => [next, ...current]);
    setVisitorOpen(false);
    setVisitorForm({ nombre: "", cedula: "", cargo: "", institucion: "", correo: "" });
    setBadge({ id: next.id, nombre: next.nombre, cargo: next.cargo, institucion: next.institucion, evento: event.nombre, tipo: "Visitante" });
    setBadgeOpen(true);
    toast.success(`Visitante registrado: ${next.nombre}`);
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
            <Button onClick={() => setVisitorOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Registrar visitante</Button>
            <Button variant="outline" onClick={() => toast("Importacion CSV simulada")}><Upload className="mr-2 h-4 w-4" /> Importar lista</Button>
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
          <Badge className="bg-success/15 text-success hover:bg-success/15">{event.estado}</Badge>
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
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, cedula..." className="pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden border-t-2 border-t-primary">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No hay asistentes que coincidan.</div>
        ) : (
          <div className="overflow-x-auto p-4 sm:p-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Llegada</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Hora de registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleArrival(attendee)}
                        className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${
                          attendee.llegada
                            ? "border-success/30 bg-success/15 text-success"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                        aria-label={`Marcar llegada de ${attendee.nombre}`}
                      >
                        <LogIn className="h-4 w-4" />
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
                        ? <span className="inline-flex items-center gap-1.5 text-success"><CheckCircle2 className="h-4 w-4" /> {attendee.llegada.slice(11)}</span>
                        : <span className="text-muted-foreground">Sin registrar</span>}
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
                        <Button variant="ghost" size="icon" aria-label={`Eliminar ${attendee.nombre}`} onClick={() => removeAttendee(attendee.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={visitorOpen} onOpenChange={setVisitorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar visitante al evento</DialogTitle>
            <DialogDescription>Use este flujo para alguien que llego y no estaba en la lista de invitados.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nombre completo</Label>
              <Input value={visitorForm.nombre} onChange={(event) => setVisitorField("nombre", event.target.value)} className="mt-1.5" autoFocus />
            </div>
            <div>
              <Label>Cedula / Documento</Label>
              <Input value={visitorForm.cedula} onChange={(event) => setVisitorField("cedula", event.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input value={visitorForm.cargo} onChange={(event) => setVisitorField("cargo", event.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Institucion</Label>
              <Input value={visitorForm.institucion} onChange={(event) => setVisitorField("institucion", event.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Correo</Label>
              <Input value={visitorForm.correo} onChange={(event) => setVisitorField("correo", event.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVisitorOpen(false)}>Cancelar</Button>
            <Button className="bg-accent text-accent-foreground hover:opacity-90" onClick={registerWalkIn}>Registrar llegada y etiqueta</Button>
          </div>
        </DialogContent>
      </Dialog>
      <BadgePrintModal open={badgeOpen} onOpenChange={setBadgeOpen} data={badge} />
    </div>
  );
}
