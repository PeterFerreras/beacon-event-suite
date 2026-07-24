<?php
declare(strict_types=1);

final class Database {
    private PDO $pdo;
    public function __construct(array $config) {
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => $config['timeout'] ?? 10,
        ];
        $sslMode = strtolower((string)($config['ssl_mode'] ?? 'preferred'));
        if (!in_array($sslMode, ['disabled', 'disable', 'none', 'false', '0'], true)
            && defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }
        $this->pdo = new PDO($config['dsn'], $config['user'], $config['password'], $options);
    }
    public function pdo(): PDO { return $this->pdo; }
    public function all(string $sql, array $params = []): array { $s = $this->pdo->prepare($sql); $s->execute($params); return $s->fetchAll(); }
    public function one(string $sql, array $params = []): ?array { $s = $this->pdo->prepare($sql); $s->execute($params); $r = $s->fetch(); return $r === false ? null : $r; }
    public function execute(string $sql, array $params = []): int { $s = $this->pdo->prepare($sql); $s->execute($params); return $s->rowCount(); }
}
