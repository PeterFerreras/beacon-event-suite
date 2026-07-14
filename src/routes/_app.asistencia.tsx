import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, QrCode, Search, UserCheck, Users, UserX } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/asistencia")({ head: () => ({ meta: [{ title: "Asistencia - G-Visitantes" }] }), component: Asistencia });
function Asistencia() {
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: apiClient.events });
  const [evId, setEvId] = useState("");
  const ev = events.find((e) => e.id === evId);
  const [dia, setDia] = useState("");
  const [sesId, setSesId] = useState("");
  const [q, setQ] = useState("");
  const { data: guests = [], isLoading } = useQuery({ queryKey: ["guests", evId], queryFn: () => apiClient.guests(evId), enabled: !!evId });
  useEffect(() => { if (!evId && events[0]) setEvId(events[0].id); }, [evId, events]);
  useEffect(() => { if (ev?.sesiones[0]) { setDia(ev.sesiones[0].dia); setSesId(ev.sesiones[0].id); } }, [ev]);
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["guests", evId] }); queryClient.invalidateQueries({ queryKey: ["events"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); };
  const checkIn = useMutation({ mutationFn: (id: string) => apiClient.checkInGuest(id, sesId), onSuccess: () => { invalidate(); toast.success("Entrada registrada"); } });
  const checkOut = useMutation({ mutationFn: (id: string) => apiClient.checkOutGuest(id, sesId), onSuccess: () => { invalidate(); toast.success("Salida registrada"); } });
  const list = useMemo(() => guests.filter((g) => !q || g.nombre.toLowerCase().includes(q.toLowerCase()) || g.cedula.includes(q)), [guests, q]);
  const confirmados = list.filter((g) => g.confirmacion === "aceptado").length;
  const presentes = list.filter((g) => !!g.llegada).length;
  return <div><PageHeader title="Registro de asistencia" subtitle="Control por evento, dia y sesion/corte con busqueda y QR." /><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard label="Confirmados" value={confirmados} icon={Users} /><StatCard label="Presentes" value={presentes} icon={UserCheck} accent /><StatCard label="Ausentes" value={Math.max(0, confirmados - presentes)} icon={UserX} /></div><Card className="mt-6 overflow-hidden border-t-2 border-t-primary"><CardContent className="p-4 sm:p-5"><div className="mb-4 grid gap-3 sm:grid-cols-4"><Select value={evId} onValueChange={setEvId}><SelectTrigger><SelectValue placeholder="Evento" /></SelectTrigger><SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent></Select><Select value={dia} onValueChange={setDia} disabled={!ev}><SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger><SelectContent>{Array.from(new Set((ev?.sesiones ?? []).map((s) => s.dia))).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><Select value={sesId} onValueChange={setSesId} disabled={!ev}><SelectTrigger><SelectValue placeholder="Sesion" /></SelectTrigger><SelectContent>{(ev?.sesiones ?? []).filter((s) => s.dia === dia).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre} ({s.inicio}-{s.fin})</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => toast("Escaner QR activado (simulado)")}><QrCode className="mr-2 h-4 w-4" /> Escanear QR</Button></div><div className="relative mb-4"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o cedula..." className="pl-9" /></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Invitado</TableHead><TableHead>Institucion</TableHead><TableHead>Confirmacion</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>{isLoading && <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Cargando asistencia...</TableCell></TableRow>}{!isLoading && list.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No hay invitados para este evento.</TableCell></TableRow>}{list.map((g) => { const presente = !!g.llegada; return <TableRow key={g.id}><TableCell><div className="font-medium text-foreground">{g.nombre}</div><div className="text-xs text-muted-foreground">{g.cedula}</div></TableCell><TableCell className="text-sm">{g.institucion}</TableCell><TableCell><Badge variant="outline">{g.confirmacion}</Badge></TableCell><TableCell>{presente ? <Badge className="bg-success/15 text-success hover:bg-success/15">Presente</Badge> : g.confirmacion === "aceptado" ? <Badge variant="outline" className="border-destructive/40 text-destructive">Ausente</Badge> : <Badge variant="outline">-</Badge>}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => checkIn.mutate(g.id)}><LogIn className="mr-1 h-3 w-3" />Entrada</Button><Button size="sm" variant="ghost" onClick={() => checkOut.mutate(g.id)}><LogOut className="mr-1 h-3 w-3" />Salida</Button></div></TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card></div>;
}
