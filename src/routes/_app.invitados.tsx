import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clock,
  Loader2,
  LogIn,
  Mail,
  Plus,
  Printer,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BadgePrintModal, type BadgeData } from "@/components/labels/BadgePrintModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient, type GuestConfirmation } from "@/lib/api";
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

const emptyGuestForm = {
  nombre: "",
  cedula: "",
  cargo: "",
  institucion: "",
  correo: "",
  tipo: "Estandar",
  confirmacion: "pendiente" as GuestConfirmation,
};

function Invitados() {
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: apiClient.events });
  const [evId, setEvId] = useState("");
  const [q, setQ] = useState("");
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestForm, setGuestForm] = useState(emptyGuestForm);
  const [buscandoPadron, setBuscandoPadron] = useState(false);
  const ev = events.find((e) => e.id === evId);

  const { data: guestList = [], isLoading } = useQuery({
    queryKey: ["guests", evId],
    queryFn: () => apiClient.guests(evId),
    enabled: !!evId,
  });

  useEffect(() => {
    if (!evId && events[0]) setEvId(events[0].id);
  }, [evId, events]);

  function invalidateGuests() {
    queryClient.invalidateQueries({ queryKey: ["guests", evId] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const createGuest = useMutation({
    mutationFn: () =>
      apiClient.createGuest(evId, {
        ...guestForm,
        cedula: guestForm.cedula.replace(/\D/g, ""),
      }),
    onSuccess: () => {
      invalidateGuests();
      setGuestOpen(false);
      setGuestForm(emptyGuestForm);
      toast.success("Invitado registrado en el evento");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el invitado"),
  });

  const updateConfirmation = useMutation({
    mutationFn: ({ id, confirmacion }: { id: string; confirmacion: GuestConfirmation }) =>
      apiClient.updateConfirmation(id, confirmacion),
    onSuccess: () => {
      invalidateGuests();
      toast.success("Confirmacion actualizada");
    },
  });

  const checkIn = useMutation({
    mutationFn: (id: string) => apiClient.checkInGuest(id),
    onSuccess: () => {
      invalidateGuests();
      toast.success("Llegada registrada");
    },
  });

  const list = useMemo(
    () =>
      guestList.filter(
        (g) =>
          !q ||
          g.nombre.toLowerCase().includes(q.toLowerCase()) ||
          g.cedula.includes(q.replace(/\D/g, "")),
      ),
    [guestList, q],
  );

  const sendInvitation = (id?: string) =>
    toast.success(id ? "Cita enviada por correo" : `Citas enviadas por correo: ${list.length} invitados`);

  function setGuestField(field: keyof typeof guestForm, value: string) {
    setGuestForm((current) => ({ ...current, [field]: value }));
  }

  async function consultarPadron() {
    const cedula = guestForm.cedula.replace(/\D/g, "");
    if (cedula.length !== 11) {
      toast.error("Digite una cedula valida de 11 digitos");
      return;
    }
    setBuscandoPadron(true);
    try {
      const persona = await apiClient.padronBuscar(cedula);
      setGuestForm((current) => ({
        ...current,
        cedula,
        nombre: persona.nombre || current.nombre,
      }));
      toast.success("Datos cargados desde el padron");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se encontro en padron");
    } finally {
      setBuscandoPadron(false);
    }
  }

  function handleCedulaKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    consultarPadron();
  }

  function submitGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!evId) {
      toast.error("Seleccione el evento antes de registrar el invitado");
      return;
    }
    if (!guestForm.nombre.trim() || !guestForm.cedula.trim()) {
      toast.error("Nombre y cedula son obligatorios");
      return;
    }
    createGuest.mutate();
  }

  return (
    <div>
      <PageHeader
        title="Invitados"
        subtitle="Administre confirmaciones tipo Outlook e imprima etiquetas de invitados."
        actions={
          <>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Importar
            </Button>
            <Button variant="outline" onClick={() => sendInvitation()}>
              <Send className="mr-2 h-4 w-4" /> Enviar citas
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:opacity-90"
              onClick={() => setGuestOpen(true)}
              disabled={!evId}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar invitado
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden border-t-2 border-t-primary">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <Select value={evId} onValueChange={setEvId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar invitado..."
                className="pl-9"
              />
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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Cargando invitados...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No hay invitados registrados.
                  </TableCell>
                </TableRow>
              )}
              {list.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{g.nombre}</div>
                    <div className="text-xs text-muted-foreground">{g.cargo}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{g.cedula}</TableCell>
                  <TableCell className="text-sm">{g.institucion}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={g.tipo === "VIP" ? "border-accent/40 bg-accent/10 text-accent" : ""}
                    >
                      {g.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge className={confBadge[g.confirmacion]}>{g.confirmacion}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateConfirmation.mutate({ id: g.id, confirmacion: "aceptado" })}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateConfirmation.mutate({ id: g.id, confirmacion: "tentativo" })}
                      >
                        <Clock className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateConfirmation.mutate({ id: g.id, confirmacion: "rechazado" })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{g.llegada?.slice(11) ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => sendInvitation(g.id)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => checkIn.mutate(g.id)}>
                        <LogIn className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setBadge({
                            id: g.id,
                            cedula: g.cedula,
                            nombre: g.nombre,
                            cargo: g.cargo,
                            institucion: g.institucion,
                            evento: ev?.nombre,
                            tipo: g.tipo,
                          });
                          setBadgeOpen(true);
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

      <Dialog open={guestOpen} onOpenChange={setGuestOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Agregar invitado</DialogTitle>
            <DialogDescription>
              El invitado quedara conectado al evento seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={submitGuest}>
            <div>
              <Label>Evento</Label>
              <Select value={evId} onValueChange={setEvId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Seleccione evento" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Cedula / Documento</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={guestForm.cedula}
                    onChange={(e) => setGuestField("cedula", e.target.value)}
                    onKeyDown={handleCedulaKeyDown}
                    placeholder="Presione Enter para consultar"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={consultarPadron}
                    disabled={buscandoPadron}
                    aria-label="Consultar padron"
                  >
                    {buscandoPadron ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Nombre completo</Label>
                <Input
                  className="mt-1.5"
                  value={guestForm.nombre}
                  onChange={(e) => setGuestField("nombre", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  className="mt-1.5"
                  value={guestForm.cargo}
                  onChange={(e) => setGuestField("cargo", e.target.value)}
                />
              </div>
              <div>
                <Label>Institucion</Label>
                <Input
                  className="mt-1.5"
                  value={guestForm.institucion}
                  onChange={(e) => setGuestField("institucion", e.target.value)}
                />
              </div>
              <div>
                <Label>Correo</Label>
                <Input
                  className="mt-1.5"
                  type="email"
                  value={guestForm.correo}
                  onChange={(e) => setGuestField("correo", e.target.value)}
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={guestForm.tipo} onValueChange={(value) => setGuestField("tipo", value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estandar">Estandar</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Protocolo">Protocolo</SelectItem>
                    <SelectItem value="Prensa">Prensa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setGuestOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-accent text-accent-foreground hover:opacity-90"
                disabled={createGuest.isPending}
              >
                {createGuest.isPending ? "Registrando..." : "Registrar invitado"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BadgePrintModal open={badgeOpen} onOpenChange={setBadgeOpen} data={badge} />
    </div>
  );
}
