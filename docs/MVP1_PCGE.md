# MVP1 - Plan Contable General Empresarial (PCGE)

## 🎯 Objetivo del MVP1

Implementar las funcionalidades básicas del sistema PCGE que permitan consultar y gestionar el catálogo de cuentas contables según el Plan Contable General Empresarial Modificado 2019 del Perú.

## 📋 Funcionalidades Principales

### 1. Gestión de Cuentas PCGE

- ✅ **Consulta de catálogo completo**: Listar todas las cuentas del PCGE
- ✅ **Búsqueda por código**: Obtener cuenta específica por su código
- ✅ **Filtrado por elemento**: Consultar cuentas por elemento (1-9, 0)
- ✅ **Jerarquía de cuentas**: Obtener estructura jerárquica padre-hijo
- ✅ **Validación de códigos**: Verificar códigos válidos según PCGE

### 2. Elementos del PCGE

- ✅ **Listado de elementos**: Los 10 elementos principales del PCGE
- ✅ **Descripción de elementos**: Información detallada de cada elemento
- ✅ **Cuentas por elemento**: Agrupación de cuentas por elemento

### 3. API REST Básica

- ✅ **Endpoints CRUD**: Operaciones básicas de consulta
- ✅ **Documentación Swagger**: API autodocumentada
- ✅ **Validaciones**: Reglas de negocio básicas
- ✅ **Respuestas estructuradas**: JSON estandarizado

## 🏗️ Arquitectura MVP1

### Backend (.NET 9)

```
src/
├── PlanContable.Domain/
│   ├── Entities/
│   │   ├── CuentaPcge.cs          # Entidad principal
│   │   └── ElementoPcge.cs        # Elementos del PCGE
│   ├── ValueObjects/
│   │   └── CodigoCuenta.cs        # Objeto valor para códigos
│   └── Interfaces/
│       └── ICuentaRepository.cs   # Contrato del repositorio
│
├── PlanContable.Infrastructure/
│   ├── Data/
│   │   ├── PcgeDbContext.cs       # Contexto EF Core
│   │   └── Configurations/        # Configuraciones de entidades
│   └── Repositories/
│       └── CuentaRepository.cs    # Implementación del repositorio
│
├── PlanContable.Application/
│   ├── Services/
│   │   └── CuentaService.cs       # Lógica de negocio
│   └── DTOs/
│       ├── CuentaDto.cs           # DTO de cuenta
│       └── ElementoDto.cs         # DTO de elemento
│
└── PlanContable.Api/
    ├── Controllers/
    │   ├── CuentasController.cs   # Controlador de cuentas
    │   └── ElementosController.cs # Controlador de elementos
    └── Program.cs                 # Configuración de la API
```

### Base de Datos (PostgreSQL)

```sql
-- Tabla principal de cuentas
CREATE TABLE cuentas_pcge (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(5) NOT NULL UNIQUE,
    nombre VARCHAR(500) NOT NULL,
    nivel INTEGER NOT NULL,
    padre VARCHAR(4),
    elemento INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Tabla de elementos
CREATE TABLE elementos_pcge (
    numero INTEGER PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo_balance VARCHAR(50) NOT NULL
);

-- Índices para optimización
CREATE INDEX idx_cuentas_codigo ON cuentas_pcge(codigo);
CREATE INDEX idx_cuentas_elemento ON cuentas_pcge(elemento);
CREATE INDEX idx_cuentas_padre ON cuentas_pcge(padre);
CREATE INDEX idx_cuentas_nivel ON cuentas_pcge(nivel);
```

## 🌐 API Endpoints MVP1

### Cuentas PCGE

#### 1. Listar todas las cuentas

```http
GET /api/v1/cuentas
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "codigo": "10",
      "nombre": "EFECTIVO Y EQUIVALENTES DE EFECTIVO",
      "nivel": 2,
      "padre": null,
      "elemento": 1,
      "tipo": "ACTIVO_DISPONIBLE_EXIGIBLE",
      "activa": true
    }
  ],
  "total": 4447,
  "page": 1,
  "pageSize": 50
}
```

#### 2. Obtener cuenta por código

```http
GET /api/v1/cuentas/{codigo}
```

**Ejemplo:** `GET /api/v1/cuentas/101`
**Respuesta:**

```json
{
  "success": true,
  "data": {
    "codigo": "101",
    "nombre": "Caja",
    "nivel": 3,
    "padre": "10",
    "elemento": 1,
    "tipo": "ACTIVO_DISPONIBLE_EXIGIBLE",
    "activa": true,
    "hijos": ["1011"]
  }
}
```

#### 3. Cuentas por elemento

```http
GET /api/v1/cuentas/elemento/{numero}
```

**Ejemplo:** `GET /api/v1/cuentas/elemento/1`

#### 4. Jerarquía de cuenta

