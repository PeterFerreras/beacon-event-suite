<?php
declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';
$pdo = new PDO(
    $config['database']['dsn'],
    $config['database']['user'],
    $config['database']['password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => $config['database']['timeout'] ?? 10]
);

$tables = array_slice($argv, 1);
if (!$tables) {
    $tables = ['events', 'event_sessions', 'guests', 'attendance_logs', 'visitors', 'visits', 'companions', 'users', 'guest_types'];
}

foreach ($tables as $table) {
    if (!preg_match('/^[a-z_]+$/', $table)) {
        fwrite(STDERR, "Tabla invalida: {$table}\n");
        exit(1);
    }
    $count = $pdo->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
    echo "{$table}: {$count}\n";
}
