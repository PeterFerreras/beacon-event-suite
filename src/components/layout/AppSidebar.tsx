import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, UserPlus, Users, CalendarDays, UserCheck,
  ClipboardCheck, Tag, FileBarChart, Settings, Anchor,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";

const nav = [
  { label: "General", items: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  ]},
  { label: "Visitantes", items: [
    { title: "Registro", url: "/registro", icon: UserPlus },
    { title: "Visitantes", url: "/visitantes", icon: Users },
  ]},
  { label: "Eventos", items: [
    { title: "Eventos", url: "/eventos", icon: CalendarDays },
    { title: "Invitados", url: "/invitados", icon: UserCheck },
    { title: "Asistencia", url: "/asistencia", icon: ClipboardCheck },
  ]},
  { label: "Gestión", items: [
    { title: "Etiquetas", url: "/etiquetas", icon: Tag },
    { title: "Reportes", url: "/reportes", icon: FileBarChart },
    { title: "Configuración", url: "/configuracion", icon: Settings },
  ]},
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gold text-gold-foreground">
            <Anchor className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="font-display text-base font-semibold leading-tight text-sidebar-foreground">G-Visitantes</div>
            <div className="text-[10px] uppercase tracking-widest text-gold">Eventos · Protocolo</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {nav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          v1.0 · Costa del Faro
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
