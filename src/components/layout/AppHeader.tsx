import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Sun,
  Tag,
  UserCheck,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, type AppModule } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

const nav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { title: "Visitantes", url: "/visitantes", icon: Users, module: "visitantes" },
  { title: "Eventos", url: "/eventos", icon: CalendarDays, module: "eventos" },
  { title: "Invitados", url: "/invitados", icon: UserCheck, module: "invitados" },
  { title: "Etiquetas", url: "/etiquetas", icon: Tag, module: "etiquetas" },
  { title: "Usuarios", url: "/usuarios", icon: UserCheck, module: "usuarios" },
  { title: "Reportes", url: "/reportes", icon: FileBarChart, module: "reportes" },
] as const;

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme } = useTheme();
  const { user, logout, canAccess } = useAuth();
  const navigate = useNavigate();
  const visibleNav = nav.filter((item) => canAccess(item.module as AppModule));

  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-gradient-hero text-white shadow-elegant">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-elegant">
              <img src="/logo-cf.png" alt="Costa del Faro" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-yellow">
                Costa del Faro
              </div>
              <div className="truncate font-display text-base font-bold sm:text-lg">
                Registro de Eventos y Visitas
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
              <Input
                placeholder="Buscar visitante o evento..."
                className="h-10 w-72 border-white/15 bg-white/10 pl-9 text-white placeholder:text-white/55 focus-visible:ring-brand-yellow"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-11 w-11 border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="hidden h-11 w-11 place-items-center rounded-xl border border-brand-yellow/40 bg-white/10 text-xs font-semibold text-brand-yellow sm:grid">
              {user?.nombre?.slice(0, 2).toUpperCase() ?? "CF"}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={handleLogout} className="h-11 w-11 border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white" aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          {visibleNav.map((item) => {
            const active = pathname === item.url || pathname.startsWith(item.url + "/");
            return (
              <Link
                key={item.url}
                to={item.url}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-primary shadow-card-soft"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="h-1 w-full bg-gradient-brand" />
    </header>
  );
}
