import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, CheckCircle2, FileSpreadsheet, FileText, Users, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reportes")({
  head: () => ({ meta: [{ title: "Reportes - G-Visitantes" }] }),
  component: Reportes,
});

const reportes = [
  { key: "visitantes", label: "Visitantes", desc: "Historial completo de visitas registradas.", icon: Users },
  { key: "asistencia", label: "Asistencia por evento", desc: "Registro completo de asistencia por evento.", icon: CalendarCheck },
  { key: "confirmados", label: "Confirmados", desc: "Listado completo de invitados confirmados.", icon: CheckCircle2 },
  { key: "ausentes", label: "Ausentes", desc: "Invitados confirmados que no asistieron.", icon: XCircle },
];

function Reportes() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function generateReport(key: string, format: "csv" | "pdf", label: string) {
    const id = `${key}-${format}`;
    setLoadingKey(id);
    try {
      await apiClient.downloadReport(key, format);
      toast.success(`${label} generado correctamente`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el reporte");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Genere reportes institucionales con todos los datos registrados." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportes.map((r) => (
          <Card key={r.key} className="overflow-hidden border-t-2 border-t-primary transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="font-display text-lg text-foreground">{r.label}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={loadingKey === `${r.key}-csv`}
                onClick={() => generateReport(r.key, "csv", r.label)}
              >
                <FileSpreadsheet className="mr-1 h-4 w-4" />
                Excel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-accent text-accent-foreground hover:opacity-90"
                disabled={loadingKey === `${r.key}-pdf`}
                onClick={() => generateReport(r.key, "pdf", r.label)}
              >
                <FileText className="mr-1 h-4 w-4" />
                PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
