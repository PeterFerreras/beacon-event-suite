import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarDays, MapPin, Users } from "lucide-react";
import { events } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/eventos")({
  head: () => ({ meta: [{ title: "Eventos — G-Visitantes" }] }),
  component: Eventos,
});

const badgeByState = {
  activo: "bg-success/15 text-success hover:bg-success/15",
  borrador: "bg-muted text-muted-foreground",
  finalizado: "bg-primary/10 text-primary",
} as const;

function Eventos() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Eventos institucionales"
        subtitle="Cree y administre eventos, sesiones, invitados y asistencia."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90"><Plus className="mr-2 h-4 w-4" /> Nuevo evento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-display">Crear evento</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Nombre</Label><Input className="mt-1.5" /></div>
                <div><Label>Fecha inicio</Label><Input type="date" className="mt-1.5" /></div>
                <div><Label>Fecha fin</Label><Input type="date" className="mt-1.5" /></div>
                <div className="sm:col-span-2"><Label>Lugar</Label><Input className="mt-1.5" /></div>
                <div>
                  <Label>Estado</Label>
                  <Select defaultValue="borrador"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-3 pb-1">
                  <Switch id="conf" defaultChecked /><Label htmlFor="conf">Requiere confirmación</Label>
                </div>
                <div className="sm:col-span-2"><Label>Sesiones / cortes (una por línea)</Label>
                  <Input placeholder="Ej: Apertura 09:00-10:30" className="mt-1.5" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => { setOpen(false); toast.success("Evento creado (simulado)"); }}>Guardar evento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((e) => {
          const pct = Math.round((e.confirmados / e.invitados) * 100);
          return (
            <Card key={e.id} className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gold" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-lg text-primary">{e.nombre}</CardTitle>
                  <Badge className={badgeByState[e.estado]}>{e.estado}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-gold" />
                  <span>{e.fechaInicio}{e.fechaFin !== e.fechaInicio ? ` — ${e.fechaFin}` : ""}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold" /> <span>{e.lugar}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-gold" /> <span>{e.invitados} invitados · {e.sesiones.length} sesiones</span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Confirmados</span>
                    <span className="font-medium text-primary">{e.confirmados}/{e.invitados}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">Ver detalle</Button>
                  <Button size="sm" className="flex-1">Gestionar</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
