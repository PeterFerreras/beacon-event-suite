import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LogIn, LogOut, QrCode, Search, UserCheck, Users, UserX } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { events, guests } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/asistencia")({
  head: () => ({ meta: [{ title: "Asistencia - G-Visitantes" }] }),
  component: Asistencia,
});

function Asistencia() {
  const [evId, setEvId] = useState(events[0].id);
  const ev = events.find((e) => e.id === evId)!;
  const [dia, setDia] = useState(ev.sesiones[0].dia);
  const [sesId, setSesId] = useState(ev.sesiones[0].id);
  const [q, setQ] = useState("");

  const list = useMemo(() => guests.filter((g) => g.eventoId === evId &&
    (!q || g.nombre.toLowerCase().includes(q.toLowerCase()) || g.cedula.includes(q))
  ), [evId, q]);

  const confirmados = list.filter((g) => g.confirmacion === "aceptado").length;
  const presentes = list.filter((g) => !!g.llegada).length;
  const ausentes = confirmados - presentes;

  return (
    <div>
      <PageHeader title="Registro de asistencia" subtitle="Control por evento, dia y sesion/corte con busqueda y QR." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Confirmados" value={confirmados} icon={Users} />
        <StatCard label="Presentes" value={presentes} icon={UserCheck} accent />
        <StatCard label="Ausentes" value={Math.max(0, ausentes)} icon={UserX} />
      </div>

      <Card className="mt-6 overflow-hidden border-t-2 border-t-primary">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Select value={evId} onValueChange={(v) => { setEvId(v); const e = events.find((x) => x.id === v)!; setDia(e.sesiones[0].dia); setSesId(e.sesiones[0].id); }}>
              <SelectTrigger><SelectValue placeholder="Evento" /></SelectTrigger>
              <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={dia} onValueChange={setDia}>
              <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
              <SelectContent>{Array.from(new Set(ev.sesiones.map((s) => s.dia))).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sesId} onValueChange={setSesId}>
              <SelectTrigger><SelectValue placeholder="Sesion" /></SelectTrigger>
              <SelectContent>{ev.sesiones.filter((s) => s.dia === dia).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre} ({s.inicio}-{s.fin})</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast("Escaner QR activado (simulado)")}><QrCode className="mr-2 h-4 w-4" /> Escanear QR</Button>
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o cedula..." className="pl-9" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invitado</TableHead>
                  <TableHead>Institucion</TableHead>
                  <TableHead>Confirmacion</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((g) => {
                  const presente = !!g.llegada;
                  return (
                    <TableRow key={g.id}>
                      <TableCell><div className="font-medium text-foreground">{g.nombre}</div><div className="text-xs text-muted-foreground">{g.cedula}</div></TableCell>
                      <TableCell className="text-sm">{g.institucion}</TableCell>
                      <TableCell><Badge variant="outline">{g.confirmacion}</Badge></TableCell>
                      <TableCell>
                        {presente
                          ? <Badge className="bg-success/15 text-success hover:bg-success/15">Presente</Badge>
                          : g.confirmacion === "aceptado"
                            ? <Badge variant="outline" className="border-destructive/40 text-destructive">Ausente</Badge>
                            : <Badge variant="outline">-</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => toast.success(`Entrada: ${g.nombre}`)}><LogIn className="mr-1 h-3 w-3" />Entrada</Button>
                          <Button size="sm" variant="ghost" onClick={() => toast(`Salida: ${g.nombre}`)}><LogOut className="mr-1 h-3 w-3" />Salida</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
