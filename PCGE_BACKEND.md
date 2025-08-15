# Documentación Técnica: Gestión del PCGE en el Backend

## 1. Objetivo

Centralizar, versionar y exponer el Plan Contable General Empresarial (PCGE) para su uso seguro, consistente y auditable en todos los procesos contables del sistema, cumpliendo la normativa peruana y facilitando la personalización por empresa.

---

## 2. Modelo de Datos

### 2.1. Entidad principal: CuentaContable

| Campo            | Tipo      | Descripción                                                                             |
| ---------------- | --------- | --------------------------------------------------------------------------------------- |
| id               | UUID      | Identificador único                                                                     |
| codigo           | string    | Código PCGE (ej: 10, 101, 1011, 60, 601, etc.)                                          |
| nombre           | string    | Nombre de la cuenta (ej: "Caja", "Compras", "Cuentas por pagar")                        |
| descripcion      | string    | Descripción y dinámica contable (opcional, para ayuda contextual)                       |
| nivel            | int       | Nivel jerárquico (1=elemento, 2=cuenta, 3=subcuenta, 4=divisionaria, 5=subdivisionaria) |
| padre_id         | UUID/null | Referencia a la cuenta padre (para jerarquía)                                           |
| tipo             | enum      | ACTIVO, PASIVO, PATRIMONIO, GASTO, INGRESO, ORDEN, etc.                                 |
| es_personalizada | boolean   | Indica si la cuenta fue agregada por el usuario/empresa                                 |
| empresa_id       | UUID/null | Si es personalizada, referencia a la empresa propietaria                                |
| vigente_desde    | date      | Fecha de vigencia (para versionado)                                                     |
| vigente_hasta    | date/null | Fecha de fin de vigencia (para versionado)                                              |
| creado_por       | UUID      | Usuario que creó la cuenta                                                              |
| creado_en        | datetime  | Fecha de creación                                                                       |
| actualizado_en   | datetime  | Fecha de última actualización                                                           |

### 2.2. Relación jerárquica

- Cada cuenta puede tener subcuentas (relación padre-hijo).
- Permite construir el árbol completo del PCGE y personalizaciones.

---

## 3. Endpoints RESTful

### 3.1. Consulta

- `GET /api/plan-contable`
  - Lista el árbol completo del PCGE (opcional: filtrado por empresa, nivel, tipo).
- `GET /api/plan-contable/{id}`
  - Detalle de una cuenta específica.
- `GET /api/plan-contable/buscar?codigo=60`
  - Búsqueda por código o nombre.

### 3.2. Gestión (según permisos)

- `POST /api/plan-contable`
  - Crear cuenta personalizada (solo para usuarios autorizados).
- `PUT /api/plan-contable/{id}`
  - Editar cuenta personalizada.
- `DELETE /api/plan-contable/{id}`
  - Eliminar cuenta personalizada (solo si no tiene movimientos asociados).

### 3.3. Versionado y auditoría

- `GET /api/plan-contable/historial/{id}`
  - Ver historial de cambios de una cuenta.
- `GET /api/plan-contable/versiones`
  - Listar versiones del PCGE (útil para cambios normativos).

---

## 4. Reglas de Negocio

- El PCGE base (oficial) no puede ser editado ni eliminado por usuarios comunes.
- Las cuentas personalizadas deben mantener la estructura y codificación del PCGE.
- No se pueden eliminar cuentas con asientos/movimientos asociados.
- El sistema debe validar que los asientos contables solo usen cuentas vigentes y permitidas.
- Cambios en el PCGE deben ser auditados (quién, cuándo, qué cambió).

---

## 5. Seguridad y Acceso

- Solo usuarios con rol "Administrador Contable" pueden modificar el plan contable.
- El acceso a la consulta es público para usuarios autenticados.
- Todas las operaciones de modificación deben quedar registradas en logs de auditoría.

---

## 6. Ejemplo de Estructura de Respuesta (GET /api/plan-contable)

```json
[
  {
    "id": "uuid-10",
    "codigo": "10",
    "nombre": "Efectivo y equivalentes de efectivo",
    "nivel": 2,
    "tipo": "ACTIVO",
    "hijos": [
      {
        "id": "uuid-101",
        "codigo": "101",
        "nombre": "Caja",
        "nivel": 3,
        "tipo": "ACTIVO",
        "hijos": []
      },
      {
        "id": "uuid-102",
        "codigo": "102",
        "nombre": "Fondos fijos",
        "nivel": 3,
        "tipo": "ACTIVO",
        "hijos": []
      }
    ]
  },
  {
    "id": "uuid-60",
    "codigo": "60",
    "nombre": "Compras",
    "nivel": 2,
    "tipo": "GASTO",
    "hijos": [
      {
        "id": "uuid-601",
        "codigo": "601",
        "nombre": "Compras nacionales",
        "nivel": 3,
        "tipo": "GASTO",
        "hijos": []
      }
    ]
  }
]
```

