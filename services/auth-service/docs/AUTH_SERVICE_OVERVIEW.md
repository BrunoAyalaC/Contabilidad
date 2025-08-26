# Auth Service — Visión general

Microservicio de autenticación para el monorepo "Contabilidad".

Propósito

- Proveer autenticación y emisión de tokens (access token JWT + refresh tokens).
- Gestionar la rotación y revocación de refresh tokens.
- Exponer health checks para orquestación y readiness.

Contenido de la carpeta `docs/`

- `ENV_VARS.md` — variables de entorno necesarias y ejemplos.
- `API.md` — endpoints expuestos (login, refresh, logout, health).
- `DOCKER.md` — instrucciones para build/run y healthcheck.
- `SECURITY.md` — notas y buenas prácticas de seguridad.

Quick-start de desarrollo

1. Crear un `.env` con las variables listadas en `ENV_VARS.md`.
2. Levantar Postgres (local o via docker-compose).
3. Ejecutar la API con dotnet:

```powershell
cd services\auth-service\src\Auth.Api
dotnet run --project Auth.Api.csproj
```

O bien construir la imagen Docker y ejecutarla (ver `DOCKER.md`).

Estado actual

- Implementado: login, refresh (rotación), logout (revocación), background purge, Dockerfile, health checks y tests unitarios básicos.
- Documentación técnica y Docker notes en `docs/`.

Si quieres, puedo generar un OpenAPI (`openapi.yaml`) y añadir instrucciones para exponer Swagger en la imagen de runtime.
