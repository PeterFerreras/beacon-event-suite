export type VisitorStatus = "dentro" | "fuera";
export type Visitor = {
  id: string;
  visitanteId?: string;
  cedula: string;
  nombre: string;
  cargo: string;
  institucion: string;
  area: string;
  telefono: string;
  correo: string;
  motivo: string;
  entrada: string;
  salida?: string | null;
  status: VisitorStatus;
  foto?: string | null;
  acompanantes: number;
};
export type EventStatus = "borrador" | "activo" | "finalizado";
export type EventSession = {
  id: string;
  eventoId?: string;
  nombre: string;
  dia: string;
  inicio: string;
  fin: string;
};
export type EventItem = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  fechaInicio: string;
  fechaFin: string;
  lugar: string;
  estado: EventStatus;
  requiereConfirmacion: boolean;
  invitados: number;
  confirmados: number;
  presentes: number;
  sesiones: EventSession[];
};
export type GuestConfirmation = "aceptado" | "tentativo" | "rechazado" | "pendiente";
export type Guest = {
  id: string;
  eventoId: string;
  nombre: string;
  cedula: string;
  cargo: string;
  institucion: string;
  correo: string;
  tipo: string;
  confirmacion: GuestConfirmation;
  llegada?: string | null;
  salida?: string | null;
  esVisitante?: boolean;
};
export type DashboardStats = {
  visitantesHoy: number;
  eventosActivos: number;
  invitadosConfirmados: number;
  presentesHoy: number;
  visitantesDentro: number;
  proximosEventos: number;
};
export type UserRole = "Administrador" | "Gestor de eventos" | "Gestor de visitantes";
export type AuthUser = { id: string; nombre: string; correo: string; rol: UserRole };
export type AdminUser = AuthUser & { activo: boolean | number; creado?: string };
export type NewEventPayload = {
  nombre: string;
  descripcion?: string;
  lugar?: string;
  fecha: string;
  fechaFin?: string;
  inicio?: string | null;
  fin?: string | null;
  estado?: EventStatus;
  requiereConfirmacion?: boolean;
};
export type UpdateEventPayload = Partial<
  Pick<EventItem, "nombre" | "descripcion" | "lugar" | "estado" | "requiereConfirmacion">
> & { fechaInicio?: string; fechaFin?: string };
export type VisitorPayload = {
  cedula: string;
  nombre: string;
  cargo: string;
  institucion: string;
  area: string;
  telefono: string;
  correo: string;
  motivo: string;
  foto?: string | null;
  acompanantes?: { nombre: string; cedula: string }[];
};
export type PadronPersona = {
  cedula: string;
  nombre: string;
  foto?: string | null;
  estado?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  fechaNacimiento?: string | null;
  edad?: number | null;
  sexo?: string | null;
  nacionalidad?: string | null;
  fuente?: string;
};
const API_URL = (
  import.meta.env.VITE_API_URL ??
  (typeof window === "undefined" ? "http://127.0.0.1:8081/api" : `${window.location.origin}/api`)
).replace(/\/$/, "");

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window === "undefined" ? "" : window.localStorage.getItem("cf-auth-token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok)
    throw new Error(data?.detail || data?.error || "No se pudo completar la solicitud.");
  return data as T;
}

