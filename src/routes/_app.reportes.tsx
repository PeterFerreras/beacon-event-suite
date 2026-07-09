import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Camera, CheckCircle2, FileSpreadsheet, FileText, Users, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { events } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reportes")({
  head: () => ({ meta: [{ title: "Reportes - G-Visitantes" }] }),
  component: Reportes,
});

const reportes = [
  { key: "visitantes", label: "Visitantes", desc: "Historial completo de visitas por rango de fechas.", icon: Users },
  { key: "asistencia", label: "Asistencia por evento", desc: "Registro de asistencia por sesion y corte.", icon: CalendarCheck },
  { key: "confirmados", label: "Confirmados", desc: "Listado de invitados confirmados.", icon: CheckCircle2 },
  { key: "ausentes", label: "Ausentes", desc: "Invitados confirmados que no asistieron.", icon: XCircle },
  { key: "fotografico", label: "Fotografico", desc: "Reporte visual con fotos de visitantes.", icon: Camera },
];

function Reportes() {
  return (
    <div>
      <PageHeader title="Reportes" subtitle="Genere reportes institucionales en Excel o PDF." />

      <Card className="mb-6 overflow-hidden border-t-2 border-t-primary">
        <CardHeader><CardTitle className="font-display text-base">Filtros globales</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div><Label>Desde</Label><Input type="date" className="mt-1.5" /></div>
          <div><Label>Hasta</Label><Input type="date" className="mt-1.5" /></div>
          <div className="sm:col-span-2">
            <Label>Evento</Label>
            <Select><SelectTrigger className="mt-1.5"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportes.map((r) => (
          <Card key={r.key} className="overflow-hidden border-t-2 border-t-primary transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] bg-primary/10 text-primary"><r.icon className="h-5 w-5" /></div>
                <div>
                  <CardTitle className="font-display text-lg text-foreground">{r.label}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success(`Excel: ${r.label} (simulado)`)}>
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
              </Button>
              <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:opacity-90" onClick={() => toast.success(`PDF: ${r.label} (simulado)`)}>
                <FileText className="mr-1 h-4 w-4" /> PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