---

## 7. Integración con otros módulos

- El registro de comprobantes/asientos debe consumir el plan contable desde el backend para poblar selects y validar cuentas.
- Los reportes y libros contables deben usar la jerarquía y codificación del PCGE para agrupaciones y presentaciones.

---

## 8. Consideraciones de Mantenibilidad y Escalabilidad

- El modelo permite importar nuevas versiones del PCGE (por cambios SUNAT/NIIF).
- Permite personalización por empresa sin perder la trazabilidad del PCGE oficial.
- Soporta auditoría y versionado para cumplir con requisitos legales y de control interno.

---

## 9. Seguridad y Cumplimiento

- El backend debe validar que solo usuarios autorizados puedan modificar el plan contable.
- Todas las operaciones deben ser auditables.
- El sistema debe estar preparado para exportar el plan contable en formatos requeridos por SUNAT (ej. TXT, Excel).

---

¿Deseas que genere el modelo de base de datos (ejemplo en SQL o Entity Framework), los endpoints en .NET o Node.js, o la documentación OpenAPI/Swagger para estos endpoints?

---

## 10. Tareas y Subtareas para la Implementación del Módulo PCGE Backend

### Roadmap de MVPs

#### MVP 1: Núcleo funcional mínimo y seguro
- Gestión y consulta del plan contable (PCGE) base y personalizado.
- CRUD de cuentas contables (con jerarquía, validaciones y restricciones básicas).
- Endpoints RESTful para consulta y gestión.
- Seguridad básica (autenticación, roles, logs de auditoría).
- Validaciones críticas de negocio (unicidad, jerarquía, no eliminar cuentas con movimientos).
- Documentación OpenAPI/Swagger inicial.
- Pruebas unitarias y de integración básicas.

#### MVP 2: Funcionalidad avanzada, integración y automatización
- Versionado completo del PCGE y consulta de historial de cambios.
- Exportación/importación en formatos SUNAT (TXT, Excel).
- Integración con otros módulos (asientos, comprobantes, reportes).
- Pruebas de carga, rendimiento y seguridad avanzadas.
- Monitoreo, alertas y herramientas de mantenimiento.
- Documentación y capacitación avanzada.

---

### 10.1. Análisis y Diseño

#### MVP 1
- [ ] **Levantamiento de requerimientos esenciales**
  - [ ] Reunión con stakeholders para identificar necesidades mínimas y normativas básicas.
  - [ ] Documentar casos de uso principales (gestión y consulta de cuentas).
  - [ ] Validar requerimientos mínimos con usuarios clave.
- [ ] **Definición y validación del modelo de datos mínimo**
  - [ ] Modelar entidad CuentaContable y relaciones jerárquicas básicas.
  - [ ] Definir atributos obligatorios para MVP1.
  - [ ] Validar modelo con equipo contable y desarrollo.
- [ ] **Diseño de arquitectura de servicios esencial**
  - [ ] Seleccionar patrón arquitectónico base.
  - [ ] Definir endpoints RESTful CRUD y seguridad básica.
  - [ ] Especificar flujos de autenticación y control de acceso mínimo.
- [ ] **Elaboración de diagramas mínimos**
  - [ ] Diagrama ERD y flujo de operaciones principales.

#### MVP 2
- [ ] **Levantamiento de requerimientos avanzados**
  - [ ] Identificar necesidades de versionado, exportación/importación y auditoría avanzada.
  - [ ] Documentar escenarios de integración y automatización.
- [ ] **Modelo de datos extendido**
  - [ ] Añadir atributos para versionado, historial y personalización avanzada.
  - [ ] Validar modelo extendido con stakeholders.
- [ ] **Arquitectura de servicios avanzada**
  - [ ] Definir endpoints de versionado, historial, exportación/importación y monitoreo.
  - [ ] Especificar flujos de integración con otros módulos.
- [ ] **Diagramas avanzados**
  - [ ] Diagramas de integración, despliegue y dependencias externas.

### 10.2. Configuración de Proyecto y Entorno

#### MVP 1
- [ ] **Creación del repositorio y estructura base mínima**
  - [ ] Inicializar repositorio Git y ramas principales.
  - [ ] Estructurar carpetas para API, dominio y tests básicos.
- [ ] **Configuración de entorno de desarrollo esencial**
  - [ ] Instalar dependencias base (framework, ORM, linters).
  - [ ] Configurar CI/CD simple (build, test).
- [ ] **Variables de entorno y base de datos mínima**
  - [ ] Definir variables esenciales (conexión DB, JWT).
  - [ ] Crear scripts de migración inicial.

