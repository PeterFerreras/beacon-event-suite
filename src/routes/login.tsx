import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login - Registro de Eventos y Visitas" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [correo, setCorreo] = useState("admin@costadelfaro.local");
  const [password, setPassword] = useState("Admin1234!");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      await login(correo, password);
      toast.success("Sesión iniciada");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-hero" />
      <Card className="relative w-full max-w-md overflow-hidden border-t-2 border-t-accent p-6 shadow-elegant">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-card-soft">
            <img src="/logo-cf.png" alt="Costa del Faro" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Costa del Faro</div>
            <h1 className="font-display text-xl font-bold text-foreground">Registro de Eventos y Visitas</h1>
          </div>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div>
            <Label htmlFor="correo">Correo</Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="pl-9" autoComplete="username" />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" autoComplete="current-password" />
            </div>
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:opacity-90" disabled={loading}>
            <LogIn className="mr-2 h-4 w-4" /> Entrar
          </Button>
        </form>

        <div className="mt-6 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          Usuario inicial: admin@costadelfaro.local / Admin1234!
        </div>
      </Card>
    </main>
  );
}

