import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Camera, Printer, UserPlus } from "lucide-react";
import { visitors } from "@/lib/mock-data";
import { BadgePrintModal, type BadgeData } from "@/components/labels/BadgePrintModal";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/registro")({
  head: () => ({ meta: [{ title: "Registro de Visitante — G-Visitantes" }] }),
  component: Registro,
});

type Acomp = { id: string; nombre: string; cedula: string };

function Registro() {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ cedula: "", nombre: "", cargo: "", institucion: "", area: "", telefono: "", correo: "", motivo: "" });
  const [acomps, setAcomps] = useState<Acomp[]>([]);
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [open, setOpen] = useState(false);

  const sug = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return visitors.filter((v) => v.cedula.includes(q) || v.nombre.toLowerCase().includes(q)).slice(0, 5);
  }, [query]);

  const load = (id: string) => {
    const v = visitors.find((x) => x.id === id);
    if (!v) return;
    setForm({ cedula: v.cedula, nombre: v.nombre, cargo: v.cargo, institucion: v.institucion, area: v.area, telefono: v.telefono, correo: v.correo, motivo: "" });
    setQuery("");
    toast.success("Datos cargados desde el registro histórico");
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const register = (print = false) => {
    if (!form.nombre || !form.cedula) { toast.error("Cédula y nombre son obligatorios"); return; }
    toast.success("Entrada registrada");
    if (print) {
      setBadge({ id: `V-${Date.now().toString(36)}`, nombre: form.nombre, cargo: form.cargo, institucion: form.institucion, tipo: "Visitante" });
      setOpen(true);
    }
  };

  return (
    <div>
      <PageHeader title="Registro de Visitante" subtitle="Registre visitantes institucionales con documento, motivo y acompañantes." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-display">Datos del visitante</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Buscar por cédula o nombre</Label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Escriba cédula o nombre…" className="pl-9" />
                {sug.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                    {sug.map((v) => (
                      <button key={v.id} type="button" onClick={() => load(v.id)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/10">
                        <div>
                          <div className="font-medium text-primary">{v.nombre}</div>
                          <div className="text-xs text-muted-foreground">{v.cedula} · {v.institucion}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Histórico</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><Label>Cédula / Documento</Label><Input value={form.cedula} onChange={set("cedula")} placeholder="000-0000000-0" className="mt-1.5" /></div>
              <div><Label>Nombre completo</Label><Input value={form.nombre} onChange={set("nombre")} className="mt-1.5" /></div>
              <div><Label>Cargo</Label><Input value={form.cargo} onChange={set("cargo")} className="mt-1.5" /></div>
              <div><Label>Institución</Label><Input value={form.institucion} onChange={set("institucion")} className="mt-1.5" /></div>
              <div><Label>Área a visitar</Label><Input value={form.area} onChange={set("area")} className="mt-1.5" /></div>
              <div><Label>Teléfono</Label><Input value={form.telefono} onChange={set("telefono")} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label>Correo</Label><Input type="email" value={form.correo} onChange={set("correo")} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label>Motivo de la visita</Label><Textarea value={form.motivo} onChange={set("motivo")} rows={3} className="mt-1.5" /></div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Acompañantes</Label>
                <Button size="sm" variant="outline" onClick={() => setAcomps((a) => [...a, { id: crypto.randomUUID(), nombre: "", cedula: "" }])}>
                  <Plus className="mr-1 h-4 w-4" /> Agregar
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {acomps.length === 0 && <p className="text-xs text-muted-foreground">Sin acompañantes.</p>}
                {acomps.map((a, i) => (
                  <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                    <Input placeholder={`Nombre acompañante ${i + 1}`} value={a.nombre} onChange={(e) => setAcomps((arr) => arr.map((x) => x.id === a.id ? { ...x, nombre: e.target.value } : x))} />
                    <Input placeholder="Cédula" value={a.cedula} onChange={(e) => setAcomps((arr) => arr.map((x) => x.id === a.id ? { ...x, cedula: e.target.value } : x))} />
                    <Button variant="ghost" size="icon" onClick={() => setAcomps((arr) => arr.filter((x) => x.id !== a.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Foto y documento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid aspect-square place-items-center rounded-md border-2 border-dashed border-border bg-muted/30 text-muted-foreground">
              <div className="text-center">
                <Camera className="mx-auto h-8 w-8" />
                <div className="mt-2 text-xs">Capturar / subir foto</div>
              </div>
            </div>
            <Button variant="outline" className="w-full">Adjuntar documento</Button>
            <div className="rounded-md border border-gold/40 bg-gold/5 p-3 text-xs text-muted-foreground">
              La foto queda vinculada al histórico del visitante para futuras entradas.
            </div>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button className="bg-primary" onClick={() => register(false)}><UserPlus className="mr-2 h-4 w-4" /> Registrar entrada</Button>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => register(true)}>
                <Printer className="mr-2 h-4 w-4" /> Registrar e imprimir etiqueta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BadgePrintModal open={open} onOpenChange={setOpen} data={badge} />
    </div>
  );
}
