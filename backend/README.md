# Backend PHP - G-Visitantes

Backend REST PHP 8 + PDO MySQL.

1. Copia `backend/.env.example` a `backend/.env`.
2. Configura `DB_CONNECTION_STRING`.
3. Crea tablas:

```powershell
php backend\scripts\run-sql.php backend\database\schema.sql
```

Servidor local:

```powershell
php -S 0.0.0.0:8081 -t backend/public
```

Con el frontend en modo desarrollo, abre la URL de red que muestra Vite, por ejemplo
`http://172.16.44.79:8080`. El frontend usa `/api` en el mismo host y Vite reenvia esas
peticiones al backend PHP en `http://127.0.0.1:8081`.
