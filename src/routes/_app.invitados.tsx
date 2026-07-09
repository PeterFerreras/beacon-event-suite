import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Clock, LogIn, Mail, Plus, Printer, Search, Send, Upload, X } from "lucide-react";
import { events, guests, type Guest, type GuestConfirmation } from "@/lib/mock-data";
import { BadgePrintModal, type BadgeData } from "@/components/labels/BadgePrintModal";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invitados")({
  head: () => ({ meta: [{ title: "Invitados - G-Visitantes" }] }),
  component: Invitados,
});

const confBadge: Record<GuestConfirmation, string> = {
  aceptado: "bg-success/15 text-success",
  tentativo: "bg-accent/15 text-accent",
  rechazado: "bg-destructive/10 text-destructive",
  pendiente: "bg-muted text-muted-foreground",
};

function Invitados() {
  const [evId, setEvId] = useState(events[0].id);
  const [q, setQ] = useState("");
  const [guestList, setGuestList] = useState<Guest[]>(guests);
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [open, setOpen] = useState(false);
  const ev = events.find((e) => e.id === evId)!;

  const list = useMemo(
    () =>
      guestList.filter(
        (g) =>
          g.eventoId === evId &&
          (!q || g.nombre.toLowerCase().includes(q.toLowerCase()) || g.cedula.includes(q)),
      ),
    [evId, guestList, q],
  );

  function setConfirmation(id: string, confirmacion: GuestConfirmation) {
    setGuestList((current) => current.map((guest) => guest.id === id ? { ...guest, confirmacion } : guest));
    toast.success(`Confirmacion actualizada: ${confirmacion}`);
  }

  function sendInvitation(id?: string) {
    if (id) {
      const guest = guestList.find((item) => item.id === id);
      toast.success(`Cita enviada por correo${guest ? ` a ${guest.nombre}` : ""}`);
      return;
    }
    toast.success(`Citas enviadas por correo: ${list.length} invitados`);
  }

  return (
    <div>
      <PageHeader
        title="Invitados"
        subtitle="Administre confirmaciones tipo Outlook e imprima etiquetas de invitados."
        actions={
          <>
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Importar</Button>
            <Button variant="outline" onClick={() => sendInvitation()}><Send className="mr-2 h-4 w-4" /> Enviar citas</Button>
            <Button className="bg-accent text-accent-foreground hover:opacity-90"><Plus className="mr-2 h-4 w-4" /> Agregar invitado</Button>
          </>
        }
      />

      <Card className="overflow-hidden border-t-2 border-t-primary">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <Select value={evId} onValueChange={setEvId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar invitado..." className="pl-9" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invitado</TableHead>
                <TableHead>Cedula</TableHead>
                <TableHead>Institucion</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Confirmacion</TableHead>
                <TableHead>Llegada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{g.nombre}</div>
                    <div className="text-xs text-muted-foreground">{g.cargo}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{g.cedula}</TableCell>
                  <TableCell className="text-sm">{g.institucion}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={g.tipo === "VIP" ? "border-accent/40 bg-accent/10 text-accent" : ""}>{g.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge className={confBadge[g.confirmacion]}>{g.confirmacion}</Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setConfirmation(g.id, "aceptado")}><Check className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setConfirmation(g.id, "tentativo")}><Clock className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setConfirmation(g.id, "rechazado")}><X className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{g.llegada?.slice(11) ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => sendInvitation(g.id)}><Mail className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toast.success(`Llegada registrada: ${g.nombre}`)}><LogIn className="h-4 w-4" /></Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setBadge({ id: g.id, nombre: g.nombre, cargo: g.cargo, institucion: g.institucion, evento: ev.nombre, tipo: g.tipo });
                          setOpen(true);
                        }}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <BadgePrintModal open={open} onOpenChange={setOpen} data={badge} />
    </div>
  );
}
