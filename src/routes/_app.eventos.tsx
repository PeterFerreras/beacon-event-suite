import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock, MapPin, Plus, Save, Sun, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EventForm, type NewEventInput } from "@/components/events/EventForm";
import { apiClient, type EventItem, type EventStatus } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/eventos")({
  head: () => ({ meta: [{ title: "Eventos - G-Visitantes" }] }),
  component: Eventos,
});

const badgeByState = {
  activo: "bg-success/15 text-success hover:bg-success/15",
  borrador: "bg-muted text-muted-foreground",
  finalizado: "bg-primary/10 text-primary",
} as const;

function Eventos() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<EventItem | null>(null);
  const { data: eventList = [], isLoading } = useQuery({ queryKey: ["events"], queryFn: apiClient.events });

  const createEvent = useMutation({
    mutationFn: apiClient.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      toast.success("Evento creado");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo crear el evento"),
  });

  const updateEvent = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof apiClient.updateEvent>[1] }) =>
      apiClient.updateEvent(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDetail(updated);
      toast.success("Evento actualizado");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo actualizar el evento"),
  });

  if (pathname !== "/eventos") return <Outlet />;

  async function handleCreate(input: NewEventInput) {
    await createEvent.mutateAsync({
      nombre: input.nombre,
      descripcion: input.descripcion,
      fecha: input.fecha,
      lugar: input.lugar || "Sin ubicacion",
      requiereConfirmacion: true,
      inicio: input.scheduleType === "all_day" ? "00:00" : input.inicio,
      fin: input.scheduleType === "all_day" ? "23:59" : input.fin,
    });
  }

  return (
    <div>
      <PageHeader
        title="Eventos institucionales"
        subtitle="Cree y administre eventos, sesiones, invitados y asistencia."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" /> Nuevo evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Nuevo evento</DialogTitle>
                <DialogDescription>Configura los datos y el horario del evento.</DialogDescription>
              </DialogHeader>
              <EventForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && <Card className="p-6 text-sm text-muted-foreground">Cargando eventos...</Card>}
        {!isLoading && eventList.length === 0 && <Card className="p-6 text-sm text-muted-foreground">No hay eventos registrados.</Card>}
        {eventList.map((event) => (
          <EventCard key={event.id} event={event} onDetail={() => setDetail(event)} />
        ))}
      </div>

      <EventDetailDialog
        event={detail}
        open={!!detail}
        saving={updateEvent.isPending}
        onOpenChange={(next) => !next && setDetail(null)}
        onSave={(id, payload) => updateEvent.mutate({ id, payload })}
      />
    </div>
  );
}

function EventCard({ event, onDetail }: { event: EventItem; onDetail: () => void }) {
  const pct = Math.round((event.confirmados / event.invitados) * 100);
  const mainSession = event.sesiones[0];

  return (
    <Card className="flex flex-col gap-4 overflow-hidden border-t-2 border-t-primary p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="line-clamp-2 text-lg">{event.nombre}</CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              {event.requiereConfirmacion ? "Requiere confirmacion" : "Registro directo"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge className={badgeByState[event.estado]}>{event.estado}</Badge>
          <Link to="/eventos/$eventId" params={{ eventId: event.id }}>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
          </Link>
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <span>{event.fechaInicio}{event.fechaFin !== event.fechaInicio ? ` - ${event.fechaFin}` : ""}</span>
        </div>
        {mainSession && (
          <div className="flex items-center gap-2">
            {mainSession.inicio === "00:00" && mainSession.fin === "23:59" ? (
              <Sun className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span>{mainSession.inicio === "00:00" && mainSession.fin === "23:59" ? "Todo el dia" : `${mainSession.inicio} - ${mainSession.fin}`}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span>{event.lugar}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          <span>{event.invitados} invitados - {event.sesiones.length} sesiones</span>
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Confirmados</span>
            <span className="font-medium text-foreground">{event.confirmados}/{event.invitados}</span>
          </div>
          <Progress value={Number.isFinite(pct) ? pct : 0} className="h-1.5" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onDetail}>
            Ver detalle
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link to="/eventos/$eventId" params={{ eventId: event.id }}>Gestionar</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function EventDetailDialog({
  event,
  open,
  saving,
  onOpenChange,
  onSave,
}: {
  event: EventItem | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, payload: Parameters<typeof apiClient.updateEvent>[1]) => void;
}) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    lugar: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "borrador" as EventStatus,
    requiereConfirmacion: true,
  });

  useEffect(() => {
    if (!event) return;
    setForm({
      nombre: event.nombre,
      descripcion: event.descripcion ?? "",
      lugar: event.lugar,
      fechaInicio: event.fechaInicio,
      fechaFin: event.fechaFin,
      estado: event.estado,
      requiereConfirmacion: event.requiereConfirmacion,
    });
  }, [event]);

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del evento</DialogTitle>
          <DialogDescription>Revise y actualice la informacion principal del evento.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nombre</Label>
            <Input className="mt-1.5" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label>Descripcion</Label>
            <Textarea className="mt-1.5" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
          </div>
          <div>
            <Label>Ubicacion</Label>
            <Input className="mt-1.5" value={form.lugar} onChange={(e) => setForm((f) => ({ ...f, lugar: e.target.value }))} />
          </div>
          <div>
            <Label>Estado</Label>
            <select
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.estado}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as EventStatus }))}
            >
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
          <div>
            <Label>Fecha inicial</Label>
            <Input className="mt-1.5" type="date" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))} />
          </div>
          <div>
            <Label>Fecha final</Label>
            <Input className="mt-1.5" type="date" value={form.fechaFin} onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 rounded-[var(--radius)] border border-border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.requiereConfirmacion}
              onChange={(e) => setForm((f) => ({ ...f, requiereConfirmacion: e.target.checked }))}
            />
            Requiere confirmacion de invitados
          </label>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-3 rounded-[var(--radius)] bg-muted/50 p-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Invitados</div>
            <div className="font-semibold">{event.invitados}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Confirmados</div>
            <div className="font-semibold">{event.confirmados}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Presentes</div>
            <div className="font-semibold">{event.presentes}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button
            disabled={saving}
            onClick={() => {
              if (!form.nombre.trim()) {
                toast.error("El nombre del evento es obligatorio");
                return;
              }
              if (form.fechaFin < form.fechaInicio) {
                toast.error("La fecha final no puede ser anterior a la inicial");
                return;
              }
              onSave(event.id, {
                nombre: form.nombre.trim(),
                descripcion: form.descripcion.trim(),
                lugar: form.lugar.trim() || "Sin ubicacion",
                fechaInicio: form.fechaInicio,
                fechaFin: form.fechaFin,
                estado: form.estado,
                requiereConfirmacion: form.requiereConfirmacion,
              });
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
