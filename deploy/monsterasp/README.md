# Publicacion en MonsterASP

## Generar el paquete

Desde PowerShell, en la raiz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File deploy\monsterasp\build-package.ps1
```

El resultado es `deploy/monsterasp/beacon-event-suite-monsterasp.zip`. El ZIP contiene directamente los archivos que deben quedar en `wwwroot`.

## Preparar MonsterASP

1. Crea el sitio y una base de datos MySQL desde el panel.
2. En `Websites > Manage > Scripting`, habilita PHP 8.3 o una version posterior.
3. Importa `backend/database/schema.sql` y luego `backend/database/seed.sql` desde tu copia local usando WebMySQL.
4. Sube y extrae el ZIP dentro de `wwwroot`.
5. Copia `wwwroot/backend/.env.example` como `wwwroot/backend/.env` y completa los datos MySQL reales y el dominio HTTPS.
6. Activa el certificado HTTPS desde el panel y reinicia el sitio.
7. Comprueba `https://TU-DOMINIO/api/health` antes de iniciar sesion.

Nunca subas el archivo `backend/.env` local ni publiques sus credenciales en Git.
