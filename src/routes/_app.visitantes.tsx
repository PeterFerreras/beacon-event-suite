import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LogOut, Printer, Search, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BadgePrintModal, type BadgeData } from "@/components/labels/BadgePrintModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { visitors } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/visitantes")({
  head: () => ({ meta: [{ title: "Visitantes - G-Visitantes" }] }),
  component: Visitantes,
});

function Visitantes() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [open, setOpen] = useState(false);

  const list = useMemo(() => visitors.filter((v) => {
    const okQ = !q || v.nombre.toLowerCase().includes(q.toLowerCase()) || v.cedula.includes(q) || v.institucion.toLowerCase().includes(q.toLowerCase());
    const okS = status === "todos" || v.status === status;
    return okQ && okS;
  }), [q, status]);

  return (
    <div>
      <PageHeader
        title="Visitantes"
        subtitle="Historial y estado en tiempo real de visitantes institucionales."
        actions={
          <Button asChild className="bg-accent text-accent-foreground hover:opacity-90">
            <Link to="/registro"><UserPlus className="mr-2 h-4 w-4" /> Registrar visitante</Link>
          </Button>
        }
      />
      <Card className="overflow-hidden border-t-2 border-t-primary">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_140px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, cedula o institucion..." className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="dentro">Dentro</SelectItem>
                <SelectItem value="fuera">Fuera</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Filtrar fecha</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Cedula</TableHead>
                  <TableHead>Institucion</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell><div className="font-medium text-foreground">{v.nombre}</div><div className="text-xs text-muted-foreground">{v.cargo}</div></TableCell>
                    <TableCell className="font-mono text-xs">{v.cedula}</TableCell>
                    <TableCell className="text-sm">{v.institucion}</TableCell>
                    <TableCell className="text-sm">{v.area}</TableCell>
                    <TableCell className="text-sm">{v.entrada.slice(11)}</TableCell>
                    <TableCell className="text-sm">{v.salida?.slice(11) ?? "-"}</TableCell>
                    <TableCell>
                      {v.status === "dentro"
                        ? <Badge className="bg-success/15 text-success hover:bg-success/15">Dentro</Badge>
                        : <Badge variant="outline">Fuera</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setBadge({ id: v.id, nombre: v.nombre, cargo: v.cargo, institucion: v.institucion, tipo: "Visitante" }); setOpen(true); }}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        {v.status === "dentro" && (
                          <Button size="sm" variant="ghost" onClick={() => toast.success(`Salida registrada para ${v.nombre}`)}>
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
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
