<?php
declare(strict_types=1);
if (($argv[1] ?? '') === '') { fwrite(STDERR, "Uso: php backend/scripts/run-sql.php backend/database/schema.sql\n"); exit(1); }
$config = require __DIR__ . '/../config/config.php';
$pdo = new PDO($config['database']['dsn'], $config['database']['user'], $config['database']['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => $config['database']['timeout'] ?? 10]);
$sql = file_get_contents($argv[1]);
if ($sql === false) throw new RuntimeException('No se pudo leer el archivo SQL.');
foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) $pdo->exec($statement);
echo "SQL ejecutado: {$argv[1]}\n";
