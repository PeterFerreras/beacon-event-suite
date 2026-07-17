import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [loading, navigate, pathname, user]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Cargando sesión...</div>;
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
