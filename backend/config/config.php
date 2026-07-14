<?php
declare(strict_types=1);

load_env(__DIR__ . '/../.env');

return [
    'debug' => filter_var(envv('APP_DEBUG', 'true'), FILTER_VALIDATE_BOOL),
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
        return ['dsn' => "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4", 'user' => $p['uid'] ?? $p['user'] ?? '', 'password' => $p['pwd'] ?? $p['password'] ?? '', 'timeout' => (int) envv('DB_TIMEOUT', '10')];
    }
    $host = envv('DB_HOST', '127.0.0.1');
    $port = envv('DB_PORT', '3306');
    $name = envv('DB_NAME', 'g_visitantes');
    return ['dsn' => "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4", 'user' => envv('DB_USER', 'root'), 'password' => envv('DB_PASS'), 'timeout' => (int) envv('DB_TIMEOUT', '10')];
}
