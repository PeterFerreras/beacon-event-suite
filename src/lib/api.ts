export type VisitorStatus = "dentro" | "fuera";
export type Visitor = { id: string; visitanteId?: string; cedula: string; nombre: string; cargo: string; institucion: string; area: string; telefono: string; correo: string; motivo: string; entrada: string; salida?: string | null; status: VisitorStatus; foto?: string | null; acompanantes: number };
export type EventStatus = "borrador" | "activo" | "finalizado";
export type EventSession = { id: string; eventoId?: string; nombre: string; dia: string; inicio: string; fin: string };
export type EventItem = { id: string; nombre: string; descripcion?: string | null; fechaInicio: string; fechaFin: string; lugar: string; estado: EventStatus; requiereConfirmacion: boolean; invitados: number; confirmados: number; presentes: number; sesiones: EventSession[] };
export type GuestConfirmation = "aceptado" | "tentativo" | "rechazado" | "pendiente";
export type Guest = { id: string; eventoId: string; nombre: string; cedula: string; cargo: string; institucion: string; correo: string; tipo: string; confirmacion: GuestConfirmation; llegada?: string | null; salida?: string | null; esVisitante?: boolean };
export type DashboardStats = { visitantesHoy: number; eventosActivos: number; invitadosConfirmados: number; presentesHoy: number; visitantesDentro: number; proximosEventos: number };
export type NewEventPayload = { nombre: string; descripcion?: string; lugar?: string; fecha: string; fechaFin?: string; inicio?: string | null; fin?: string | null; estado?: EventStatus; requiereConfirmacion?: boolean };
export type UpdateEventPayload = Partial<Pick<EventItem, "nombre" | "descripcion" | "lugar" | "estado" | "requiereConfirmacion">> & { fechaInicio?: string; fechaFin?: string };
export type VisitorPayload = { cedula: string; nombre: string; cargo: string; institucion: string; area: string; telefono: string; correo: string; motivo: string; acompanantes?: { nombre: string; cedula: string }[] };
export type PadronPersona = { cedula: string; nombre: string; foto?: string | null; estado?: string | null; provincia?: string | null; municipio?: string | null; fechaNacimiento?: string | null; edad?: number | null; sexo?: string | null; nacionalidad?: string | null; fuente?: string };
const API_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.detail || data?.error || "No se pudo completar la solicitud.");
  return data as T;
}

// URL absoluta a la foto del padron, servida por el backend. Uso directo en <img src>.
export const padronFotoUrl = (cedula: string) => {
  const clean = (cedula ?? "").replace(/\D/g, "");
  return clean.length === 11 ? `${API_URL}/padron/foto?cedula=${clean}` : "";
};

export const apiClient = {
  dashboard: () => api<DashboardStats>("/dashboard"),
  events: () => api<EventItem[]>("/events"),
  event: (id: string) => api<EventItem>(`/events/${id}`),
  createEvent: (payload: NewEventPayload) => api<EventItem>("/events", { method: "POST", body: JSON.stringify(payload) }),
  updateEvent: (id: string, payload: UpdateEventPayload) => api<EventItem>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  guests: (eventId?: string) => api<Guest[]>(eventId ? `/events/${eventId}/guests` : "/guests"),
  createGuest: (eventId: string, payload: Partial<Guest>) => api<Guest>(`/events/${eventId}/guests`, { method: "POST", body: JSON.stringify(payload) }),
  createWalkIn: (eventId: string, payload: Partial<Guest>) => api<Guest>(`/events/${eventId}/walk-ins`, { method: "POST", body: JSON.stringify(payload) }),
  updateConfirmation: (id: string, confirmacion: GuestConfirmation) => api<{ updated: boolean }>(`/guests/${id}/confirmation`, { method: "PATCH", body: JSON.stringify({ confirmacion }) }),
  checkInGuest: (id: string, sesionId?: string) => api<{ updated: boolean; llegada: string }>(`/guests/${id}/check-in`, { method: "POST", body: JSON.stringify({ sesionId }) }),
  checkOutGuest: (id: string, sesionId?: string) => api<{ updated: boolean; salida: string }>(`/guests/${id}/check-out`, { method: "POST", body: JSON.stringify({ sesionId }) }),
  deleteGuest: (id: string) => api<{ deleted: boolean }>(`/guests/${id}`, { method: "DELETE" }),
  visitors: (status = "todos") => api<Visitor[]>(`/visitors?status=${encodeURIComponent(status)}`),
  searchVisitors: (q: string) => api<Visitor[]>(`/visitors/search?q=${encodeURIComponent(q)}`),
  createVisitor: (payload: VisitorPayload) => api<Visitor>("/visitors", { method: "POST", body: JSON.stringify(payload) }),
  exitVisitor: (id: string) => api<{ updated: boolean }>(`/visitors/${id}/exit`, { method: "POST", body: "{}" }),
  settings: () => api<Record<string, string>>("/settings"),
  users: () => api<{ id: string; nombre: string; rol: string; correo: string }[]>("/users"),
  guestTypes: () => api<{ id: string; nombre: string; color?: string }[]>("/guest-types"),
  createGuestType: (nombre: string) => api<{ id: string; nombre: string }>("/guest-types", { method: "POST", body: JSON.stringify({ nombre }) }),
  report: (tipo: string, eventoId?: string) => api<{ tipo: string; items: unknown[] }>(`/reports/${tipo}${eventoId ? `?eventoId=${encodeURIComponent(eventoId)}` : ""}`),
  // Padron
  padronBuscar: (cedula: string) => api<PadronPersona>(`/padron/buscar?cedula=${encodeURIComponent(cedula.replace(/\D/g, ""))}`),
  padronFotoUrl,
};
