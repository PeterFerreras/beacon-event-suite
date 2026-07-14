<?php
declare(strict_types=1);

function event_row(array $r, array $sessions = []): array {
    return ['id'=>$r['id'], 'nombre'=>$r['name'], 'descripcion'=>$r['description'], 'fechaInicio'=>$r['starts_on'], 'fechaFin'=>$r['ends_on'], 'lugar'=>$r['location'], 'estado'=>$r['status'], 'requiereConfirmacion'=>(bool)$r['requires_confirmation'], 'invitados'=>(int)($r['guest_count'] ?? 0), 'confirmados'=>(int)($r['confirmed_count'] ?? 0), 'presentes'=>(int)($r['present_count'] ?? 0), 'sesiones'=>array_map('session_row', $sessions)];
}
function session_row(array $r): array { return ['id'=>$r['id'], 'eventoId'=>$r['event_id'], 'nombre'=>$r['name'], 'dia'=>$r['session_date'], 'inicio'=>substr((string)$r['starts_at'],0,5), 'fin'=>substr((string)$r['ends_at'],0,5)]; }
function guest_row(array $r): array { return ['id'=>$r['id'], 'eventoId'=>$r['event_id'], 'nombre'=>$r['name'], 'cedula'=>$r['document_id'], 'cargo'=>$r['position'], 'institucion'=>$r['institution'], 'correo'=>$r['email'], 'tipo'=>$r['type_name'], 'confirmacion'=>$r['confirmation'], 'llegada'=>$r['arrival_at'], 'salida'=>$r['departure_at'], 'esVisitante'=>(bool)$r['is_walk_in']]; }
function visitor_row(array $r): array { return ['id'=>$r['visit_id'], 'visitanteId'=>$r['id'], 'cedula'=>$r['document_id'], 'nombre'=>$r['name'], 'cargo'=>$r['position'], 'institucion'=>$r['institution'], 'area'=>$r['area'], 'telefono'=>$r['phone'], 'correo'=>$r['email'], 'motivo'=>$r['reason'], 'entrada'=>$r['entry_at'], 'salida'=>$r['exit_at'], 'status'=>$r['exit_at'] ? 'fuera' : 'dentro', 'foto'=>$r['photo_url'], 'acompanantes'=>(int)($r['companions_count'] ?? 0)]; }