```http
GET /api/v1/cuentas/{codigo}/jerarquia
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "cuenta": {
      "codigo": "1011",
      "nombre": "Caja en soles"
    },
    "jerarquia": [
      { "codigo": "1", "nombre": "ACTIVO" },
      { "codigo": "10", "nombre": "EFECTIVO Y EQUIVALENTES" },
      { "codigo": "101", "nombre": "Caja" },
      { "codigo": "1011", "nombre": "Caja en soles" }
    ]
  }
}
```

### Elementos PCGE

#### 1. Listar elementos

```http
GET /api/v1/elementos
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "numero": 1,
      "nombre": "ACTIVO DISPONIBLE Y EXIGIBLE",
      "descripcion": "Comprende los elementos...",
      "tipoBalance": "ACTIVO"
    }
  ]
}
```

#### 2. Elemento específico

```http
GET /api/v1/elementos/{numero}
```

## 🔧 Configuración y Despliegue MVP1

### 1. Variables de Entorno

```env
# Base de datos
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=pcge_db
POSTGRES_USER=pcge_user
POSTGRES_PASSWORD=pcge_password

# API
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=https://localhost:7001;http://localhost:5001

# Logging
SERILOG_MINIMUM_LEVEL=Information
```

### 2. Docker Compose

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: pcge_db
      POSTGRES_USER: pcge_user
      POSTGRES_PASSWORD: pcge_password
    ports:
      - "5433:5432"
    volumes:
      - pcge_data:/var/lib/postgresql/data

  api:
    build: .
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=pcge_db;Username=pcge_user;Password=pcge_password
    ports:
      - "7001:80"
    depends_on:
      - postgres

volumes:
  pcge_data:
```

## 📊 Datos de Prueba MVP1

### Elementos Principales

1. **Elemento 1**: ACTIVO DISPONIBLE Y EXIGIBLE
2. **Elemento 2**: ACTIVO REALIZABLE
3. **Elemento 3**: ACTIVO INMOVILIZADO
4. **Elemento 4**: PASIVO
5. **Elemento 5**: PATRIMONIO
6. **Elemento 6**: GASTOS POR NATURALEZA
7. **Elemento 7**: INGRESOS
8. **Elemento 8**: SALDOS INTERMEDIARIOS
9. **Elemento 9**: CONTABILIDAD ANALÍTICA
10. **Elemento 0**: CUENTAS DE ORDEN

- **10**: EFECTIVO Y EQUIVALENTES DE EFECTIVO
- **101**: Caja
- **1011**: Caja en soles
- **102**: Fondos fijos
- **11**: INVERSIONES FINANCIERAS
- **12**: CUENTAS POR COBRAR COMERCIALES – TERCEROS

## ✅ Criterios de Aceptación MVP1

### Funcionales

- [ ] El sistema debe cargar el catálogo completo del PCGE (4,447+ cuentas)
- [ ] Debe permitir consultar cualquier cuenta por su código
- [ ] Debe mostrar la jerarquía correcta de cuentas
- [ ] Debe filtrar cuentas por elemento (1-9, 0)
- [ ] Debe validar códigos de cuenta según reglas PCGE

### No Funcionales

- [ ] API debe responder en menos de 500ms para consultas básicas
- [ ] Base de datos debe soportar consultas concurrentes
- [ ] Documentación Swagger completa y funcional
- [ ] Logs estructurados para monitoreo
- [ ] Manejo de errores estandarizado

### Técnicos

- [ ] Clean Architecture implementada correctamente
- [ ] Entity Framework con migraciones funcionales
- [ ] PostgreSQL con índices optimizados
- [ ] Docker Compose para desarrollo local
- [ ] Pruebas unitarias básicas (cobertura > 70%)

## 🚀 Plan de Desarrollo MVP1

### Fase 1 (Semana 1)

- [x] Configuración inicial del proyecto
- [x] Estructura Clean Architecture
- [x] Entidades y ValueObjects básicos
- [x] Configuración de PostgreSQL

### Fase 2 (Semana 2)

- [x] Implementación de repositorios
- [x] Servicios de aplicación básicos
- [x] Controladores de API
- [x] Documentación Swagger

### Fase 3 (Semana 3)

- [x] Importación de datos PCGE
- [x] Pruebas unitarias básicas
- [x] Optimización de consultas
- [x] Docker containerización

### Fase 4 (Semana 4)

- [ ] Pruebas de integración
- [ ] Documentación completa
- [ ] Despliegue en ambiente de desarrollo
- [ ] Validación con usuarios

## 📝 Notas de Implementación

### Decisiones Técnicas

- **PostgreSQL** elegido por su soporte robusto para datos jerárquicos
- **Clean Architecture** para mantenibilidad a largo plazo
- **Entity Framework Core** para productividad en desarrollo
- **Swagger** para documentación automática de API

### Limitaciones MVP1

- Solo operaciones de lectura (consulta)
- Sin autenticación/autorización
- Sin auditoría de cambios
- Sin cache distribuido
- Sin validaciones complejas de negocio

### Próximos Pasos (MVP2)

- Implementar operaciones CRUD completas
- Agregar sistema de autenticación
- Implementar cache y optimizaciones
- Agregar reportes y exportaciones
- Desarrollar frontend web
