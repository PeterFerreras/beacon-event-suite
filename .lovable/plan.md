# G-Visitantes Eventos — Plantilla Frontend

Plantilla institucional completa (solo frontend, datos simulados) para gestión de visitantes y asistencia a eventos, con estética inspirada en Costa del Faro.

## Sistema visual

- Paleta: azul marino profundo `#0B1E3F`, blanco `#FFFFFF`, gris oscuro `#1F2937` / `#4B5563`, dorado `#C9A24C` como acento.
- Tipografía: `Playfair Display` (títulos, sensación protocolo/VIP) + `Inter` (UI/tablas).
- Componentes shadcn con radios suaves, bordes finos, sombras sutiles, líneas doradas de acento en headers y tarjetas activas.
- Tokens semánticos definidos en `src/styles.css` (oklch): `--primary` (azul marino), `--accent` (dorado), `--sidebar`, etc. Modo claro por defecto.
- Layout: header institucional (espacios para 2 logos + título + usuario), sidebar colapsable con íconos lucide, contenido en tarjetas modernas.

## Arquitectura de rutas (TanStack Start)

Layout raíz con sidebar + header en un layout pathless `_app`:

```
src/routes/
  __root.tsx                (existente, sin cambios estructurales)
  index.tsx                 -> redirige a /dashboard
  _app.tsx                  -> layout con AppSidebar + Header + <Outlet/>
  _app.dashboard.tsx        -> Dashboard
  _app.registro.tsx         -> Registro de Visitante
  _app.visitantes.tsx       -> Listado de Visitantes
  _app.eventos.tsx          -> Eventos (lista + crear)
  _app.eventos.$id.tsx      -> Detalle evento (sesiones, invitados, asistencia)
  _app.invitados.tsx        -> Invitados
  _app.asistencia.tsx       -> Registro de asistencia
  _app.etiquetas.tsx        -> Generador/preview de etiquetas
  _app.reportes.tsx         -> Reportes
  _app.configuracion.tsx    -> Configuración
```

## Componentes compartidos

- `components/layout/AppSidebar.tsx` — sidebar shadcn con secciones y navegación activa.
- `components/layout/AppHeader.tsx` — placeholders para logos, título módulo, buscador global, avatar.
- `components/common/StatCard.tsx`, `SectionCard.tsx`, `DataTable.tsx` (tabla con filtros y paginación mock), `EmptyState.tsx`, `PageHeader.tsx`.
- `components/labels/BadgePrintModal.tsx` — modal imprimible (CSS `@media print`) con nombre, cargo, institución, evento, tipo invitado y QR simulado (SVG).
- `components/forms/VisitorForm.tsx`, `EventForm.tsx`, `GuestForm.tsx` (usando react-hook-form + zod, ya disponibles).
- `components/data/mock.ts` — datasets simulados: visitantes, eventos, sesiones, invitados, asistencia.

## Pantallas — contenido

**Dashboard**: 6 StatCards (visitantes hoy, eventos activos, invitados confirmados, presentes hoy, visitantes dentro, próximos eventos), tabla “Visitantes actualmente dentro” y lista “Próximos eventos” con progreso de confirmaciones.

**Registro de Visitante**: buscador (cédula/nombre) que autocompleta si existe; formulario con foto (dropzone mock), documento, nombre, cargo, institución, área, teléfono, correo, motivo; sección acompañantes (add/remove filas); botones “Registrar entrada” y “Registrar + Imprimir etiqueta” (abre BadgePrintModal).

**Visitantes**: tabla con filtros (fecha, estado dentro/fuera, institución), búsqueda, acciones registrar salida / reimprimir etiqueta / ver detalle (drawer).

**Eventos**: grid de tarjetas de evento (estado: borrador/activo/finalizado, fecha, lugar, % confirmados). Botón “Nuevo evento” abre modal con formulario (nombre, fechas, lugar, estado, requiere confirmación, sesiones/cortes dinámicos). Click en tarjeta → detalle con tabs: Información, Invitados, Sesiones, Asistencia.

**Invitados**: tabla por evento (selector), acciones: agregar, importar (botón mock), buscar, confirmar (toggle estado tipo Outlook: aceptado/tentativo/rechazado), registrar llegada, imprimir etiqueta.

**Asistencia**: selectores evento → día → sesión/corte; buscador (nombre/cédula/QR mock); tabla con estados confirmado/presente/ausente y botones entrada/salida; contadores arriba.

**Etiquetas**: preview de plantilla imprimible, selector de invitado/visitante, botones imprimir y descargar (mock), variantes VIP / Estándar / Prensa con acento dorado.

**Reportes**: cards por tipo (Visitantes, Asistencia por evento, Confirmados, Ausentes, Fotográfico); filtros de fecha/evento; botones “Exportar Excel” y “Exportar PDF” (mock con toast).

**Configuración**: pestañas Institución (nombre + subida de logos), Usuarios (tabla mock), Tipos de invitado, Impresión (tamaño etiqueta), Preferencias.

## Detalles técnicos

- Estado local con `useState`/`useMemo` sobre mocks en `components/data/mock.ts`; sin backend.
- Toasts con `sonner` (ya incluido).
- QR simulado con un SVG generado (patrón determinista por id) para no añadir dependencias.
- Impresión: modal con `window.print()` y estilos `print:` de Tailwind para aislar la etiqueta.
- `head()` por ruta con títulos específicos (`Dashboard — G-Visitantes Eventos`, etc.) en español y `<html lang="es">` en `__root.tsx`.
- Responsive: sidebar colapsa en móvil (patrón shadcn), tablas con scroll horizontal, grids `sm:` / `lg:`.

## Fuera de alcance

- Sin backend, sin auth, sin base de datos, sin generación real de PDF/Excel/QR (todo simulado con feedback visual).
- Sin subida real de imágenes (dropzone visual + preview local).
