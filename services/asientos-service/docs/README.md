# Asientos Service - Documentación Técnica

## Dominio principal

- **AsientoContable**: Representa un asiento contable (Journal Entry)
- **DetalleAsiento**: Línea de asiento (Journal Entry Line)

## Endpoints iniciales

- POST `/api/v1/asientos` - Crear asiento contable
- GET `/api/v1/asientos` - Listar asientos
- GET `/api/v1/asientos/{id}` - Consultar detalle
- POST `/api/v1/asientos/{id}/anular` - Anular asiento

## Reglas de negocio clave

- Todo asiento debe estar balanceado (debe = haber)
- No se puede anular un asiento ya anulado
- Relación directa con cuentas del plan contable

## Pruebas

- Unitarias: lógica de dominio y validaciones
- Integración: endpoints y persistencia

## Futuro

- Integración con ventas, compras, bancos
- Auditoría y trazabilidad

---

> Mantener esta documentación actualizada con cada cambio relevante.
