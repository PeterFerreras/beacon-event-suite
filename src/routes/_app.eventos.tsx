import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EventForm, type NewEventInput } from "@/components/events/EventForm";
import { ArrowRight, CalendarDays, Clock, MapPin, Plus, Sun, Users } from "lucide-react";
import { events as seedEvents, type EventItem } from "@/lib/mock-data";
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
  const [open, setOpen] = useState(false);
  const [eventList, setEventList] = useState<EventItem[]>(seedEvents);

  if (pathname !== "/eventos") {
    return <Outlet />;
  }

  async function handleCreate(input: NewEventInput) {
    const next: EventItem = {
      id: `e${Date.now().toString(36)}`,
      nombre: input.nombre,
      fechaInicio: input.fecha,
      fechaFin: input.fecha,
      lugar: input.lugar || "Sin ubicacion",
      estado: "borrador",
      requiereConfirmacion: true,
      invitados: 0,
      confirmados: 0,
      presentes: 0,
      sesiones: [
        {
          id: `s${Date.now().toString(36)}`,
          nombre: input.scheduleType === "all_day" ? "Todo el dia" : "Horario principal",
          dia: input.fecha,
          inicio: input.inicio ?? "00:00",
          fin: input.fin ?? "23:59",
        },
      ],
    };

    setEventList((current) => [next, ...current]);
    setOpen(false);
    toast.success("Evento creado");
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
        {eventList.map((e) => {
          const pct = Math.round((e.confirmados / e.invitados) * 100);
          const mainSession = e.sesiones[0];
          return (
            <Card key={e.id} className="flex flex-col gap-4 overflow-hidden border-t-2 border-t-primary p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="line-clamp-2 text-lg">{e.nombre}</CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {e.requiereConfirmacion ? "Requiere confirmacion" : "Registro directo"}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={badgeByState[e.estado]}>{e.estado}</Badge>
                  <Link to="/eventos/$eventId" params={{ eventId: e.id }} aria-label={`Abrir ${e.nombre}`}>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
                  </Link>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                  <span>{e.fechaInicio}{e.fechaFin !== e.fechaInicio ? ` - ${e.fechaFin}` : ""}</span>
                </div>
                {mainSession && (
                  <div className="flex items-center gap-2">
                    {mainSession.inicio === "00:00" && mainSession.fin === "23:59"
                      ? <Sun className="h-4 w-4 shrink-0 text-primary" />
                      : <Clock className="h-4 w-4 shrink-0 text-primary" />}
                    <span>{mainSession.inicio === "00:00" && mainSession.fin === "23:59" ? "Todo el dia" : `${mainSession.inicio} - ${mainSession.fin}`}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span>{e.lugar}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" />
                  <span>{e.invitados} invitados - {e.sesiones.length} sesiones</span>
                </div>
              </div>

              <div className="mt-auto space-y-3 border-t border-border pt-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Confirmados</span>
                    <span className="font-medium text-foreground">{e.confirmados}/{e.invitados}</span>
                  </div>
                  <Progress value={Number.isFinite(pct) ? pct : 0} className="h-1.5" />
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/eventos/$eventId" params={{ eventId: e.id }}>Ver detalle</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/eventos/$eventId" params={{ eventId: e.id }}>Gestionar</Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
