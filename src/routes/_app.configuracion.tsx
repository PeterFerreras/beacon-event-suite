import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuracion - G-Visitantes" }] }),
  component: Configuracion,
});

function Configuracion() {
  const queryClient = useQueryClient();
  const [newType, setNewType] = useState("");
  const { data: settings = {} } = useQuery({ queryKey: ["settings"], queryFn: apiClient.settings });
  const { data: usuarios = [] } = useQuery({ queryKey: ["users"], queryFn: apiClient.users });
  const { data: tipos = [] } = useQuery({ queryKey: ["guest-types"], queryFn: apiClient.guestTypes });
  const createType = useMutation({
    mutationFn: apiClient.createGuestType,
    onSuccess: () => {
      setNewType("");
      queryClient.invalidateQueries({ queryKey: ["guest-types"] });
      toast.success("Tipo agregado");
    },
  });
  return (
    <div>
      <PageHeader title="Configuracion" subtitle="Institucion, usuarios, tipos de invitado e impresion." />

      <Tabs defaultValue="institucion">
        <TabsList className="bg-card shadow-card-soft">
          <TabsTrigger value="institucion">Institucion</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de invitado</TabsTrigger>
          <TabsTrigger value="impresion">Impresion</TabsTrigger>
          <TabsTrigger value="prefs">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="institucion" className="mt-4">
          <Card className="overflow-hidden border-t-2 border-t-primary">
            <CardHeader><CardTitle className="font-display">Datos institucionales</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Nombre institucional</Label><Input defaultValue={settings.institution_name ?? ""} className="mt-1.5" /></div>
              <div><Label>Logo principal</Label><UploadBox /></div>
              <div><Label>Logo secundario</Label><UploadBox /></div>
              <div className="sm:col-span-2"><Button onClick={() => toast.success("Guardado")}>Guardar cambios</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <Card className="overflow-hidden border-t-2 border-t-primary"><CardContent className="p-4 sm:p-5">
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Rol</TableHead><TableHead>Correo</TableHead></TableRow></TableHeader>
              <TableBody>{usuarios.map((u) => (
                <TableRow key={u.correo}>
                  <TableCell className="font-medium text-foreground">{u.nombre}</TableCell>
                  <TableCell><Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">{u.rol}</Badge></TableCell>
                  <TableCell className="text-sm">{u.correo}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tipos" className="mt-4">
          <Card className="overflow-hidden border-t-2 border-t-primary"><CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {tipos.map((t) => <Badge key={t.id} className="border border-primary/30 bg-primary/10 text-primary">{t.nombre}</Badge>)}
            </div>
            <div className="mt-4 flex gap-2">
              <Input value={newType} onChange={(event) => setNewType(event.target.value)} placeholder="Nuevo tipo..." />
              <Button className="bg-accent text-accent-foreground hover:opacity-90" onClick={() => newType.trim() && createType.mutate(newType.trim())}>Agregar</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="impresion" className="mt-4">
          <Card className="overflow-hidden border-t-2 border-t-primary"><CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <div><Label>Tamano de etiqueta</Label>
              <Select defaultValue="105x74"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="105x74">A7 - 105x74 mm</SelectItem>
                  <SelectItem value="90x54">Credencial - 90x54 mm</SelectItem>
                  <SelectItem value="100x150">Adhesivo - 100x150 mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Impresora predeterminada</Label><Input defaultValue={settings.default_printer ?? ""} className="mt-1.5" /></div>
            <div className="flex items-center gap-3 pt-6"><Switch id="qr" defaultChecked={settings.include_qr !== "0"} /><Label htmlFor="qr">Incluir codigo QR</Label></div>
            <div className="flex items-center gap-3 pt-6"><Switch id="foto" defaultChecked={settings.include_photo === "1"} /><Label htmlFor="foto">Incluir foto del visitante</Label></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="prefs" className="mt-4">
          <Card className="overflow-hidden border-t-2 border-t-primary"><CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <div className="flex items-center gap-3"><Switch id="notif" defaultChecked /><Label htmlFor="notif">Notificaciones por correo</Label></div>
            <div className="flex items-center gap-3"><Switch id="auto" /><Label htmlFor="auto">Auto-impresion de etiquetas</Label></div>
            <div><Label>Zona horaria</Label><Input defaultValue={settings.timezone ?? ""} className="mt-1.5" /></div>
            <div><Label>Idioma</Label>
              <Select defaultValue="es"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="es">Espanol</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
              </Select>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UploadBox() {
  return (
    <div className="mt-1.5 grid h-24 place-items-center rounded-[var(--radius)] border-2 border-dashed border-primary/25 bg-primary/5 text-muted-foreground">
      <div className="flex items-center gap-2 text-xs"><Upload className="h-4 w-4 text-primary" /> Subir logo</div>
    </div>
  );
}
