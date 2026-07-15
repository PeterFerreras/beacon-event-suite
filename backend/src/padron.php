<?php
declare(strict_types=1);

/**
 * Consulta al padron externo (API JSON) por cedula.
 * Configurable via variable de entorno:
 *   PADRON_API_URL      (default: https://api.cgindustry.com/consulta/padron)
 *   PADRON_API_TIMEOUT  (default: 15)
 */

function padron_env(string $key, string $default = ''): string {
    $v = getenv($key);
    if ($v === false || $v === '') {
        $v = $_ENV[$key] ?? $_SERVER[$key] ?? '';
    }
    return $v !== '' ? (string)$v : $default;
}

function padron_api_url(string $cedula): string {
    $base = rtrim(padron_env('PADRON_API_URL', 'https://api.cgindustry.com/consulta/padron'), '?&');
    return $base . (str_contains($base, '?') ? '&' : '?') . 'cedula=' . rawurlencode($cedula);
}

function padron_nombre_completo(?string $nombre): bool {
    $parts = preg_split('/\s+/', trim((string)$nombre)) ?: [];
    $parts = array_values(array_filter($parts, static fn($p) => $p !== ''));
    return count($parts) >= 3;
}

function padron_api_get_json(string $cedula): ?array {
    $url = padron_api_url($cedula);
    $timeout = max(1, (int)padron_env('PADRON_API_TIMEOUT', '15'));
    $raw = false;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch !== false) {
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_CONNECTTIMEOUT => min($timeout, 10),
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: BeaconEventSuite/1.0'],
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => 0,
            ]);
            $raw = curl_exec($ch);
            if ($raw === false) {
                error_log('PADRON CURL ERROR ' . $url . ': ' . curl_error($ch));
            }
            curl_close($ch);
        }
    }

    if ($raw === false || trim((string)$raw) === '') {
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "Accept: application/json\r\nUser-Agent: BeaconEventSuite/1.0\r\n",
                'timeout' => $timeout,
                'ignore_errors' => true,
            ],
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
        ]);
        $raw = @file_get_contents($url, false, $ctx);
    }

    if ($raw === false || trim((string)$raw) === '') {
        return null;
    }
    $json = json_decode($raw, true);
    return is_array($json) ? $json : null;
}

function padron_api_persona(array $row, string $cedula): array {
    $nombre = trim(implode(' ', array_filter([
        trim((string)($row['nombres']   ?? $row['Nombres']   ?? '')),
        trim((string)($row['apellido1'] ?? $row['Apellido1'] ?? '')),
        trim((string)($row['apellido2'] ?? $row['Apellido2'] ?? '')),
    ], static fn($v) => $v !== '')));

    return [
        'cedula'         => preg_replace('/[^0-9]/', '', (string)($row['Cedula'] ?? $cedula)),
        'nombre'         => $nombre,
        'estado'         => $row['EstadoCivil']   ?? null,
        'provincia'      => $row['Provincia']     ?? null,
        'municipio'      => $row['Municipio']     ?? null,
        'fechaNacimiento'=> $row['FechaNacimiento'] ?? null,
        'edad'           => $row['Edad']          ?? null,
        'sexo'           => $row['Sexo']          ?? null,
        'nacionalidad'   => $row['Nacionalidad']  ?? null,
        'fuente'         => 'Padron API',
    ];
}

function padron_extraer_foto(array $row): ?string {
    $foto = $row['FOTO'] ?? $row['foto'] ?? $row['Foto'] ?? null;
    if ($foto === null) return null;

    if (is_string($foto) && trim($foto) !== '') {
        $clean = preg_replace('/^data:image\/[a-zA-Z0-9.+-]+;base64,/', '', trim($foto));
        $decoded = base64_decode($clean, true);
        return ($decoded !== false && $decoded !== '') ? $decoded : null;
    }
    if (is_array($foto)) {
        $data = $foto['data'] ?? $foto['Data'] ?? null;
        if (!is_array($data) || count($data) === 0) return null;
        $bytes = '';
        foreach ($data as $b) {
            if (!is_numeric($b)) continue;
            $v = (int)$b;
            if ($v < 0 || $v > 255) continue;
            $bytes .= chr($v);
        }
        return $bytes !== '' ? $bytes : null;
    }
    return null;
}

function padron_mime(string $bytes): string {
    if (str_starts_with($bytes, "\x89PNG"))  return 'image/png';
    if (str_starts_with($bytes, 'GIF'))       return 'image/gif';
    if (str_starts_with($bytes, "\xFF\xD8\xFF")) return 'image/jpeg';
    return 'image/jpeg';
}

function padron_buscar(string $cedula): ?array {
    if (strlen($cedula) !== 11) return null;
    $json = padron_api_get_json($cedula);
    if (!is_array($json)) return null;
    $data = $json['data'] ?? null;
    if (!is_array($data) || empty($data[0]) || !is_array($data[0])) return null;
    return padron_api_persona($data[0], $cedula);
}

function padron_foto(string $cedula): ?array {
    if (strlen($cedula) !== 11) return null;
    $json = padron_api_get_json($cedula);
    if (!is_array($json)) return null;
    $data = $json['data'] ?? null;
    if (!is_array($data) || empty($data[0]) || !is_array($data[0])) return null;
    $bytes = padron_extraer_foto($data[0]);
    if ($bytes === null || $bytes === '') return null;
    return ['bytes' => $bytes, 'mime' => padron_mime($bytes)];
}

/**
 * Router del padron. Devuelve true si atendio la ruta.
 * Se llama al inicio del route() en index.php.
 */
function padron_route(string $method, string $path): bool {
    if ($method === 'GET' && $path === '/api/padron/buscar') {
        $cedula = preg_replace('/[^0-9]/', '', (string)($_GET['cedula'] ?? ''));
        if ($cedula === '' || strlen($cedula) < 9) {
            Response::error('Cedula invalida', 422);
            return true;
        }
        if (strlen($cedula) !== 11) {
            Response::error('La cedula debe tener 11 digitos', 422);
            return true;
        }
        $persona = padron_buscar($cedula);
        if (!$persona || !padron_nombre_completo($persona['nombre'] ?? '')) {
            Response::error('Cedula no encontrada en padron', 404);
            return true;
        }
        // URL de la foto que consume el frontend directamente.
        $persona['foto'] = '/api/padron/foto?cedula=' . $cedula;
        Response::json($persona);
        return true;
    }

    if ($method === 'GET' && $path === '/api/padron/foto') {
        $cedula = preg_replace('/[^0-9]/', '', (string)($_GET['cedula'] ?? ''));
        if ($cedula === '' || strlen($cedula) !== 11) {
            Response::error('Cedula invalida', 422);
            return true;
        }
        $foto = padron_foto($cedula);
        if ($foto === null) {
            Response::error('Foto no disponible en padron', 404);
            return true;
        }
        if (function_exists('header_remove')) header_remove('Content-Type');
        header('Content-Type: ' . $foto['mime']);
        header('Cache-Control: private, max-age=300');
        echo $foto['bytes'];
        exit;
    }

    return false;
}
