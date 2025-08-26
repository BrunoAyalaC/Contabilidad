# API — Auth Service

Base path: `/api/v1/auth` (ajustable via rutas en el proyecto).

Endpoints principales

1. POST /login

- Descripción: autentica credenciales y devuelve `accessToken` (JWT) y `refreshToken`.
- Request (JSON):
  ```json
  { "username": "admin", "password": "P@ssw0rd!" }
  ```
- Response (200):
  ```json
  {
    "accessToken": "<jwt>",
    "refreshToken": "<refresh-token-client>",
    "expiresIn": 900
  }
  ```

2. POST /refresh

- Descripción: rota el refresh token y devuelve un nuevo `accessToken` y `refreshToken`.
- Request (JSON):
  ```json
  { "refreshToken": "<refresh-token-client>" }
  ```
- Response (200): similar a /login.
- Notas: refresh tokens son rotados y se revocan los usados.

3. POST /logout

- Descripción: revoca el refresh token actual (opcionalmente logout global en el futuro).
- Request (JSON):
  ```json
  { "refreshToken": "<refresh-token-client>" }
  ```
- Response: 204 No Content en success.

4. Health checks

- GET /health — Health general (configurada por HealthChecks).
- GET /health/ready — Readiness (usado en Docker HEALTHCHECK).
- GET /health/live — Liveness.

Autorización

- Los endpoints públicos: `/login`, `/refresh`, `/health*`.
- Endpoints protegidos en otras APIs requieren `Authorization: Bearer <accessToken>`.

Errores comunes

- 401 Unauthorized: token inválido o expirado.
- 400 Bad Request: payload mal formado.

Notas de integración

- Almacenar **solo** el refresh token sin hashed en cliente solo si es necesario; preferir httpOnly Secure cookie para refresh tokens en apps web.
