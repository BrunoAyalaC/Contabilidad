# Auth Service — Documentación

Breve: microservicio de autenticación para el monorepo "Contabilidad".

Contenido de esta carpeta:

- `ENV_VARS.md` — variables de entorno necesarias y ejemplos.
- `API.md` — endpoints expuestos (login, refresh, logout, health).
- `DOCKER.md` — instrucciones para build/run y healthcheck.
- `SECURITY.md` — notas y buenas prácticas de seguridad.

Quick-start (desarrollo)

1. Configura un `.env` con las variables listadas en `ENV_VARS.md`.
2. Levanta Postgres (local o via docker-compose).
3. Corre la aplicación con dotnet:

```powershell
cd services\auth-service\src\Auth.Api
dotnet run --project Auth.Api.csproj
```

O con Docker (ver `DOCKER.md`).

Estado: documentación MVP añadida. Pide si quieres un README más extenso con diagramas o un OpenAPI auto-generado.
