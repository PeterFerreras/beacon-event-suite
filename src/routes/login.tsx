import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Lock, LogIn, Mail, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Costa del Faro" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Fondo institucional */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
        backgroundSize: "48px 48px, 64px 64px",
      }} />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-yellow/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-blue/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-elegant backdrop-blur-xl lg:grid-cols-2">
          {/* Panel izquierdo (branding) */}
          <div className="relative hidden flex-col justify-between p-10 text-white lg:flex">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-elegant">
                <img src="/logo-cf.png" alt="Costa del Faro" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-yellow">
                  Costa del Faro
                </div>
                <div className="font-display text-lg font-bold leading-tight">
                  Registro de Eventos y Visitas
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-display text-3xl font-bold leading-tight">
                Bienvenido al sistema institucional
                <span className="block text-brand-yellow">de gestión de visitas</span>
              </h2>
              <p className="max-w-sm text-sm text-white/75">
                Control de acceso, eventos protocolares y asistencia con estándares
                internacionales.
              </p>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-brand-yellow">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="text-white/85">Registro rápido de visitantes por cédula</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-brand-yellow">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <span className="text-white/85">Gestión de eventos e invitados VIP</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/10 text-brand-yellow">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="text-white/85">Control de acceso y roles institucionales</span>
                </li>
              </ul>
            </div>

            <div className="text-xs text-white/50">
              © {new Date().getFullYear()} Costa del Faro · Uso institucional
            </div>

            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          </div>

          {/* Panel derecho (formulario) */}
          <div className="relative bg-card p-8 sm:p-10">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-card-soft ring-1 ring-border">
                <img src="/logo-cf.png" alt="Costa del Faro" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Costa del Faro</div>
                <div className="font-display text-base font-bold text-foreground">Registro de Eventos y Visitas</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                Acceso institucional
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold text-foreground gold-line">
                Iniciar sesión
              </h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Ingresa tus credenciales para continuar al panel.
              </p>
            </div>

            <form className="space-y-5" onSubmit={submit}>
              <div>
                <Label htmlFor="correo">Correo institucional</Label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="h-11 pl-9"
                    autoComplete="username"
                    placeholder="Correo"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-accent hover:underline"
                    onClick={() => toast.info("Contacta al administrador para recuperar tu acceso.")}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-9"
                    autoComplete="current-password"
                    placeholder="Contraseña"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-navy text-white shadow-elegant hover:bg-navy/90"
                disabled={loading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Ingresando..." : "Entrar al panel"}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Sistema protegido · Uso exclusivo del personal autorizado
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
