import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card px-3 sm:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="hidden sm:flex items-center gap-3 border-r pr-4">
        <div className="grid h-9 w-9 place-items-center rounded-sm border border-gold/40 bg-navy text-gold text-[10px] font-semibold">LOGO</div>
        <div className="grid h-9 w-9 place-items-center rounded-sm border border-gold/40 bg-navy text-gold text-[10px] font-semibold">LOGO</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg font-semibold leading-none text-primary">G-Visitantes Eventos</div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Registro institucional · Protocolo VIP</div>
      </div>
      <div className="hidden md:flex relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar visitante o evento…" className="w-64 pl-9" />
      </div>
      <Button variant="ghost" size="icon" className="shrink-0">
        <Bell className="h-4 w-4" />
      </Button>
      <Avatar className="h-9 w-9 shrink-0 border border-gold/40">
        <AvatarFallback className="bg-navy text-gold text-xs">MP</AvatarFallback>
      </Avatar>
    </header>
  );
}