async function download(path: string): Promise<void> {
  const token = typeof window === "undefined" ? "" : window.localStorage.getItem("cf-auth-token");
  const response = await fetch(`${API_URL}${path}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (!response.ok) {
    const text = await response.text();
    let message = "No se pudo generar el reporte.";
    try {
      const data = text ? JSON.parse(text) : null;
      message = data?.detail || data?.error || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "reporte";
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// URL absoluta a la foto del padron, servida por el backend. Uso directo en <img src>.
export const padronFotoUrl = (cedula: string) => {
  const clean = (cedula ?? "").replace(/\D/g, "");
  return clean.length === 11 ? `${API_URL}/padron/foto?cedula=${clean}` : "";
};

// Reescribe fotos antiguas guardadas con localhost o una IP de otro dispositivo.
// La cédula permite pedir siempre la imagen al backend que usa el dispositivo actual.
export const visitorPhotoUrl = (photo: string | null | undefined, cedula: string) => {
  const value = photo?.trim() ?? "";
  if (!value) return padronFotoUrl(cedula);
  if (/\/api\/padron\/foto(?:\?|$)/i.test(value)) return padronFotoUrl(cedula);
  return value;
};

// Valor portátil para persistir en la base de datos sin dominio, IP ni localhost.
export const storedPadronPhotoUrl = (cedula: string) => {
  const clean = (cedula ?? "").replace(/\D/g, "");
  return clean.length === 11 ? `/api/padron/foto?cedula=${clean}` : null;
};

export const apiClient = {
  login: (payload: { correo: string; password: string }) =>
    api<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => api<{ ok: boolean }>("/auth/logout", { method: "POST", body: "{}" }),
  me: () => api<AuthUser>("/auth/me"),
  dashboard: () => api<DashboardStats>("/dashboard"),
  events: () => api<EventItem[]>("/events"),
  event: (id: string) => api<EventItem>(`/events/${id}`),
  createEvent: (payload: NewEventPayload) =>
    api<EventItem>("/events", { method: "POST", body: JSON.stringify(payload) }),
  updateEvent: (id: string, payload: UpdateEventPayload) =>
    api<EventItem>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  guests: (eventId?: string) => api<Guest[]>(eventId ? `/events/${eventId}/guests` : "/guests"),
  createGuest: (eventId: string, payload: Partial<Guest>) =>
    api<Guest>(`/events/${eventId}/guests`, { method: "POST", body: JSON.stringify(payload) }),
  createWalkIn: (eventId: string, payload: Partial<Guest>) =>
    api<Guest>(`/events/${eventId}/walk-ins`, { method: "POST", body: JSON.stringify(payload) }),
  updateConfirmation: (id: string, confirmacion: GuestConfirmation) =>
    api<{ updated: boolean }>(`/guests/${id}/confirmation`, {
      method: "PATCH",
      body: JSON.stringify({ confirmacion }),
    }),
  checkInGuest: (id: string, sesionId?: string) =>
    api<{ updated: boolean; llegada: string }>(`/guests/${id}/check-in`, {
      method: "POST",
      body: JSON.stringify({ sesionId }),
    }),
  checkOutGuest: (id: string, sesionId?: string) =>
    api<{ updated: boolean; salida: string }>(`/guests/${id}/check-out`, {
      method: "POST",
      body: JSON.stringify({ sesionId }),
    }),
  deleteGuest: (id: string) => api<{ deleted: boolean }>(`/guests/${id}`, { method: "DELETE" }),
  visitors: (status = "todos") => api<Visitor[]>(`/visitors?status=${encodeURIComponent(status)}`),
  searchVisitors: (q: string) => api<Visitor[]>(`/visitors/search?q=${encodeURIComponent(q)}`),
  createVisitor: (payload: VisitorPayload) =>
    api<Visitor>("/visitors", { method: "POST", body: JSON.stringify(payload) }),
  exitVisitor: (id: string) =>
    api<{ updated: boolean }>(`/visitors/${id}/exit`, { method: "POST", body: "{}" }),
  settings: () => api<Record<string, string>>("/settings"),
  updateSettings: (payload: Record<string, string>) =>
    api<Record<string, string>>("/settings", { method: "PATCH", body: JSON.stringify(payload) }),
  users: () => api<AdminUser[]>("/users"),
  createUser: (payload: { nombre: string; correo: string; rol: UserRole; password?: string }) =>
    api<AdminUser>("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (
    id: string,
    payload: Partial<{ nombre: string; correo: string; rol: UserRole; activo: boolean }>,
  ) => api<AdminUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  resetUserPassword: (id: string, password: string) =>
    api<{ updated: boolean; temporaryPassword: string }>(`/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  guestTypes: () => api<{ id: string; nombre: string; color?: string }[]>("/guest-types"),
  createGuestType: (nombre: string) => api<{ id: string; nombre: string }>("/guest-types", { method: "POST", body: JSON.stringify({ nombre }) }),
  report: (tipo: string) => api<{ tipo: string; items: unknown[] }>(`/reports/${tipo}`),
  downloadReport: (tipo: string, format: "csv" | "pdf") => download(`/reports/${tipo}?format=${format}`),
  // Padron
  padronBuscar: (cedula: string) =>
    api<PadronPersona>(`/padron/buscar?cedula=${encodeURIComponent(cedula.replace(/\D/g, ""))}`),
  padronFotoUrl,
};
