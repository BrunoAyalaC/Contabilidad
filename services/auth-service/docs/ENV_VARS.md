# Variables de Entorno

Estas variables deben estar disponibles en el entorno (ej. `deploy/.env`, secret manager, o CI).

Requeridas

- `ConnectionStrings__DefaultConnection` — Cadena de conexión a Postgres (ej. `Host=postgres;Port=5432;Database=authdb;Username=postgres;Password=postgres`).
- `JWT__KEY` — Clave secreta para firmar access tokens (HS256) — en producción usar secret store, mínimo 32+ bytes.

Opcionales / recomendaciones

- `ASPNETCORE_ENVIRONMENT` — `Development`|`Production` (por defecto `Production` en Dockerfile actualizado).
- `JWT__ACCESS_TOKEN_EXP_MINUTES` — tiempo de vida del access token en minutos.
- `JWT__REFRESH_TOKEN_EXPIRE_DAYS` — días de expiración del refresh token.

Ejemplo `.env` (local):

```
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=authdb;Username=postgres;Password=postgres
JWT__KEY=changeme-dev-secret-please-replace
ASPNETCORE_ENVIRONMENT=Development
JWT__ACCESS_TOKEN_EXP_MINUTES=15
JWT__REFRESH_TOKEN_EXPIRE_DAYS=30
```

Seguridad: nunca comitear `.env` con secretos. Usar GitHub Secrets / Azure Key Vault / AWS Secrets Manager en CI/CD.
