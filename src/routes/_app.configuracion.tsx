import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — G-Visitantes" }] }),
  component: Configuracion,
});

const usuarios = [
  { nombre: "Mónica Peña", rol: "Administrador", correo: "mpena@institucion.gob" },
  { nombre: "Carlos Ruiz", rol: "Recepción", correo: "cruiz@institucion.gob" },
  { nombre: "Ana Herrera", rol: "Protocolo", correo: "aherrera@institucion.gob" },
];

const tipos = ["VIP", "Estándar", "Prensa", "Protocolo"];

function Configuracion() {
  return (
    <div>
      <PageHeader title="Configuración" subtitle="Institución, usuarios, tipos de invitado e impresión." />

      <Tabs defaultValue="institucion">
        <TabsList>
          <TabsTrigger value="institucion">Institución</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de invitado</TabsTrigger>
          <TabsTrigger value="impresion">Impresión</TabsTrigger>
          <TabsTrigger value="prefs">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="institucion" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="font-display">Datos institucionales</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Nombre institucional</Label><Input defaultValue="Institución Costa del Faro" className="mt-1.5" /></div>
              <div><Label>Logo principal</Label>
                <div className="mt-1.5 grid h-24 place-items-center rounded-md border-2 border-dashed border-border bg-muted/30 text-muted-foreground">
                  <div className="flex items-center gap-2 text-xs"><Upload className="h-4 w-4" /> Subir logo</div>
                </div>
              </div>
              <div><Label>Logo secundario</Label>
                <div className="mt-1.5 grid h-24 place-items-center rounded-md border-2 border-dashed border-border bg-muted/30 text-muted-foreground">
                  <div className="flex items-center gap-2 text-xs"><Upload className="h-4 w-4" /> Subir logo</div>
                </div>
              </div>
              <div className="sm:col-span-2"><Button onClick={() => toast.success("Guardado")}>Guardar cambios</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <Card><CardContent className="p-4 sm:p-6">
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Rol</TableHead><TableHead>Correo</TableHead></TableRow></TableHeader>
              <TableBody>{usuarios.map((u) => (
                <TableRow key={u.correo}>
                  <TableCell className="font-medium text-primary">{u.nombre}</TableCell>
                  <TableCell><Badge variant="outline" className="border-gold/40 text-gold">{u.rol}</Badge></TableCell>
                  <TableCell className="text-sm">{u.correo}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tipos" className="mt-4">
          <Card><CardContent className="p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {tipos.map((t) => <Badge key={t} className="border border-gold/40 bg-gold/5 text-primary">{t}</Badge>)}
            </div>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Nuevo tipo…" />
              <Button>Agregar</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="impresion" className="mt-4">
          <Card><CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div><Label>Tamaño de etiqueta</Label>
              <Select defaultValue="105x74"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="105x74">A7 · 105×74 mm</SelectItem>
                  <SelectItem value="90x54">Credencial · 90×54 mm</SelectItem>
                  <SelectItem value="100x150">Adhesivo · 100×150 mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Impresora predeterminada</Label><Input defaultValue="HP LaserJet Pro" className="mt-1.5" /></div>
            <div className="flex items-center gap-3 pt-6"><Switch id="qr" defaultChecked /><Label htmlFor="qr">Incluir código QR</Label></div>
            <div className="flex items-center gap-3 pt-6"><Switch id="foto" /><Label htmlFor="foto">Incluir foto del visitante</Label></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="prefs" className="mt-4">
          <Card><CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div className="flex items-center gap-3"><Switch id="notif" defaultChecked /><Label htmlFor="notif">Notificaciones por correo</Label></div>
            <div className="flex items-center gap-3"><Switch id="auto" /><Label htmlFor="auto">Auto-impresión de etiquetas</Label></div>
            <div><Label>Zona horaria</Label><Input defaultValue="America/Santo_Domingo" className="mt-1.5" /></div>
            <div><Label>Idioma</Label>
              <Select defaultValue="es"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
              </Select>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
