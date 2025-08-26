# Asientos Service (Journal Entries Microservice)

## Propósito

Microservicio responsable de la gestión de asientos contables: registro, validación, consulta y auditoría de movimientos contables.

## Arquitectura

- **Stack:** .NET 9, Clean Architecture, PostgreSQL
- **Capas:**
  - Domain: Entidades, Value Objects, lógica de negocio
  - Application: Casos de uso, DTOs, validaciones
  - Infrastructure: Persistencia, integración con otros servicios
  - API: Endpoints RESTful, autenticación/autorización

## Endpoints Iniciales (REST)

- `POST /api/v1/asientos` — Crear asiento contable
- `GET /api/v1/asientos` — Listar asientos (filtros: fecha, cuenta, usuario)
- `GET /api/v1/asientos/{id}` — Consultar detalle de un asiento
- `POST /api/v1/asientos/{id}/anular` — Anular o revertir asiento

## Modelo de Dominio

- **AsientoContable**: id, fecha, glosa, usuario, estado, lista de detalles
- **DetalleAsiento**: cuenta, debe, haber, descripción

## Pruebas y Calidad

- Pruebas unitarias y de integración en `/tests`
- Documentación técnica en `/docs`
- CI/CD recomendado desde el inicio

## Despliegue

- Variables de entorno para conexión a base de datos y configuración
- Dockerfile y docker-compose sugeridos para despliegue local y productivo

## Futuras Integraciones

- Relación con microservicio de usuarios y plan contable
- Webhooks/eventos para auditoría y notificaciones

---

> Documentación ampliada en `/docs`.
