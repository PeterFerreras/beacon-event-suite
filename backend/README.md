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
php -S 127.0.0.1:8080 -t backend/public
```
