<?php
declare(strict_types=1);

require __DIR__ . '/../src/Response.php';
require __DIR__ . '/../src/helpers.php';
$config = require __DIR__ . '/../config/config.php';
$method = $_SERVER['REQUEST_METHOD'];
$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/', '/') ?: '/';

header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method === 'GET' && $path === '/api/health') { Response::json(['ok'=>true,'driver'=>'mysql','mysqlConfigured'=>(bool)($config['database']['configured']??false),'time'=>now_sql()]); exit; }

require __DIR__ . '/../src/Database.php';
require __DIR__ . '/../src/Transformers.php';
require __DIR__ . '/../src/padron.php';
require __DIR__ . '/../src/auth.php';
if (empty($config['database']['configured'])) {
    Response::error('Falta configurar MySQL. Crea backend/.env o backend/config/database.env con los datos de MonsterASP.', 500);
    exit;
}
try { $db = new Database($config['database']); }
catch (Throwable $e) {
    $driverCode = $e instanceof PDOException && is_array($e->errorInfo ?? null)
        ? (int)($e->errorInfo[1] ?? 0)
        : (int)$e->getCode();
    $databaseError = match ($driverCode) {
        1045 => 'MySQL rechazo el usuario o la contrasena configurados.',
        2002 => 'No se pudo alcanzar el host MySQL configurado.',
        2054 => 'El usuario MySQL requiere un metodo de autenticacion incompatible con PHP PDO_MYSQL. MonsterASP debe restablecerlo con autenticacion nativa.',
        default => 'MySQL rechazo la conexion antes de iniciar la aplicacion.',
    };
    Response::error('No se pudo conectar a MySQL', 500, [
        'databaseCode' => $driverCode ?: null,
        'databaseError' => $databaseError,
        'detail' => $config['debug'] ? $e->getMessage() : null,
    ]);
    exit;
}

try { route($method, $path, $db); }
catch (Throwable $e) { Response::error('Error interno del servidor', 500, ['detail'=>$config['debug'] ? $e->getMessage() : null]); }

