import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Save, UserCog } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiClient, type AdminUser, type UserRole } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const roles: UserRole[] = ["Administrador", "Gestor de eventos", "Gestor de visitantes"];

export const Route = createFileRoute("/_app/usuarios")({
  head: () => ({ meta: [{ title: "Gestión de usuarios - G-Visitantes" }] }),
  component: Usuarios,
});

function Usuarios() {
  const { canAccess } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nombre: "", correo: "", rol: "Gestor de visitantes" as UserRole, password: "123" });
  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: apiClient.users, enabled: canAccess("usuarios") });

  const createUser = useMutation({
    mutationFn: apiClient.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setForm({ nombre: "", correo: "", rol: "Gestor de visitantes", password: "123" });
      toast.success("Usuario creado");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo crear el usuario"),
  });
  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminUser> & { activo?: boolean; rol?: UserRole } }) => apiClient.updateUser(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); toast.success("Usuario actualizado"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo actualizar"),
  });
  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => apiClient.resetUserPassword(id, password),
    onSuccess: (data) => toast.success(`Contraseña reiniciada: ${data.temporaryPassword}`),
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo reiniciar la contraseña"),
  });

  if (!canAccess("usuarios")) {
    return <Card className="border-t-2 border-t-destructive p-8 text-sm text-muted-foreground">No tiene permisos para administrar usuarios.</Card>;
  }

  function submit() {
    if (!form.nombre.trim() || !form.correo.trim()) {
      toast.error("Nombre y correo son obligatorios");
      return;
    }
    createUser.mutate(form);
  }

  return (
    <div>
      <PageHeader title="Gestión de usuarios" subtitle="Cree usuarios, cambie roles, active accesos y reinicie contraseñas." />

      <Card className="mb-6 overflow-hidden border-t-2 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg"><UserCog className="h-5 w-5 text-primary" /> Nuevo usuario</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1"><Label>Nombre</Label><Input className="mt-1.5" value={form.nombre} onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))} /></div>
          <div className="lg:col-span-1"><Label>Correo</Label><Input className="mt-1.5" type="email" value={form.correo} onChange={(e) => setForm((c) => ({ ...c, correo: e.target.value }))} /></div>
          <div><Label>Rol</Label><select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.rol} onChange={(e) => setForm((c) => ({ ...c, rol: e.target.value as UserRole }))}>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
          <div><Label>Contraseña temporal</Label><Input className="mt-1.5" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} /></div>
          <div className="flex items-end"><Button className="w-full bg-accent text-accent-foreground hover:opacity-90" onClick={submit} disabled={createUser.isPending}><Plus className="mr-2 h-4 w-4" /> Crear</Button></div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-t-2 border-t-primary">
        <div className="overflow-x-auto p-4 sm:p-5">
          <Table>
            <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Cargando usuarios...</TableCell></TableRow>}
              {!isLoading && users.map((u) => <UserRow key={u.id} user={u} onSave={(payload) => updateUser.mutate({ id: u.id, payload })} onReset={(password) => resetPassword.mutate({ id: u.id, password })} />)}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function UserRow({ user, onSave, onReset }: { user: AdminUser; onSave: (payload: { rol: UserRole; activo: boolean }) => void; onReset: (password: string) => void }) {
  const [rol, setRol] = useState<UserRole>(user.rol);
  const [activo, setActivo] = useState(Boolean(Number(user.activo)));
  const [password, setPassword] = useState("123");
  return (
    <TableRow>
      <TableCell><div className="font-medium text-foreground">{user.nombre}</div><div className="text-xs text-muted-foreground">{user.id}</div></TableCell>
      <TableCell className="text-sm">{user.correo}</TableCell>
      <TableCell><select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={rol} onChange={(e) => setRol(e.target.value as UserRole)}>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select></TableCell>
      <TableCell><button type="button" onClick={() => setActivo((v) => !v)}><Badge className={activo ? "bg-success/15 text-success hover:bg-success/15" : "bg-destructive/15 text-destructive hover:bg-destructive/15"}>{activo ? "Activo" : "Inactivo"}</Badge></button></TableCell>
      <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Input className="h-9 w-32" value={password} onChange={(e) => setPassword(e.target.value)} /><Button size="sm" variant="outline" onClick={() => onReset(password)}><KeyRound className="mr-1 h-3 w-3" /> Reset</Button><Button size="sm" onClick={() => onSave({ rol, activo })}><Save className="mr-1 h-3 w-3" /> Guardar</Button></div></TableCell>
    </TableRow>
  );
}
