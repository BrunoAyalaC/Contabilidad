# Docker — Auth Service

Construir la imagen (desde la raíz del proyecto):

```powershell
cd services\auth-service
docker build -t contabilidad-auth:local .
```

Run local (ejemplo con variables env mínimas):

```powershell
docker run --rm -p 8000:80 `
  -e JWT__KEY="dev-secret-placeholder" `
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;Port=5432;Database=authdb;Username=postgres;Password=postgres" `
  contabilidad-auth:local
```

Dockerfile notas

- El `Dockerfile` usa multi-stage: SDK para build y `mcr.microsoft.com/dotnet/aspnet:9.0` para runtime.
- Se crea usuario `app` no-root y se fija `ASPNETCORE_ENVIRONMENT=Production`.
- HEALTHCHECK verifica `/health/ready`.
- STOPSIGNAL SIGTERM garantizando shutdown gracioso.

Uso con docker-compose

- Recomendado levantar junto a un servicio Postgres. Ejemplo mínimo en `deploy/docker-compose.auth.yml`:

```yaml
version: "3.8"
services:
  auth:
    image: contabilidad-auth:local
    build: ./services/auth-service
    ports:
      - 8000:80
    environment:
      - JWT__KEY=${JWT__KEY}
      - ConnectionStrings__DefaultConnection=${CONNECTIONS__DEFAULT}
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: authdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - 5432:5432
```

Smoke-test health

```powershell
# después de levantar
curl http://localhost:8000/health/ready
```
