import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CalendarCheck, CalendarClock, DoorOpen, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { dashboardStats, events, visitors } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - G-Visitantes Eventos" }] }),
  component: Dashboard,
});

function Dashboard() {
  const dentro = visitors.filter((v) => v.status === "dentro");
  const proximos = events.filter((e) => e.estado !== "finalizado");

  return (
    <div>
      <PageHeader title="Panel institucional" subtitle="Resumen operativo del dia y proximos eventos protocolares." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Visitantes hoy" value={dashboardStats.visitantesHoy} icon={Users} hint="Ultimas 24 h" />
        <StatCard label="Eventos activos" value={dashboardStats.eventosActivos} icon={CalendarCheck} accent />
        <StatCard label="Invitados confirmados" value={dashboardStats.invitadosConfirmados} icon={UserCheck} />
        <StatCard label="Presentes hoy" value={dashboardStats.presentesHoy} icon={Activity} accent />
        <StatCard label="Visitantes dentro" value={dashboardStats.visitantesDentro} icon={DoorOpen} />
        <StatCard label="Proximos eventos" value={dashboardStats.proximosEventos} icon={CalendarClock} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-t-2 border-t-primary lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Visitantes actualmente dentro</CardTitle>
            <Button asChild variant="outline" size="sm"><Link to="/visitantes">Ver todos</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:hidden">
              {dentro.map((v) => (
                <div key={v.id} className="rounded-[var(--radius)] border border-border bg-card p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">{v.nombre}</div>
                      <div className="text-xs text-muted-foreground">{v.cargo}</div>
                    </div>
                    <Badge className="shrink-0 bg-success/15 text-success hover:bg-success/15">Dentro</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><div className="uppercase tracking-widest text-muted-foreground">Institucion</div><div className="mt-1 font-medium">{v.institucion}</div></div>
                    <div><div className="uppercase tracking-widest text-muted-foreground">Entrada</div><div className="mt-1 font-medium">{v.entrada.slice(11)}</div></div>
                    <div className="col-span-2"><div className="uppercase tracking-widest text-muted-foreground">Motivo</div><div className="mt-1">{v.motivo}</div></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitante</TableHead>
                    <TableHead>Institucion</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dentro.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell><div className="font-medium text-foreground">{v.nombre}</div><div className="text-xs text-muted-foreground">{v.cargo}</div></TableCell>
                      <TableCell className="text-sm">{v.institucion}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.motivo}</TableCell>
                      <TableCell className="text-sm">{v.entrada.slice(11)}</TableCell>
                      <TableCell><Badge className="bg-success/15 text-success hover:bg-success/15">Dentro</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-2 border-t-accent">
          <CardHeader><CardTitle className="font-display">Proximos eventos</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {proximos.map((e) => {
              const pct = Math.round((e.confirmados / e.invitados) * 100);
              return (
                <div key={e.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{e.nombre}</div>
                      <div className="text-xs text-muted-foreground">{e.fechaInicio} - {e.lugar}</div>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-accent/40 bg-accent/10 text-accent">
                      {e.estado === "activo" ? "Activo" : "Borrador"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={pct} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{e.confirmados} de {e.invitados} confirmados</div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
