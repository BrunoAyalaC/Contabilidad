# MVP 1 – Núcleo funcional mínimo y seguro

## Alcance
- Gestión y consulta del plan contable (PCGE) base y personalizado.
- CRUD de cuentas contables (con jerarquía, validaciones y restricciones básicas).
- Endpoints RESTful para consulta y gestión.
- Seguridad básica (autenticación, roles, logs de auditoría).
- Validaciones críticas de negocio (unicidad, jerarquía, no eliminar cuentas con movimientos).
- Documentación OpenAPI/Swagger inicial.
- Pruebas unitarias y de integración básicas.

## 1. Análisis y Diseño
- [ ] Levantamiento de requerimientos esenciales
  - [ ] Reunión con stakeholders para identificar necesidades mínimas y normativas básicas.
  - [ ] Documentar casos de uso principales (gestión y consulta de cuentas).
  - [ ] Validar requerimientos mínimos con usuarios clave.
- [ ] Definición y validación del modelo de datos mínimo
  - [ ] Modelar entidad CuentaContable y relaciones jerárquicas básicas.
  - [ ] Definir atributos obligatorios para MVP1.
  - [ ] Validar modelo con equipo contable y desarrollo.
- [ ] Diseño de arquitectura de servicios esencial
  - [ ] Seleccionar patrón arquitectónico base.
  - [ ] Definir endpoints RESTful CRUD y seguridad básica.
  - [ ] Especificar flujos de autenticación y control de acceso mínimo.
- [ ] Elaboración de diagramas mínimos
  - [ ] Diagrama ERD y flujo de operaciones principales.

## 2. Configuración de Proyecto y Entorno
- [ ] Creación del repositorio y estructura base mínima
  - [ ] Inicializar repositorio Git y ramas principales.
  - [ ] Estructurar carpetas para API, dominio y tests básicos.
- [ ] Configuración de entorno de desarrollo esencial
  - [ ] Instalar dependencias base (framework, ORM, linters).
  - [ ] Configurar CI/CD simple (build, test).
- [ ] Variables de entorno y base de datos mínima
  - [ ] Definir variables esenciales (conexión DB, JWT).
  - [ ] Crear scripts de migración inicial.

## 3. Implementación del Modelo de Datos
- [ ] Migraciones y tablas mínimas
  - [ ] Crear tabla CuentaContable y relaciones jerárquicas básicas.
  - [ ] Definir índices esenciales para consultas CRUD.
  - [ ] Validar integridad referencial mínima.
- [ ] Seed inicial
  - [ ] Importar catálogo base del PCGE.

## 4. Desarrollo de Endpoints RESTful
- [ ] Endpoints CRUD esenciales
  - [ ] GET árbol y detalle de cuentas.
  - [ ] POST, PUT, DELETE de cuentas personalizadas (con validaciones mínimas).
- [ ] Documentación OpenAPI/Swagger básica
  - [ ] Documentar endpoints CRUD y ejemplos básicos.

## 5. Seguridad y Control de Acceso
- [ ] Seguridad básica
  - [ ] Autenticación JWT y roles mínimos (admin, usuario).
  - [ ] Validar permisos en endpoints CRUD.
  - [ ] Registrar logs de cambios básicos.

## 6. Validaciones y Reglas de Negocio
- [ ] Validaciones mínimas
  - [ ] Unicidad de código y nombre.
  - [ ] Validar jerarquía básica (sin ciclos).
  - [ ] Bloquear eliminación de cuentas con movimientos.

## 7. Integración y Consumo por Otros Módulos
- [ ] Integración mínima
  - [ ] Documentar endpoints CRUD para consumo básico.

## 8. Testing y Calidad
- [ ] Testing esencial
  - [ ] Pruebas unitarias de lógica y validaciones básicas.
  - [ ] Pruebas de integración CRUD.

## 9. Mantenimiento, Auditoría y Exportación
- [ ] Mantenimiento y auditoría básica
  - [ ] Logs de cambios y operaciones CRUD.

## 10. Documentación y Capacitación
- [ ] Documentación mínima
  - [ ] Manual técnico básico y guía de uso CRUD.

---

> Cada tarea debe tener responsable, fecha y criterio de aceptación en el sistema de gestión elegido.
