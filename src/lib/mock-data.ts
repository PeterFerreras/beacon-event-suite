export type VisitorStatus = "dentro" | "fuera";
export type Visitor = {
  id: string;
  cedula: string;
  nombre: string;
  cargo: string;
  institucion: string;
  area: string;
  telefono: string;
  correo: string;
  motivo: string;
  entrada: string;
  salida?: string;
  status: VisitorStatus;
  foto?: string;
  acompanantes: number;
};

export type EventStatus = "borrador" | "activo" | "finalizado";
export type EventSession = { id: string; nombre: string; dia: string; inicio: string; fin: string };
export type EventItem = {
  id: string;
  nombre: string;
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
export type GuestType = "VIP" | "Estándar" | "Prensa" | "Protocolo";
export type Guest = {
  id: string;
  eventoId: string;
  nombre: string;
  cedula: string;
  cargo: string;
  institucion: string;
  correo: string;
  tipo: GuestType;
  confirmacion: GuestConfirmation;
  llegada?: string;
};

export const visitors: Visitor[] = [
  { id: "v1", cedula: "001-1234567-8", nombre: "María Fernández Reyes", cargo: "Directora de Comunicación", institucion: "Ministerio de Cultura", area: "Presidencia", telefono: "809-555-0101", correo: "m.fernandez@cultura.gob", motivo: "Reunión protocolar", entrada: "2026-07-09 08:32", status: "dentro", acompanantes: 1 },
  { id: "v2", cedula: "402-9988776-5", nombre: "Carlos Peña Almonte", cargo: "Embajador", institucion: "Embajada de España", area: "Cancillería", telefono: "809-555-0142", correo: "cpena@emb.es", motivo: "Firma de convenio", entrada: "2026-07-09 09:05", status: "dentro", acompanantes: 2 },
  { id: "v3", cedula: "001-4455667-2", nombre: "Ana Lucía Guzmán", cargo: "Periodista", institucion: "Listín Diario", area: "Prensa", telefono: "809-555-0187", correo: "aguzman@listin.do", motivo: "Cobertura evento", entrada: "2026-07-09 07:50", salida: "2026-07-09 10:15", status: "fuera", acompanantes: 0 },
  { id: "v4", cedula: "402-1122334-9", nombre: "Roberto Sánchez", cargo: "Asesor Legal", institucion: "Suprema Corte", area: "Legal", telefono: "809-555-0166", correo: "rsanchez@scj.gob", motivo: "Consultoría", entrada: "2026-07-09 10:40", status: "dentro", acompanantes: 0 },
  { id: "v5", cedula: "001-9988771-4", nombre: "Elena Martínez", cargo: "Consultora", institucion: "PNUD", area: "Cooperación", telefono: "809-555-0122", correo: "emartinez@undp.org", motivo: "Mesa técnica", entrada: "2026-07-09 11:10", status: "dentro", acompanantes: 1 },
];

export const events: EventItem[] = [
  {
    id: "e1",
    nombre: "Cumbre Iberoamericana de Cultura 2026",
    fechaInicio: "2026-07-10",
    fechaFin: "2026-07-12",
    lugar: "Salón Costa del Faro",
    estado: "activo",
    requiereConfirmacion: true,
    invitados: 180,
    confirmados: 142,
    presentes: 96,
    sesiones: [
      { id: "s1", nombre: "Apertura oficial", dia: "2026-07-10", inicio: "09:00", fin: "10:30" },
      { id: "s2", nombre: "Panel: Diplomacia Cultural", dia: "2026-07-10", inicio: "11:00", fin: "13:00" },
      { id: "s3", nombre: "Cena de gala", dia: "2026-07-10", inicio: "19:30", fin: "22:00" },
      { id: "s4", nombre: "Mesa técnica", dia: "2026-07-11", inicio: "09:00", fin: "12:00" },
    ],
  },
  {
    id: "e2",
    nombre: "Foro Económico Nacional",
    fechaInicio: "2026-07-15",
    fechaFin: "2026-07-15",
    lugar: "Auditorio Principal",
    estado: "activo",
    requiereConfirmacion: true,
    invitados: 220,
    confirmados: 198,
    presentes: 0,
    sesiones: [
      { id: "s5", nombre: "Sesión matutina", dia: "2026-07-15", inicio: "08:30", fin: "12:30" },
      { id: "s6", nombre: "Sesión vespertina", dia: "2026-07-15", inicio: "14:00", fin: "17:30" },
    ],
  },
  {
    id: "e3",
    nombre: "Firma Convenio Bilateral",
    fechaInicio: "2026-07-20",
    fechaFin: "2026-07-20",
    lugar: "Salón Dorado",
    estado: "borrador",
    requiereConfirmacion: false,
    invitados: 45,
    confirmados: 12,
    presentes: 0,
    sesiones: [{ id: "s7", nombre: "Acto protocolar", dia: "2026-07-20", inicio: "10:00", fin: "12:00" }],
  },
  {
    id: "e4",
    nombre: "Aniversario Institucional",
    fechaInicio: "2026-06-28",
    fechaFin: "2026-06-28",
    lugar: "Jardines del Faro",
    estado: "finalizado",
    requiereConfirmacion: true,
    invitados: 320,
    confirmados: 285,
    presentes: 274,
    sesiones: [{ id: "s8", nombre: "Acto único", dia: "2026-06-28", inicio: "18:00", fin: "22:00" }],
  },
];

const nombres = ["Luis Ramírez", "Patricia Núñez", "Jorge Vásquez", "Isabel Rosario", "Fernando Cruz", "Camila Ortiz", "Andrés Batista", "Gabriela Mejía", "Ricardo Peralta", "Sofía Domínguez", "Miguel Herrera", "Laura Castillo"];
const cargos = ["Ministro", "Vice Ministro", "Director", "Asesor", "Embajador", "Consultor", "Periodista", "Rector"];
const insts = ["Presidencia", "MINERD", "MEPyD", "UASD", "PUCMM", "BID", "OEA", "CEPAL"];
const tipos: GuestType[] = ["VIP", "Estándar", "Prensa", "Protocolo"];
const confs: GuestConfirmation[] = ["aceptado", "aceptado", "aceptado", "tentativo", "rechazado", "pendiente"];

export const guests: Guest[] = events.flatMap((ev, ei) =>
  Array.from({ length: 12 }).map((_, i) => ({
    id: `g${ei}-${i}`,
    eventoId: ev.id,
    nombre: nombres[(ei * 3 + i) % nombres.length],
    cedula: `00${(ei + 1)}-${String(1000000 + i * 137).slice(0, 7)}-${(i % 9) + 1}`,
    cargo: cargos[i % cargos.length],
    institucion: insts[i % insts.length],
    correo: `invitado${ei}${i}@ejemplo.gob`,
    tipo: tipos[i % tipos.length],
    confirmacion: confs[i % confs.length],
    llegada: i % 3 === 0 ? "2026-07-10 09:12" : undefined,
  })),
);

export const dashboardStats = {
  visitantesHoy: 47,
  eventosActivos: 2,
  invitadosConfirmados: 340,
  presentesHoy: 96,
  visitantesDentro: 4,
  proximosEventos: 3,
};
