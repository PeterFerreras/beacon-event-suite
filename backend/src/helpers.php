<?php
declare(strict_types=1);

function request_json(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) { Response::error('JSON invalido', 422); exit; }
    return $data;
}
function str_input(array $data, string $key, ?string $default = null): ?string { return array_key_exists($key, $data) && $data[$key] !== null ? trim((string) $data[$key]) : $default; }
function bool_input(array $data, string $key, bool $default = false): bool { return array_key_exists($key, $data) ? filter_var($data[$key], FILTER_VALIDATE_BOOL) : $default; }
function new_id(string $prefix): string { return $prefix . bin2hex(random_bytes(8)); }
function now_sql(): string { return date('Y-m-d H:i:s'); }
