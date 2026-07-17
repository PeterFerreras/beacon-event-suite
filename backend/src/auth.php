<?php
declare(strict_types=1);

const ROLE_ADMIN = 'Administrador';
const ROLE_EVENTOS = 'Gestor de eventos';
const ROLE_VISITANTES = 'Gestor de visitantes';

function auth_public_path(string $method, string $path): bool {
    return ($method === 'POST' && $path === '/api/auth/login')
        || ($method === 'GET' && in_array($path, ['/api/health', '/api/db-health'], true))
        || str_starts_with($path, '/api/padron/');
}

function auth_user(Database $db): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (!preg_match('/Bearer\s+(.+)/i', $header, $m)) return null;
    $hash = hash('sha256', trim($m[1]));
    $row = $db->one('SELECT s.id session_id,u.id,u.name,u.email,u.role,u.active FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > NOW() AND u.active=1', [$hash]);
    return $row ?: null;
}

function require_auth(Database $db): array {
    $user = auth_user($db);
    if (!$user) {
        Response::error('No autenticado', 401);
        exit;
    }
    return $user;
}

function require_role(array $user, array $roles): void {
    if ($user['role'] === ROLE_ADMIN) return;
    if (!in_array($user['role'], $roles, true)) {
        Response::error('No autorizado', 403);
        exit;
    }
}

function user_payload(array $user): array {
    return [
        'id' => $user['id'],
        'nombre' => $user['name'],
        'correo' => $user['email'],
        'rol' => $user['role'],
    ];
}

function login(Database $db): void {
    $d = request_json();
    $email = strtolower((string) str_input($d, 'correo', str_input($d, 'email', '')));
    $password = (string) str_input($d, 'password', '');
    if (!$email || !$password) {
        Response::error('Correo y contraseña son obligatorios', 422);
        return;
    }

    $user = $db->one('SELECT id,name,email,role,password_hash,active FROM users WHERE LOWER(email)=?', [$email]);
    if (!$user || !(int) $user['active'] || !$user['password_hash'] || !password_verify($password, $user['password_hash'])) {
        Response::error('Credenciales invalidas', 401);
        return;
    }

    $token = bin2hex(random_bytes(32));
    $db->execute('INSERT INTO auth_sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 12 HOUR))', [
        new_id('ses_'),
        $user['id'],
        hash('sha256', $token),
    ]);
    unset($user['password_hash']);
    Response::json(['token' => $token, 'user' => user_payload($user)]);
}

function logout(Database $db, array $user): void {
    if (!empty($user['session_id'])) {
        $db->execute('DELETE FROM auth_sessions WHERE id=?', [$user['session_id']]);
    }
    Response::json(['ok' => true]);
}

function me(array $user): void {
    Response::json(user_payload($user));
}