function route(string $method, string $path, Database $db): void { if (padron_route($method, $path)) return;
    if ($method === 'GET' && $path === '/api/db-health') { $db->one('SELECT 1 ok'); Response::json(['ok'=>true,'database'=>'connected']); return; }
    if ($method === 'POST' && $path === '/api/auth/login') { login($db); return; }
    $user = auth_public_path($method, $path) ? null : require_auth($db);
    if ($method === 'GET' && $path === '/api/auth/me') { me($user); return; }
    if ($method === 'POST' && $path === '/api/auth/logout') { logout($db,$user); return; }
    if ($method === 'GET' && $path === '/api/dashboard') { dashboard($db,$user); return; }
    if ($method === 'GET' && $path === '/api/events') { require_role($user,[ROLE_EVENTOS]); $rows=$db->all(event_sql().' ORDER BY e.starts_on DESC'); Response::json(array_map(fn($r)=>event_row($r, sessions($db,$r['id'])), $rows)); return; }
    if ($method === 'POST' && $path === '/api/events') { require_role($user,[ROLE_EVENTOS]); create_event($db); return; }
    if (preg_match('#^/api/events/([^/]+)$#',$path,$m) && $method==='GET') { require_role($user,[ROLE_EVENTOS]); $ev=event_by_id($db,$m[1]); $ev ? Response::json($ev) : Response::error('Evento no encontrado',404); return; }
    if (preg_match('#^/api/events/([^/]+)$#',$path,$m) && $method==='PATCH') { require_role($user,[ROLE_EVENTOS]); update_event($db,$m[1]); return; }
    if (preg_match('#^/api/events/([^/]+)/guests$#',$path,$m)) { require_role($user,[ROLE_EVENTOS]); if ($method==='GET') guests($db,$m[1]); elseif ($method==='POST') create_guest($db,$m[1],false); return; }
    if (preg_match('#^/api/events/([^/]+)/walk-ins$#',$path,$m) && $method==='POST') { require_role($user,[ROLE_EVENTOS]); create_guest($db,$m[1],true); return; }
    if ($method==='GET' && $path==='/api/guests') { require_role($user,[ROLE_EVENTOS]); guests($db,null); return; }
    if (preg_match('#^/api/guests/([^/]+)/confirmation$#',$path,$m) && $method==='PATCH') { require_role($user,[ROLE_EVENTOS]); $c=str_input(request_json(),'confirmacion'); if(!in_array($c,['aceptado','tentativo','rechazado','pendiente'],true)){Response::error('Confirmacion invalida',422);return;} $db->execute('UPDATE guests SET confirmation=? WHERE id=?',[$c,$m[1]]); Response::json(['updated'=>true]); return; }
    if (preg_match('#^/api/guests/([^/]+)/(check-in|check-out)$#',$path,$m) && $method==='POST') { require_role($user,[ROLE_EVENTOS]); check_guest($db,$m[1],$m[2]==='check-in'); return; }
    if (preg_match('#^/api/guests/([^/]+)$#',$path,$m) && $method==='DELETE') { require_role($user,[ROLE_EVENTOS]); $db->execute('DELETE FROM guests WHERE id=?',[$m[1]]); Response::json(['deleted'=>true]); return; }
    if ($method==='GET' && $path==='/api/visitors') { require_role($user,[ROLE_VISITANTES]); visitors($db); return; }
    if ($method==='POST' && $path==='/api/visitors') { require_role($user,[ROLE_VISITANTES]); create_visit($db); return; }
    if ($method==='GET' && $path==='/api/visitors/search') { require_role($user,[ROLE_VISITANTES]); search_visitors($db); return; }
    if (preg_match('#^/api/visitors/([^/]+)/exit$#',$path,$m) && $method==='POST') { require_role($user,[ROLE_VISITANTES]); close_visit($db,$m[1]); return; }
    if ($method==='GET' && $path==='/api/settings') { Response::json(settings($db)); return; }
    if ($method==='PATCH' && $path==='/api/settings') { require_role($user,[ROLE_ADMIN]); foreach(request_json() as $k=>$v) $db->execute('INSERT INTO settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',[(string)$k,is_scalar($v)?(string)$v:json_encode($v)]); Response::json(settings($db)); return; }
    if ($method==='GET' && $path==='/api/users') { require_role($user,[ROLE_ADMIN]); users_list($db); return; }
    if ($method==='POST' && $path==='/api/users') { require_role($user,[ROLE_ADMIN]); users_create($db); return; }
    if (preg_match('#^/api/users/([^/]+)$#',$path,$m) && $method==='PATCH') { require_role($user,[ROLE_ADMIN]); users_update($db,$m[1]); return; }
    if (preg_match('#^/api/users/([^/]+)/reset-password$#',$path,$m) && $method==='POST') { require_role($user,[ROLE_ADMIN]); users_reset_password($db,$m[1]); return; }
    if ($method==='GET' && $path==='/api/guest-types') { require_role($user,[ROLE_EVENTOS,ROLE_VISITANTES]); Response::json($db->all('SELECT id,name AS nombre,color FROM guest_types ORDER BY sort_order,name')); return; }
    if ($method==='POST' && $path==='/api/guest-types') { require_role($user,[ROLE_ADMIN]); create_guest_type($db); return; }
    if (preg_match('#^/api/reports/([^/]+)$#',$path,$m) && $method==='GET') { require_role($user,[ROLE_ADMIN]); report($db,$m[1]); return; }
    Response::error('Ruta no encontrada',404);
}
function event_sql(): string { return "SELECT e.*,(SELECT COUNT(*) FROM guests g WHERE g.event_id=e.id) guest_count,(SELECT COUNT(*) FROM guests g WHERE g.event_id=e.id AND g.confirmation='aceptado') confirmed_count,(SELECT COUNT(*) FROM guests g WHERE g.event_id=e.id AND g.arrival_at IS NOT NULL) present_count FROM events e"; }
function sessions(Database $db,string $eventId): array { return $db->all('SELECT * FROM event_sessions WHERE event_id=? ORDER BY session_date,starts_at',[$eventId]); }
function event_by_id(Database $db,string $id): ?array { $r=$db->one(event_sql().' WHERE e.id=?',[$id]); return $r?event_row($r,sessions($db,$id)):null; }
function create_event(Database $db): void { $d=request_json(); $name=str_input($d,'nombre'); if(!$name){Response::error('El nombre del evento es obligatorio',422);return;} $id=new_id('ev_'); $date=str_input($d,'fecha',date('Y-m-d')); $end=str_input($d,'fechaFin',$date); $startTime=str_input($d,'inicio','09:00'); $endTime=str_input($d,'fin','17:00'); $status=str_input($d,'estado'); if(!valid_date($date)||!valid_date($end)){Response::error('La fecha del evento no es valida',422);return;} if($end<$date){Response::error('La fecha final no puede ser anterior a la fecha inicial',422);return;} $status=$status?:event_status_for_dates($date,$end); if(!in_array($status,['borrador','activo','finalizado'],true)){Response::error('Estado invalido',422);return;} if(!valid_time($startTime)||!valid_time($endTime)){Response::error('El horario del evento no es valido',422);return;} if($date===$end&&$endTime<=$startTime){Response::error('La hora final debe ser mayor que la hora inicial',422);return;} if($db->one('SELECT id FROM events WHERE LOWER(name)=LOWER(?) AND starts_on=?',[$name,$date])){Response::error('Ya existe un evento con ese nombre en esa fecha',409);return;} $db->pdo()->beginTransaction(); $db->execute('INSERT INTO events (id,name,description,starts_on,ends_on,location,status,requires_confirmation) VALUES (?,?,?,?,?,?,?,?)',[$id,$name,str_input($d,'descripcion',''),$date,$end,str_input($d,'lugar','Sin ubicacion'),$status,bool_input($d,'requiereConfirmacion',true)?1:0]); $db->execute('INSERT INTO event_sessions (id,event_id,name,session_date,starts_at,ends_at) VALUES (?,?,?,?,?,?)',[new_id('ses_'),$id,'Horario principal',$date,$startTime,$endTime]); $db->pdo()->commit(); Response::json(event_by_id($db,$id),201); }
function update_event(Database $db,string $id): void { $d=request_json(); $sets=[]; $p=[]; $map=['nombre'=>'name','descripcion'=>'description','fechaInicio'=>'starts_on','fechaFin'=>'ends_on','lugar'=>'location','estado'=>'status']; foreach($map as $input=>$column){ if(array_key_exists($input,$d)){ if($input==='estado'&&!in_array((string)$d[$input],['borrador','activo','finalizado'],true)){Response::error('Estado invalido',422);return;} $sets[]="$column=?"; $p[]=is_scalar($d[$input])?(string)$d[$input]:null; } } if(array_key_exists('requiereConfirmacion',$d)){ $sets[]='requires_confirmation=?'; $p[]=bool_input($d,'requiereConfirmacion',false)?1:0; } if(!$sets){ $ev=event_by_id($db,$id); $ev?Response::json($ev):Response::error('Evento no encontrado',404); return; } $p[]=$id; $db->execute('UPDATE events SET '.implode(',',$sets).' WHERE id=?',$p); $ev=event_by_id($db,$id); $ev?Response::json($ev):Response::error('Evento no encontrado',404); }
function guest_select(): string { return 'SELECT g.*,gt.name AS type_name FROM guests g JOIN guest_types gt ON gt.id=g.guest_type_id'; }
function guests(Database $db,?string $eventId): void { $sql=guest_select(); $p=[]; if($eventId){$sql.=' WHERE g.event_id=?';$p[]=$eventId;} Response::json(array_map('guest_row',$db->all($sql.' ORDER BY g.name',$p))); }
function guest_type_id(Database $db,string $name): string { $r=$db->one('SELECT id FROM guest_types WHERE name=?',[$name]); if($r)return $r['id']; $id=new_id('gt_'); $db->execute('INSERT INTO guest_types (id,name,color,sort_order) VALUES (?,?,?,?)',[$id,$name,'#1d4ed8',100]); return $id; }
function create_guest(Database $db,string $eventId,bool $walkIn): void { $d=request_json(); if(!event_by_id($db,$eventId)){Response::error('Evento no encontrado',404);return;} $name=str_input($d,'nombre'); if(!$name){Response::error('El nombre es obligatorio',422);return;} $doc=normalize_doc(str_input($d,'cedula','')); if(!$doc){Response::error('La cedula o documento es obligatorio',422);return;} $email=str_input($d,'correo',''); if($email&&!valid_email($email)){Response::error('El correo del invitado no es valido',422);return;} if($db->one('SELECT id FROM guests WHERE event_id=? AND document_id=?',[$eventId,$doc])){Response::error('Este invitado ya esta registrado en este evento',409);return;} $confirmation=str_input($d,'confirmacion',$walkIn?'aceptado':'pendiente'); if(!in_array($confirmation,['aceptado','tentativo','rechazado','pendiente'],true)){Response::error('Confirmacion invalida',422);return;} $id=new_id($walkIn?'walk_':'g_'); $type=$walkIn?str_input($d,'tipo','Protocolo'):str_input($d,'tipo','Estandar'); $db->execute('INSERT INTO guests (id,event_id,guest_type_id,name,document_id,position,institution,email,confirmation,arrival_at,is_walk_in) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[$id,$eventId,guest_type_id($db,$type),$name,$doc,str_input($d,'cargo',''),str_input($d,'institucion',''),$email,$confirmation,$walkIn?now_sql():str_input($d,'llegada'),$walkIn?1:0]); Response::json(guest_row($db->one(guest_select().' WHERE g.id=?',[$id])),201); }
function check_guest(Database $db,string $guestId,bool $in): void { $d=request_json(); $guest=$db->one('SELECT id,arrival_at,departure_at FROM guests WHERE id=?',[$guestId]); if(!$guest){Response::error('Invitado no encontrado',404);return;} if($in&&$guest['arrival_at']){Response::error('Este invitado ya tiene entrada registrada',409);return;} if(!$in&&!$guest['arrival_at']){Response::error('No se puede registrar salida sin una entrada previa',409);return;} if(!$in&&$guest['departure_at']){Response::error('Este invitado ya tiene salida registrada',409);return;} $sessionId=str_input($d,'sesionId'); if($sessionId&&!$db->one('SELECT id FROM event_sessions WHERE id=?',[$sessionId])){Response::error('Sesion no encontrada',404);return;} $time=now_sql(); $db->execute('UPDATE guests SET '.($in?'arrival_at':'departure_at').'=? WHERE id=?',[$time,$guestId]); $db->execute('INSERT INTO attendance_logs (id,guest_id,event_session_id,action,happened_at) VALUES (?,?,?,?,?)',[new_id('att_'),$guestId,$sessionId,$in?'entrada':'salida',$time]); Response::json(['updated'=>true,$in?'llegada':'salida'=>$time]); }
function visitor_select(): string { return 'SELECT v.*,vs.id visit_id,vs.area,vs.reason,vs.entry_at,vs.exit_at,(SELECT COUNT(*) FROM companions c WHERE c.visit_id=vs.id) companions_count FROM visits vs JOIN visitors v ON v.id=vs.visitor_id'; }
function visitors(Database $db): void { $s=$_GET['status']??'todos'; $where=$s==='dentro'?' WHERE vs.exit_at IS NULL':($s==='fuera'?' WHERE vs.exit_at IS NOT NULL':''); Response::json(array_map('visitor_row',$db->all(visitor_select().$where.' ORDER BY vs.entry_at DESC'))); }
function search_visitors(Database $db): void { $q='%'.trim((string)($_GET['q']??'')).'%'; Response::json($db->all('SELECT id AS visit_id,id,document_id AS cedula,document_id,name AS nombre,name,position AS cargo,position,institution AS institucion,institution,phone AS telefono,phone,email AS correo,email,photo_url AS foto,photo_url,"" AS area,"" AS reason,"" AS entry_at,NULL AS exit_at,0 AS companions_count FROM visitors WHERE document_id LIKE ? OR name LIKE ? OR institution LIKE ? ORDER BY name LIMIT 10',[$q,$q,$q])); }
function create_visit(Database $db): void { $d=request_json(); $name=str_input($d,'nombre'); $doc=normalize_doc(str_input($d,'cedula','')); $email=str_input($d,'correo',''); if(!$name||!$doc){Response::error('Cedula y nombre son obligatorios',422);return;} if($email&&!valid_email($email)){Response::error('El correo del visitante no es valido',422);return;} $open=$db->one('SELECT vs.id FROM visits vs JOIN visitors v ON v.id=vs.visitor_id WHERE v.document_id=? AND vs.exit_at IS NULL',[$doc]); if($open){Response::error('Este visitante ya tiene una entrada activa. Registre su salida antes de crear otra visita.',409);return;} $db->pdo()->beginTransaction(); $ex=$db->one('SELECT id FROM visitors WHERE document_id=?',[$doc]); $visitorId=$ex['id']??new_id('v_'); if($ex)$db->execute('UPDATE visitors SET name=?,position=?,institution=?,phone=?,email=? WHERE id=?',[$name,str_input($d,'cargo',''),str_input($d,'institucion',''),str_input($d,'telefono',''),$email,$visitorId]); else $db->execute('INSERT INTO visitors (id,document_id,name,position,institution,phone,email,photo_url) VALUES (?,?,?,?,?,?,?,?)',[$visitorId,$doc,$name,str_input($d,'cargo',''),str_input($d,'institucion',''),str_input($d,'telefono',''),$email,str_input($d,'foto')]); $visitId=new_id('vis_'); $db->execute('INSERT INTO visits (id,visitor_id,area,reason,entry_at) VALUES (?,?,?,?,?)',[$visitId,$visitorId,str_input($d,'area',''),str_input($d,'motivo',''),now_sql()]); foreach(($d['acompanantes']??[]) as $c) if(is_array($c)&&trim((string)($c['nombre']??''))!=='') $db->execute('INSERT INTO companions (id,visit_id,name,document_id) VALUES (?,?,?,?)',[new_id('cmp_'),$visitId,trim((string)$c['nombre']),normalize_doc((string)($c['cedula']??''))]); $db->pdo()->commit(); Response::json(visitor_row($db->one(visitor_select().' WHERE vs.id=?',[$visitId])),201); }
function close_visit(Database $db,string $id): void { $visit=$db->one('SELECT id,exit_at FROM visits WHERE id=?',[$id]); if(!$visit){Response::error('Visita no encontrada',404);return;} if($visit['exit_at']){Response::error('Esta visita ya tiene salida registrada',409);return;} $db->execute('UPDATE visits SET exit_at=? WHERE id=?',[now_sql(),$id]); Response::json(['updated'=>true]); }
function dashboard(Database $db,array $user): void { $today=date('Y-m-d'); $eventStats=['eventosActivos'=>(int)$db->one("SELECT COUNT(*) c FROM events WHERE status='activo'")['c'],'invitadosConfirmados'=>(int)$db->one("SELECT COUNT(*) c FROM guests WHERE confirmation='aceptado'")['c'],'presentesHoy'=>(int)$db->one('SELECT COUNT(*) c FROM guests WHERE DATE(arrival_at)=?',[$today])['c'],'proximosEventos'=>(int)$db->one("SELECT COUNT(*) c FROM events WHERE status<>'finalizado' AND ends_on>=?",[$today])['c']]; $visitorStats=['visitantesHoy'=>(int)$db->one('SELECT COUNT(*) c FROM visits WHERE DATE(entry_at)=?',[$today])['c'],'visitantesDentro'=>(int)$db->one('SELECT COUNT(*) c FROM visits WHERE exit_at IS NULL')['c']]; if($user['role']===ROLE_EVENTOS) Response::json(array_merge(['visitantesHoy'=>0,'visitantesDentro'=>0],$eventStats)); elseif($user['role']===ROLE_VISITANTES) Response::json(array_merge($visitorStats,['eventosActivos'=>0,'invitadosConfirmados'=>0,'presentesHoy'=>0,'proximosEventos'=>0])); else Response::json(array_merge($visitorStats,$eventStats)); }
function users_list(Database $db): void { Response::json($db->all('SELECT id,name AS nombre,role AS rol,email AS correo,active AS activo,created_at AS creado FROM users ORDER BY name')); }
function valid_user_role(string $role): bool { return in_array($role,[ROLE_ADMIN,ROLE_EVENTOS,ROLE_VISITANTES],true); }
function users_create(Database $db): void { $d=request_json(); $name=str_input($d,'nombre'); $email=normalize_email(str_input($d,'correo')); $role=str_input($d,'rol',ROLE_VISITANTES); $password=str_input($d,'password','123'); if(!$name||!$email){Response::error('Nombre y correo son obligatorios',422);return;} if(!valid_email($email)){Response::error('El correo no es valido',422);return;} if(!valid_user_role($role)){Response::error('Rol invalido',422);return;} if(strlen((string)$password)<3){Response::error('La contraseña debe tener al menos 3 caracteres',422);return;} if($db->one('SELECT id FROM users WHERE LOWER(email)=?',[$email])){Response::error('Ya existe un usuario con ese correo',409);return;} $id=new_id('u_'); $db->execute('INSERT INTO users (id,name,role,email,password_hash,active) VALUES (?,?,?,?,?,1)',[$id,$name,$role,$email,password_hash((string)$password,PASSWORD_DEFAULT)]); Response::json($db->one('SELECT id,name AS nombre,role AS rol,email AS correo,active AS activo FROM users WHERE id=?',[$id]),201); }
function users_update(Database $db,string $id): void { $d=request_json(); if(!$db->one('SELECT id FROM users WHERE id=?',[$id])){Response::error('Usuario no encontrado',404);return;} $sets=[];$p=[]; if(array_key_exists('nombre',$d)){ $name=str_input($d,'nombre',''); if(!$name){Response::error('El nombre es obligatorio',422);return;} $sets[]='name=?'; $p[]=$name; } if(array_key_exists('correo',$d)){ $email=normalize_email(str_input($d,'correo')); if(!$email||!valid_email($email)){Response::error('El correo no es valido',422);return;} if($db->one('SELECT id FROM users WHERE LOWER(email)=? AND id<>?',[$email,$id])){Response::error('Ya existe otro usuario con ese correo',409);return;} $sets[]='email=?'; $p[]=$email; } if(array_key_exists('rol',$d)){ $role=str_input($d,'rol'); if(!valid_user_role($role)){Response::error('Rol invalido',422);return;} $sets[]='role=?'; $p[]=$role; } if(array_key_exists('activo',$d)){ $sets[]='active=?'; $p[]=bool_input($d,'activo',true)?1:0; } if(!$sets){ users_list($db); return; } $p[]=$id; $db->execute('UPDATE users SET '.implode(',',$sets).' WHERE id=?',$p); if(in_array('active=?',$sets,true))$db->execute('DELETE FROM auth_sessions WHERE user_id=? AND (SELECT active FROM users WHERE id=?)=0',[$id,$id]); Response::json($db->one('SELECT id,name AS nombre,role AS rol,email AS correo,active AS activo FROM users WHERE id=?',[$id])); }
function users_reset_password(Database $db,string $id): void { if(!$db->one('SELECT id FROM users WHERE id=?',[$id])){Response::error('Usuario no encontrado',404);return;} $d=request_json(); $password=str_input($d,'password','123'); if(strlen($password)<3){Response::error('La contraseña debe tener al menos 3 caracteres',422);return;} $db->execute('UPDATE users SET password_hash=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$id]); $db->execute('DELETE FROM auth_sessions WHERE user_id=?',[$id]); Response::json(['updated'=>true,'temporaryPassword'=>$password]); }
function settings(Database $db): array { $out=[]; foreach($db->all('SELECT setting_key,setting_value FROM settings') as $r)$out[$r['setting_key']]=$r['setting_value']; return $out; }
function create_guest_type(Database $db): void { $name=str_input(request_json(),'nombre'); if(!$name){Response::error('El nombre del tipo es obligatorio',422);return;} if($db->one('SELECT id FROM guest_types WHERE LOWER(name)=LOWER(?)',[$name])){Response::error('Ya existe un tipo de invitado con ese nombre',409);return;} $id=new_id('gt_'); $db->execute('INSERT INTO guest_types (id,name,color,sort_order) VALUES (?,?,?,?)',[$id,$name,'#1d4ed8',100]); Response::json($db->one('SELECT id,name AS nombre,color FROM guest_types WHERE id=?',[$id]),201); }
function report(Database $db,string $type): void {
  $format=strtolower((string)($_GET['format']??'json'));
  $data=report_dataset($db,$type);
  if(!$data){Response::error('Reporte no soportado',404);return;}
  if($format==='csv'||$format==='excel'||$format==='xlsx'){download_csv($data);return;}
  if($format==='pdf'){download_pdf($data);return;}
  Response::json(['tipo'=>$type,'items'=>$data['rows']]);
}
function report_dataset(Database $db,string $type): ?array {
  if($type==='visitantes'){
    $rows=array_map('visitor_row',$db->all(visitor_select().' ORDER BY vs.entry_at DESC'));
    $columns=[['cedula','Documento'],['nombre','Nombre'],['cargo','Cargo'],['institucion','Institucion'],['area','Area'],['telefono','Telefono'],['correo','Correo'],['motivo','Motivo'],['entrada','Entrada'],['salida','Salida'],['status','Estado'],['acompanantes','Acompanantes']];
    return ['title'=>'Reporte de visitantes','filename'=>$type,'columns'=>$columns,'rows'=>$rows];
  }
  if(in_array($type,['asistencia','confirmados','ausentes'],true)){
    $sql='SELECT g.*,gt.name AS type_name,e.name AS event_name,e.starts_on AS event_date,e.location AS event_location FROM guests g JOIN guest_types gt ON gt.id=g.guest_type_id JOIN events e ON e.id=g.event_id ORDER BY e.starts_on DESC,e.name,g.name';
    $rows=array_map(fn($r)=>['evento'=>$r['event_name'],'fecha'=>$r['event_date'],'lugar'=>$r['event_location']]+guest_row($r),$db->all($sql));
    if($type==='confirmados')$rows=array_values(array_filter($rows,fn($i)=>$i['confirmacion']==='aceptado'));
    if($type==='ausentes')$rows=array_values(array_filter($rows,fn($i)=>$i['confirmacion']==='aceptado'&&!$i['llegada']));
    $titles=['asistencia'=>'Reporte de asistencia por evento','confirmados'=>'Reporte de invitados confirmados','ausentes'=>'Reporte de invitados ausentes'];
    return ['title'=>$titles[$type],'filename'=>$type,'groupBy'=>'evento','columns'=>[['evento','Evento'],['fecha','Fecha'],['lugar','Lugar'],['cedula','Documento'],['nombre','Nombre'],['cargo','Cargo'],['institucion','Institucion'],['correo','Correo'],['tipo','Tipo'],['confirmacion','Confirmacion'],['llegada','Entrada'],['salida','Salida'],['esVisitante','Visitante externo']],'rows'=>$rows];
  }
  return null;
}
function download_csv(array $data): void {
  $filename=safe_filename((string)$data['filename']).'-'.date('Ymd-His').'.csv';
  http_response_code(200);
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="'.$filename.'"');
  echo "\xEF\xBB\xBF";
  $out=fopen('php://output','w');
  if(isset($data['groupBy'])) {
    $groups=report_groups($data);
    foreach($groups as $group){
      fputcsv($out,['Evento',$group['label']]);
      if(isset($group['meta']))fputcsv($out,['Fecha',report_value($group['meta']['fecha']??''),'Lugar',report_value($group['meta']['lugar']??'')]);
      fputcsv($out,array_map(fn($c)=>$c[1],report_detail_columns($data)));
      foreach($group['rows'] as $i=>$row)fputcsv($out,array_merge([$i+1],array_map(fn($c)=>report_value($row[$c[0]]??''),report_detail_columns($data,true))));
      fputcsv($out,[]);
    }
  } else {
    fputcsv($out,array_map(fn($c)=>$c[1],$data['columns']));
    foreach($data['rows'] as $row)fputcsv($out,array_map(fn($c)=>report_value($row[$c[0]]??''),$data['columns']));
  }
  fclose($out);
}
function download_pdf(array $data): void {
  $filename=safe_filename((string)$data['filename']).'-'.date('Ymd-His').'.pdf';
  $lines=report_pdf_lines($data);
  $pdf=build_text_pdf((string)$data['title'],$lines);
  http_response_code(200);
  header('Content-Type: application/pdf');
  header('Content-Disposition: attachment; filename="'.$filename.'"');
  header('Content-Length: '.strlen($pdf));
  echo $pdf;
}
function report_pdf_lines(array $data): array {
  $lines=['Generado: '.date('Y-m-d H:i:s'),'Registros: '.count($data['rows']),''];
  if(!$data['rows'])return array_merge($lines,['No hay registros para este reporte.']);
  if(isset($data['groupBy'])){
    foreach(report_groups($data) as $group){
      $lines[]='Evento: '.$group['label'];
      if(isset($group['meta']))$lines[]='Fecha: '.report_value($group['meta']['fecha']??'').' | Lugar: '.report_value($group['meta']['lugar']??'');
      foreach($group['rows'] as $i=>$row){
        $parts=[];
        foreach(report_detail_columns($data,true) as $c)$parts[]=$c[1].': '.report_value($row[$c[0]]??'');
        foreach(explode("\n",wordwrap(($i+1).'. '.implode(' | ',$parts),95,"\n",true)) as $line)$lines[]=$line;
      }
      $lines[]='';
    }
    return $lines;
  }
  foreach($data['rows'] as $i=>$row){
    $parts=[];
    foreach($data['columns'] as $c)$parts[]=$c[1].': '.report_value($row[$c[0]]??'');
    foreach(explode("\n",wordwrap(($i+1).'. '.implode(' | ',$parts),95,"\n",true)) as $line)$lines[]=$line;
    $lines[]='';
  }
  return $lines;
}
function report_groups(array $data): array {
  $key=(string)$data['groupBy'];
  $groups=[];
  foreach($data['rows'] as $row){
    $label=report_value($row[$key]??'Sin evento');
    if(!isset($groups[$label]))$groups[$label]=['label'=>$label,'meta'=>['fecha'=>$row['fecha']??null,'lugar'=>$row['lugar']??null],'rows'=>[]];
    $groups[$label]['rows'][]=$row;
  }
  return array_values($groups);
}
function report_detail_columns(array $data,bool $skipIndex=false): array {
  $columns=array_values(array_filter($data['columns'],fn($c)=>!in_array($c[0],['evento','fecha','lugar'],true)));
  return $skipIndex?$columns:array_merge([['#','#']],$columns);
}
function build_text_pdf(string $title,array $lines): string {
  $pages=array_chunk($lines,54);
  $objects=[];
  $catalogObj=pdf_add_object($objects,'');
  $pagesObj=pdf_add_object($objects,'');
  $fontObj=pdf_add_object($objects,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  $boldObj=pdf_add_object($objects,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  $logo=pdf_logo_image();
  $logoObj=null;
  if($logo){
    $maskObj=pdf_add_object($objects,'<< /Type /XObject /Subtype /Image /Width '.$logo['width'].' /Height '.$logo['height'].' /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length '.strlen($logo['alpha'])." >>\nstream\n".$logo['alpha']."\nendstream");
    $logoObj=pdf_add_object($objects,'<< /Type /XObject /Subtype /Image /Width '.$logo['width'].' /Height '.$logo['height'].' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask '.$maskObj.' 0 R /Length '.strlen($logo['rgb'])." >>\nstream\n".$logo['rgb']."\nendstream");
  }
  $kids=[];
  foreach($pages as $pageIndex=>$pageLines){
    $content=pdf_stream($title,$pageLines,$pageIndex+1,count($pages),(bool)$logoObj);
    $contentObj=pdf_add_object($objects,'<< /Length '.strlen($content).' >>'."\nstream\n".$content."\nendstream");
    $resources='<< /Font << /F1 '.$fontObj.' 0 R /F2 '.$boldObj.' 0 R >>'.($logoObj?' /XObject << /Logo '.$logoObj.' 0 R >>':'').' >>';
    $pageObj=pdf_add_object($objects,'<< /Type /Page /Parent '.$pagesObj.' 0 R /MediaBox [0 0 612 792] /Resources '.$resources.' /Contents '.$contentObj.' 0 R >>');
    $kids[]=$pageObj.' 0 R';
  }
  $objects[$catalogObj-1]='<< /Type /Catalog /Pages '.$pagesObj.' 0 R >>';
  $objects[$pagesObj-1]='<< /Type /Pages /Kids ['.implode(' ',$kids).'] /Count '.count($pages).' >>';
  $pdf="%PDF-1.4\n";$offsets=[0];
  foreach($objects as $i=>$obj){$offsets[$i+1]=strlen($pdf);$pdf.=($i+1)." 0 obj\n".$obj."\nendobj\n";}
  $xref=strlen($pdf);$pdf.="xref\n0 ".(count($objects)+1)."\n0000000000 65535 f \n";
  for($i=1;$i<=count($objects);$i++)$pdf.=sprintf("%010d 00000 n \n",$offsets[$i]);
  return $pdf."trailer\n<< /Size ".(count($objects)+1)." /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF";
}
function pdf_add_object(array &$objects,string $body): int { $objects[]=$body; return count($objects); }
function pdf_stream(string $title,array $lines,int $page,int $total,bool $hasLogo): string {
  $cmd="0.02 0.12 0.24 rg 0 728 612 64 re f\n";
  $cmd.="0.12 0.48 0.86 rg 0 728 612 4 re f\n";
  if($hasLogo)$cmd.="q 58 0 0 24 36 748 cm /Logo Do Q\n";
  else {$cmd.="1 1 1 rg 36 746 58 28 re f\n0.12 0.48 0.86 rg 42 757 46 6 re f\n";}
  $cmd.="BT /F2 8 Tf 106 766 Td 1 0.66 0 rg (COSTA DEL FARO) Tj ET\n";
  $cmd.="BT /F2 12 Tf 106 748 Td 1 1 1 rg (Registro de Eventos y Visitas) Tj ET\n";
  $cmd.="BT /F1 8 Tf 508 748 Td 0.86 0.92 1 rg (Pagina ".$page." de ".$total.") Tj ET\n";
  $cmd.="BT /F2 18 Tf 36 700 Td 0.03 0.11 0.22 rg (".pdf_escape($title).") Tj ET\n";
  $cmd.="1 0.39 0.04 rg 36 690 42 2 re f\n";
  $y=662;
  foreach($lines as $line){
    $text=(string)$line;
    if($text===''){ $y-=8; continue; }
    if(str_starts_with($text,'Generado:')||str_starts_with($text,'Registros:')){
      $cmd.="BT /F1 8 Tf 36 ".$y." Td 0.29 0.35 0.43 rg (".pdf_escape($text).") Tj ET\n";
      $y-=12;
      continue;
    }
    if(str_starts_with($text,'Evento:')){
      $y-=4;
      $cmd.="0.91 0.96 1 rg 36 ".($y-8)." 540 20 re f\n";
      $cmd.="0.12 0.48 0.86 rg 36 ".($y-8)." 4 20 re f\n";
      $cmd.="BT /F2 10 Tf 48 ".$y." Td 0.03 0.11 0.22 rg (".pdf_escape($text).") Tj ET\n";
      $y-=18;
      continue;
    }
    if(str_starts_with($text,'Fecha:')){
      $cmd.="BT /F1 8 Tf 48 ".$y." Td 0.29 0.35 0.43 rg (".pdf_escape($text).") Tj ET\n";
      $y-=12;
      continue;
    }
    $cmd.="BT /F1 7.2 Tf 48 ".$y." Td 0.08 0.12 0.18 rg (".pdf_escape($text).") Tj ET\n";
    $y-=10;
  }
  $cmd.="0.88 0.9 0.94 RG 36 34 540 0.5 re S\n";
  $cmd.="BT /F1 7 Tf 36 22 Td 0.45 0.5 0.57 rg (Costa del Faro - Reporte institucional generado automaticamente) Tj ET\n";
  return $cmd;
}
function normalize_doc(?string $value): string { return strtoupper(preg_replace('/[^A-Za-z0-9]/','',(string)$value)); }
function normalize_email(?string $value): string { return strtolower(trim((string)$value)); }
function valid_email(string $email): bool { return (bool)filter_var($email,FILTER_VALIDATE_EMAIL); }
function valid_date(?string $date): bool { if(!$date)return false; $d=DateTime::createFromFormat('Y-m-d',$date); return $d&&$d->format('Y-m-d')===$date; }
function valid_time(?string $time): bool { return is_string($time)&&preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/',$time); }
function event_status_for_dates(string $start,string $end): string { $today=date('Y-m-d'); return $today>=$start&&$today<=$end?'activo':'borrador'; }
function pdf_logo_image(): ?array {
  $path=dirname(__DIR__,2).'/public/logo-cf.png';
  if(!is_file($path))return null;
  $png=file_get_contents($path);
  if(substr($png,0,8)!=="\x89PNG\r\n\x1a\n")return null;
  $pos=8;$width=0;$height=0;$bit=0;$color=0;$idat='';
  while($pos<strlen($png)){
    $len=unpack('N',substr($png,$pos,4))[1];$type=substr($png,$pos+4,4);$data=substr($png,$pos+8,$len);$pos+=12+$len;
    if($type==='IHDR'){[$width,$height,$bit,$color]=array_values(unpack('Nwidth/Nheight/Cbit/Ccolor',$data));}
    if($type==='IDAT')$idat.=$data;
    if($type==='IEND')break;
  }
  if($bit!==8||$color!==6||!$idat)return null;
  $raw=@gzuncompress($idat);
  if($raw===false)return null;
  $rows=png_unfilter($raw,$width,$height,4);
  if(!$rows)return null;
  $rgb='';$alpha='';
  foreach($rows as $row)for($x=0;$x<$width;$x++){ $i=$x*4; $rgb.=substr($row,$i,3); $alpha.=$row[$i+3]; }
  return ['width'=>$width,'height'=>$height,'rgb'=>gzcompress($rgb),'alpha'=>gzcompress($alpha)];
}
function png_unfilter(string $raw,int $width,int $height,int $bpp): ?array {
  $stride=$width*$bpp;$rows=[];$offset=0;$prev=str_repeat("\0",$stride);
  for($y=0;$y<$height;$y++){
    if($offset>=strlen($raw))return null;
    $filter=ord($raw[$offset++]);$scan=substr($raw,$offset,$stride);$offset+=$stride;$row='';
    for($i=0;$i<$stride;$i++){
      $x=ord($scan[$i]);$a=$i>=$bpp?ord($row[$i-$bpp]):0;$b=ord($prev[$i]);$c=$i>=$bpp?ord($prev[$i-$bpp]):0;
      $val=match($filter){0=>$x,1=>$x+$a,2=>$x+$b,3=>$x+intdiv($a+$b,2),4=>$x+png_paeth($a,$b,$c),default=>null};
      if($val===null)return null;
      $row.=chr($val&255);
    }
    $rows[]=$row;$prev=$row;
  }
  return $rows;
}
function png_paeth(int $a,int $b,int $c): int { $p=$a+$b-$c;$pa=abs($p-$a);$pb=abs($p-$b);$pc=abs($p-$c); return $pa<=$pb&&$pa<=$pc?$a:($pb<=$pc?$b:$c); }
function report_value(mixed $value): string { if(is_bool($value))return $value?'Si':'No'; if($value===null||$value==='')return '-'; return trim(preg_replace('/\s+/',' ',(string)$value)); }
function safe_filename(string $name): string { return preg_replace('/[^a-z0-9_-]+/i','-',strtolower($name))?:'reporte'; }
function pdf_escape(string $value): string { return str_replace(["\\","(",")","\r","\n"],["\\\\","\\(","\\)"," "," "],$value); }
