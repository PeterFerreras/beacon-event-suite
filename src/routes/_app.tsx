import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { firstAllowedPath, moduleForPath, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, canAccess } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      navigate({ to: "/login", search: { redirect: pathname }, replace: true });
    }
  }, [loading, navigate, pathname, user]);

  useEffect(() => {
    if (loading || !user) return;
    const module = moduleForPath(pathname);
    if (module && !canAccess(module)) {
      const destination = firstAllowedPath(user);
      if (destination !== pathname) {
        navigate({ to: destination, replace: true });
      }
    }
  }, [canAccess, loading, navigate, pathname, user]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Cargando sesion...</div>;
  }

  const module = moduleForPath(pathname);
  if (module && !canAccess(module)) {
    return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Redirigiendo...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
