<?php
declare(strict_types=1);

load_env(__DIR__ . '/../.env');
// WebFTP can hide or skip dotfiles. MonsterASP installations may use this
// visible alternative without changing any PHP source.
load_env(__DIR__ . '/database.env');

return [
    'debug' => filter_var(envv('APP_DEBUG', 'false'), FILTER_VALIDATE_BOOL),
    'cors_origin' => envv('CORS_ORIGIN', '*'),
    'database' => db_config(),
];

function load_env(string $path): void {
    if (!is_file($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        if (getenv(trim($k)) === false) putenv(trim($k) . '=' . trim(trim($v), "\"'"));
    }
}
function envv(string $key, string $default = ''): string {
    $value = getenv($key);
    return $value === false ? $default : $value;
}
function db_config(): array {
    $cs = envv('DB_CONNECTION_STRING');
    if ($cs !== '') {
        $p = [];
        foreach (explode(';', $cs) as $part) {
            if (str_contains($part, '=')) {
                [$k, $v] = explode('=', $part, 2);
                $p[strtolower(trim($k))] = trim($v);
            }
        }
        $host = $p['server'] ?? $p['host'] ?? '127.0.0.1';
        $port = $p['port'] ?? '3306';
        $name = $p['database'] ?? $p['dbname'] ?? '';
        $user = $p['uid'] ?? $p['user'] ?? '';
        return ['dsn' => "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4", 'user' => $user, 'password' => $p['pwd'] ?? $p['password'] ?? '', 'timeout' => (int) envv('DB_TIMEOUT', '10'), 'ssl_mode' => $p['sslmode'] ?? 'Preferred', 'configured' => $host !== '' && $name !== '' && $user !== ''];
    }
    $configuredHost = envv('DB_HOST');
    $configuredName = envv('DB_NAME');
    $configuredUser = envv('DB_USER');
    $host = $configuredHost !== '' ? $configuredHost : '127.0.0.1';
    $port = envv('DB_PORT', '3306');
    $name = $configuredName !== '' ? $configuredName : 'g_visitantes';
    $user = $configuredUser !== '' ? $configuredUser : 'root';
    return ['dsn' => "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4", 'user' => $user, 'password' => envv('DB_PASS'), 'timeout' => (int) envv('DB_TIMEOUT', '10'), 'ssl_mode' => envv('DB_SSL_MODE', 'Preferred'), 'configured' => $configuredHost !== '' && $configuredName !== '' && $configuredUser !== ''];
}
