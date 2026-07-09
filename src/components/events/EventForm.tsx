import { useState, type FormEvent, type ReactNode } from "react";
import { Clock, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ScheduleType = "time_range" | "all_day";

export type NewEventInput = {
  nombre: string;
  descripcion: string;
  lugar: string;
  fecha: string;
  scheduleType: ScheduleType;
  inicio: string | null;
  fin: string | null;
};

type EventFormProps = {
  onSubmit: (input: NewEventInput) => Promise<void> | void;
  onCancel: () => void;
};

export function EventForm({ onSubmit, onCancel }: EventFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [lugar, setLugar] = useState("");
  const [fecha, setFecha] = useState(today);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("time_range");
  const [inicio, setInicio] = useState("09:00");
  const [fin, setFin] = useState("17:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("El nombre del evento es obligatorio.");
      return;
    }

    if (scheduleType === "time_range" && inicio >= fin) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        lugar: lugar.trim(),
        fecha,
        scheduleType,
        inicio: scheduleType === "time_range" ? inicio : null,
        fin: scheduleType === "time_range" ? fin : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrio un error.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="ev-name">Nombre del evento</Label>
        <Input
          id="ev-name"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Ej. Conferencia Anual 2026"
          className="mt-1.5"
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="ev-desc">Descripcion</Label>
        <Textarea
          id="ev-desc"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          placeholder="Detalles del evento (opcional)"
          className="mt-1.5"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ev-loc">Ubicacion</Label>
          <Input id="ev-loc" value={lugar} onChange={(event) => setLugar(event.target.value)} placeholder="Ej. Salon Principal" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ev-date">Fecha</Label>
          <Input id="ev-date" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} className="mt-1.5" />
        </div>
      </div>

      <div>
        <Label>Horario del evento</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <ScheduleButton
            active={scheduleType === "time_range"}
            icon={<Clock className="h-4 w-4 shrink-0" />}
            label="Rango de horas"
            onClick={() => setScheduleType("time_range")}
          />
          <ScheduleButton
            active={scheduleType === "all_day"}
            icon={<Sun className="h-4 w-4 shrink-0" />}
            label="Todo el dia"
            onClick={() => setScheduleType("all_day")}
          />
        </div>
      </div>

      {scheduleType === "time_range" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ev-start">Hora de inicio</Label>
            <Input id="ev-start" type="time" value={inicio} onChange={(event) => setInicio(event.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="ev-end">Hora de fin</Label>
            <Input id="ev-end" type="time" value={fin} onChange={(event) => setFin(event.target.value)} className="mt-1.5" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:opacity-90">
          {submitting ? "Creando..." : "Crear evento"}
        </Button>
      </div>
    </form>
  );
}

function ScheduleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius)] border p-3 text-left text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
      aria-pressed={active}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
