import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Upload, Printer, Check, X, Clock, LogIn } from "lucide-react";
import { events, guests, type GuestConfirmation } from "@/lib/mock-data";
import { BadgePrintModal, type BadgeData } from "@/components/labels/BadgePrintModal";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invitados")({
  head: () => ({ meta: [{ title: "Invitados — G-Visitantes" }] }),
  component: Invitados,
});

const confBadge: Record<GuestConfirmation, string> = {
  aceptado: "bg-success/15 text-success",
  tentativo: "bg-warning/15 text-warning",
  rechazado: "bg-destructive/10 text-destructive",
  pendiente: "bg-muted text-muted-foreground",
};

function Invitados() {
  const [evId, setEvId] = useState(events[0].id);
  const [q, setQ] = useState("");
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [open, setOpen] = useState(false);
  const ev = events.find((e) => e.id === evId)!;

  const list = useMemo(() => guests.filter((g) =>
    g.eventoId === evId && (!q || g.nombre.toLowerCase().includes(q.toLowerCase()) || g.cedula.includes(q))
  ), [evId, q]);

  return (
    <div>
      <PageHeader
        title="Invitados"
        subtitle="Administre confirmaciones tipo Outlook e imprima etiquetas de invitados."
        actions={
          <>
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Importar</Button>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90"><Plus className="mr-2 h-4 w-4" /> Agregar invitado</Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <Select value={evId} onValueChange={setEvId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar invitado…" className="pl-9" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invitado</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Confirmación</TableHead>
                  <TableHead>Llegada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>
                      <div className="font-medium text-primary">{g.nombre}</div>
                      <div className="text-xs text-muted-foreground">{g.cargo}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{g.cedula}</TableCell>
                    <TableCell className="text-sm">{g.institucion}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={g.tipo === "VIP" ? "border-gold text-gold" : ""}>{g.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge className={confBadge[g.confirmacion]}>{g.confirmacion}</Badge>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toast.success("Aceptado")}><Check className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toast("Tentativo")}><Clock className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toast.error("Rechazado")}><X className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{g.llegada?.slice(11) ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => toast.success(`Llegada registrada: ${g.nombre}`)}><LogIn className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { setBadge({ id: g.id, nombre: g.nombre, cargo: g.cargo, institucion: g.institucion, evento: ev.nombre, tipo: g.tipo }); setOpen(true); }}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <BadgePrintModal open={open} onOpenChange={setOpen} data={badge} />
    </div>
  );
}
