import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Plus, Printer, Search, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BadgePrintModal, type BadgeData } from "@/components/labels/BadgePrintModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, padronFotoUrl } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/registro")({ head: () => ({ meta: [{ title: "Registro de Visitante - G-Visitantes" }] }), component: Registro });
type Acomp = { id: string; nombre: string; cedula: string };

function Registro() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ cedula: "", nombre: "", cargo: "", institucion: "", area: "", telefono: "", correo: "", motivo: "" });
  const [foto, setFoto] = useState<string | null>(null);
  const [acomps, setAcomps] = useState<Acomp[]>([]);
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [open, setOpen] = useState(false);
  const [padronLoading, setPadronLoading] = useState(false);
  const [lastLookup, setLastLookup] = useState("");

  const { data: sug = [] } = useQuery({ queryKey: ["visitors-search", query], queryFn: () => apiClient.searchVisitors(query), enabled: query.trim().length > 1 });
  const createVisitor = useMutation({
    mutationFn: apiClient.createVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Entrada registrada");
      setForm({ cedula: "", nombre: "", cargo: "", institucion: "", area: "", telefono: "", correo: "", motivo: "" });
      setFoto(null);
      setAcomps([]);
    },
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Auto-consulta al padron cuando la cedula llega a 11 digitos
  useEffect(() => {
    const cedula = form.cedula.replace(/\D/g, "");
    if (cedula.length !== 11 || cedula === lastLookup) return;
    setLastLookup(cedula);
    setPadronLoading(true);
    apiClient.padronBuscar(cedula)
      .then((persona) => {
        setForm((f) => ({ ...f, cedula, nombre: f.nombre || persona.nombre }));
        setFoto(padronFotoUrl(cedula));
        toast.success(`Padron: ${persona.nombre}`);
      })
      .catch((err: Error) => {
        toast.error(err.message || "No se encontro en padron");
      })
      .finally(() => setPadronLoading(false));
  }, [form.cedula, lastLookup]);

  const load = (id: string) => {
    const v = sug.find((x) => x.id === id || x.visitanteId === id);
    if (!v) return;
    setForm({ cedula: v.cedula, nombre: v.nombre, cargo: v.cargo, institucion: v.institucion, area: v.area ?? "", telefono: v.telefono, correo: v.correo, motivo: "" });
    setFoto(v.foto || padronFotoUrl(v.cedula) || null);
    setQuery("");
    toast.success("Datos cargados desde el registro historico");
  };

  const register = (print = false) => {
    if (!form.nombre || !form.cedula) { toast.error("Cedula y nombre son obligatorios"); return; }
    createVisitor.mutate(
      { ...form, foto: foto ?? null, acompanantes: acomps.map(({ nombre, cedula }) => ({ nombre, cedula })) },
      { onSuccess: (visitor) => { if (print) { setBadge({ id: visitor.id, nombre: visitor.nombre, cargo: visitor.cargo, institucion: visitor.institucion, tipo: "Visitante" }); setOpen(true); } } },
    );
  };

  return (
    <div>
      <PageHeader title="Registro de visitante" subtitle="Registre visitantes institucionales con documento, motivo y acompanantes." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-t-2 border-t-primary lg:col-span-2">
          <CardHeader><CardTitle className="font-display">Datos del visitante</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Buscar por cedula o nombre</Label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Escriba cedula o nombre..." className="pl-9" />
                {sug.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-[var(--radius)] border bg-popover shadow-md">
                    {sug.map((v) => (
                      <button key={v.id} type="button" onClick={() => load(v.id)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-primary/10">
                        <div>
                          <div className="font-medium text-foreground">{v.nombre}</div>
                          <div className="text-xs text-muted-foreground">{v.cedula} - {v.institucion}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Historico</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Cedula / Documento {padronLoading && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}</Label>
                <Input value={form.cedula} onChange={set("cedula")} className="mt-1.5" placeholder="11 digitos" />
              </div>
              <div><Label>Nombre completo</Label><Input value={form.nombre} onChange={set("nombre")} className="mt-1.5" /></div>
              <div><Label>Cargo</Label><Input value={form.cargo} onChange={set("cargo")} className="mt-1.5" /></div>
              <div><Label>Institucion</Label><Input value={form.institucion} onChange={set("institucion")} className="mt-1.5" /></div>
              <div><Label>Area a visitar</Label><Input value={form.area} onChange={set("area")} className="mt-1.5" /></div>
              <div><Label>Telefono</Label><Input value={form.telefono} onChange={set("telefono")} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label>Correo</Label><Input type="email" value={form.correo} onChange={set("correo")} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label>Motivo de la visita</Label><Textarea value={form.motivo} onChange={set("motivo")} rows={3} className="mt-1.5" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Acompanantes</Label>
                <Button size="sm" variant="outline" onClick={() => setAcomps((a) => [...a, { id: crypto.randomUUID(), nombre: "", cedula: "" }])}><Plus className="mr-1 h-4 w-4" /> Agregar</Button>
              </div>
              <div className="mt-2 space-y-2">
                {acomps.length === 0 && <p className="text-xs text-muted-foreground">Sin acompanantes.</p>}
                {acomps.map((a, i) => (
                  <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                    <Input placeholder={`Nombre acompanante ${i + 1}`} value={a.nombre} onChange={(e) => setAcomps((arr) => arr.map((x) => x.id === a.id ? { ...x, nombre: e.target.value } : x))} />
                    <Input placeholder="Cedula" value={a.cedula} onChange={(e) => setAcomps((arr) => arr.map((x) => x.id === a.id ? { ...x, cedula: e.target.value } : x))} />
                    <Button variant="ghost" size="icon" onClick={() => setAcomps((arr) => arr.filter((x) => x.id !== a.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-t-2 border-t-accent">
          <CardHeader><CardTitle className="font-display">Foto y documento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid aspect-square place-items-center overflow-hidden rounded-[var(--radius)] border-2 border-dashed border-primary/25 bg-primary/5 text-muted-foreground">
              {foto ? (
                <img
                  src={foto}
                  alt={form.nombre || "Foto padron"}
                  className="h-full w-full object-cover"
                  onError={() => setFoto(null)}
                />
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto h-8 w-8 text-primary" />
                  <div className="mt-2 text-xs">{padronLoading ? "Consultando padron..." : "Capturar / subir foto"}</div>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full">Adjuntar documento</Button>
            <div className="rounded-[var(--radius)] border border-accent/25 bg-accent/10 p-3 text-xs text-muted-foreground">
              La foto se carga automaticamente desde el padron cuando la cedula tiene 11 digitos.
            </div>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <Button onClick={() => register(false)}><UserPlus className="mr-2 h-4 w-4" /> Registrar entrada</Button>
              <Button className="bg-accent text-accent-foreground hover:opacity-90" onClick={() => register(true)}><Printer className="mr-2 h-4 w-4" /> Registrar e imprimir etiqueta</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <BadgePrintModal open={open} onOpenChange={setOpen} data={badge} />
    </div>
  );
}
