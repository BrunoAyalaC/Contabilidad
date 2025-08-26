# Seguridad — Auth Service

Prácticas y recomendaciones para producción.

Secrets

- Nunca almacenar `JWT__KEY` en repositorio. Usar un secret manager (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault).
- Rotar claves periódicamente y soportar key rollover (kid) — migrar a RS256 con JWKS para escalado.

Tokens

- Use access tokens de corta vida (p. ej. 15 minutos) y refresh tokens de mayor duración pero revocables.
- Almacenar refresh tokens en servidor hashed (bcrypt/sha256+salt) y only store hashed in DB (la implementación actual ya hashea el token en DB si aplica).
- Para aplicaciones web, use httpOnly Secure SameSite=strict cookies para refresh tokens.

Protección contra ataques

- Implementar rate limiting en endpoints `/login` y `/refresh`.
- Monitorear intentos fallidos y bloquear IPs/usuarios sospechosos temporalmente.
- Validar y sanear inputs para prevenir inyecciones.

Auditoría y trazabilidad

- Registrar eventos críticos: login success/fail, refresh token rotate, logout/revoke.
- Guardar correlación (request id) para trazado distribuido.

Recomendación a mediano plazo

- Migrar a RS256 con un servicio de gestión de claves y JWKS para validar tokens sin compartir secrets simétricos entre servicios.
- Habilitar MFA para cuentas admin en producción.