#### MVP 2
- [ ] **Estructura avanzada y automatización**
  - [ ] Estructurar carpetas para infraestructura, docs, monitoreo.
  - [ ] Configurar CI/CD avanzado (deploy, integración continua, Docker).
- [ ] **Variables y scripts avanzados**
  - [ ] Añadir variables para exportación, integración y monitoreo.
  - [ ] Scripts de backup y restauración automatizados.

### 10.3. Implementación del Modelo de Datos

#### MVP 1
- [ ] **Migraciones y tablas mínimas**
  - [ ] Crear tabla CuentaContable y relaciones jerárquicas básicas.
  - [ ] Definir índices esenciales para consultas CRUD.
  - [ ] Validar integridad referencial mínima.
- [ ] **Seed inicial**
  - [ ] Importar catálogo base del PCGE.

#### MVP 2
- [ ] **Migraciones y tablas avanzadas**
  - [ ] Añadir tablas de auditoría, historial y personalización avanzada.
  - [ ] Definir índices para consultas jerárquicas complejas y búsquedas masivas.
- [ ] **Seed y migración avanzada**
  - [ ] Automatizar importación/exportación y logs detallados.

### 10.4. Desarrollo de Endpoints RESTful

#### MVP 1
- [ ] **Endpoints CRUD esenciales**
  - [ ] GET árbol y detalle de cuentas.
  - [ ] POST, PUT, DELETE de cuentas personalizadas (con validaciones mínimas).
- [ ] **Documentación OpenAPI/Swagger básica**
  - [ ] Documentar endpoints CRUD y ejemplos básicos.

#### MVP 2
- [ ] **Endpoints avanzados**
  - [ ] GET historial de cambios y versiones del PCGE.
  - [ ] Endpoints de exportación/importación y monitoreo.
- [ ] **Documentación avanzada**
  - [ ] Documentar escenarios de integración, errores y automatización.

### 10.5. Seguridad y Control de Acceso

#### MVP 1
- [ ] **Seguridad básica**
  - [ ] Autenticación JWT y roles mínimos (admin, usuario).
  - [ ] Validar permisos en endpoints CRUD.
  - [ ] Registrar logs de cambios básicos.

#### MVP 2
- [ ] **Seguridad avanzada**
  - [ ] OAuth2, granularidad de permisos, protección avanzada.
  - [ ] Auditoría completa y exportación de logs.
  - [ ] Alertas de intentos fallidos y monitoreo de seguridad.

### 10.6. Validaciones y Reglas de Negocio

#### MVP 1
- [ ] **Validaciones mínimas**
  - [ ] Unicidad de código y nombre.
  - [ ] Validar jerarquía básica (sin ciclos).
  - [ ] Bloquear eliminación de cuentas con movimientos.

#### MVP 2
- [ ] **Validaciones avanzadas**
  - [ ] Vigencia, versionado y consulta histórica.
  - [ ] Personalización avanzada y trazabilidad completa.

### 10.7. Integración y Consumo por Otros Módulos

#### MVP 1
- [ ] **Integración mínima**
  - [ ] Documentar endpoints CRUD para consumo básico.

#### MVP 2
- [ ] **Integración avanzada**
  - [ ] Contratos de integración, versionado de API y pruebas de integración completas.
  - [ ] Simulación de consumo desde otros módulos y documentación avanzada.

### 10.8. Testing y Calidad

#### MVP 1
- [ ] **Testing esencial**
  - [ ] Pruebas unitarias de lógica y validaciones básicas.
  - [ ] Pruebas de integración CRUD.

#### MVP 2
- [ ] **Testing avanzado**
  - [ ] Pruebas de carga, rendimiento y seguridad.
  - [ ] Mocking/stubbing avanzado y pruebas de integración con otros módulos.

### 10.9. Mantenimiento, Auditoría y Exportación

#### MVP 1
- [ ] **Mantenimiento y auditoría básica**
  - [ ] Logs de cambios y operaciones CRUD.

#### MVP 2
- [ ] **Exportación, importación y monitoreo avanzado**
  - [ ] Endpoints de exportación/importación (TXT, Excel, SUNAT).
  - [ ] Migración de versiones y datos personalizados.
  - [ ] Monitoreo, métricas y alertas proactivas.

### 10.10. Documentación y Capacitación

#### MVP 1
- [ ] **Documentación mínima**
  - [ ] Manual técnico básico y guía de uso CRUD.

#### MVP 2
- [ ] **Documentación y capacitación avanzada**
  - [ ] Manuales completos, integración, flujos avanzados y material de capacitación.

---

> **Nota:** Cada tarea y subtarea debe ser gestionada en un sistema de seguimiento (Jira, Azure DevOps, Trello, etc.) con responsables, fechas y criterios de aceptación claros. Se recomienda aplicar metodologías ágiles (Scrum/Kanban) para iterar y validar entregables de forma continua.
