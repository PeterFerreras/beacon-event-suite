import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { QrMock } from "@/components/common/QrMock";
import { BadgePrintModal, type BadgeData } from "@/components/labels/BadgePrintModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/etiquetas")({
  head: () => ({ meta: [{ title: "Etiquetas - G-Visitantes" }] }),
  component: Etiquetas,
});

const variantes = [
  { key: "VIP", desc: "Etiqueta protocolar con acento destacado" },
  { key: "Estandar", desc: "Etiqueta generica para invitados" },
  { key: "Prensa", desc: "Etiqueta para medios de comunicacion" },
  { key: "Protocolo", desc: "Etiqueta para personal de protocolo" },
] as const;

function Etiquetas() {
  const [form, setForm] = useState({ nombre: "Maria Fernandez Reyes", cargo: "Directora de Comunicacion", institucion: "Ministerio de Cultura", evento: "Cumbre Iberoamericana de Cultura 2026", tipo: "VIP" });
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader title="Etiquetas" subtitle="Genere e imprima etiquetas con QR para visitantes e invitados." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-t-2 border-t-primary lg:col-span-2">
          <CardHeader><CardTitle className="font-display">Datos de la etiqueta</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nombre</Label><Input value={form.nombre} onChange={set("nombre")} className="mt-1.5" /></div>
            <div><Label>Cargo</Label><Input value={form.cargo} onChange={set("cargo")} className="mt-1.5" /></div>
            <div><Label>Institucion</Label><Input value={form.institucion} onChange={set("institucion")} className="mt-1.5" /></div>
            <div><Label>Evento</Label><Input value={form.evento} onChange={set("evento")} className="mt-1.5" /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{variantes.map((v) => <SelectItem key={v.key} value={v.key}>{v.key}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-2">
              <Button className="bg-accent text-accent-foreground hover:opacity-90" onClick={() => { setBadge({ id: "E-" + Date.now().toString(36), ...form }); setOpen(true); }}>
                <Printer className="mr-2 h-4 w-4" /> Vista previa e imprimir
              </Button>
            </div>
            <div className="sm:col-span-2 grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
              {variantes.map((v) => (
                <button key={v.key} onClick={() => setForm((f) => ({ ...f, tipo: v.key }))}
                  className={`rounded-[var(--radius)] border p-3 text-left transition ${form.tipo === v.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                  <div className="font-medium">{v.key}</div>
                  <div className="text-xs text-muted-foreground">{v.desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-2 border-t-accent">
          <CardHeader><CardTitle className="font-display">Vista previa</CardTitle></CardHeader>
          <CardContent>
            <div className="mx-auto w-full max-w-[300px] rounded-[var(--radius)] border-2 border-primary bg-white p-4 shadow-card-soft">
              <div className="flex items-center justify-between border-b-2 border-accent pb-2">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Costa del Faro</div>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">{form.tipo}</span>
              </div>
              <div className="mt-3 font-display text-lg font-semibold text-foreground">{form.nombre}</div>
              <div className="text-xs text-muted-foreground">{form.cargo}</div>
              <div className="mt-1 text-xs text-foreground">{form.institucion}</div>
              <div className="mt-3 border-t border-dashed pt-2 text-xs text-muted-foreground">{form.evento}</div>
              <div className="mt-3 flex justify-center"><QrMock value={form.nombre + form.evento} size={100} /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BadgePrintModal open={open} onOpenChange={setOpen} data={badge} />
    </div>
  );
}
