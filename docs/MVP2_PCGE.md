# MVP2 - Plan Contable General Empresarial (PCGE) - Funcionalidades Avanzadas

## 🎯 Objetivo del MVP2

Expandir el sistema PCGE con funcionalidades avanzadas incluyendo operaciones CRUD completas, autenticación, reportes, cache, y una interfaz web para la gestión completa del Plan Contable General Empresarial.

## 📋 Nuevas Funcionalidades MVP2

### 1. Operaciones CRUD Completas

- ✅ **Crear cuentas personalizadas**: Extensión del catálogo oficial
- ✅ **Actualizar cuentas**: Modificación de nombres y propiedades
- ✅ **Desactivar cuentas**: Soft delete con preservación histórica
- ✅ **Versionado**: Control de cambios y rollback
- ✅ **Validaciones avanzadas**: Reglas de negocio complejas

### 2. Sistema de Autenticación y Autorización

- ✅ **JWT Authentication**: Tokens seguros para API
- ✅ **Role-Based Access Control**: Roles de usuario diferenciados
- ✅ **Permisos granulares**: Control de acceso por endpoint
- ✅ **Auditoría de usuarios**: Log de todas las operaciones
- ✅ **Refresh tokens**: Sesiones seguras y renovables

### 3. Cache y Optimización

- ✅ **Redis Cache**: Cache distribuido para consultas frecuentes
- ✅ **Cache inteligente**: Invalidación automática por cambios
- ✅ **Compresión de respuestas**: Optimización de bandwidth
- ✅ **Paginación avanzada**: Cursor-based pagination
- ✅ **Rate limiting**: Protección contra abuso de API

### 4. Reportes y Exportaciones

- ✅ **Reportes PDF**: Catálogo completo y parcial
- ✅ **Exportación Excel**: Datos tabulares con formato
- ✅ **Exportación CSV**: Formato estándar para importación
- ✅ **Reportes personalizados**: Filtros avanzados
- ✅ **Templates de reportes**: Formatos predefinidos

### 5. Frontend Web (React/TypeScript)

- ✅ **Dashboard administrativo**: Panel de control principal
- ✅ **Explorador de cuentas**: Navegación jerárquica interactiva
- ✅ **Editor de cuentas**: CRUD visual intuitivo
- ✅ **Buscador avanzado**: Filtros múltiples y sugerencias
- ✅ **Gestión de usuarios**: Admin panel para usuarios y roles

### 6. Integraciones y APIs Externas

- ✅ **API de validación SUNAT**: Validación oficial de códigos
- ✅ **Webhooks**: Notificaciones de cambios en tiempo real
- ✅ **Import/Export**: Integración con sistemas contables
- ✅ **API Gateway**: Centralización y seguridad de APIs
- ✅ **Monitoreo**: Health checks y métricas

## 🏗️ Arquitectura Expandida MVP2

### Backend Microservicios (.NET 9)

```
services/
├── plan-contable/                  # Servicio principal PCGE
│   ├── src/
│   │   ├── PlanContable.Domain/
│   │   │   ├── Entities/
│   │   │   │   ├── CuentaPcge.cs
│   │   │   │   ├── ElementoPcge.cs
│   │   │   │   ├── Usuario.cs          # Nueva entidad
│   │   │   │   ├── Rol.cs              # Nueva entidad
│   │   │   │   └── AuditoriaLog.cs     # Nueva entidad
│   │   │   ├── ValueObjects/
│   │   │   │   ├── CodigoCuenta.cs
│   │   │   │   └── Permiso.cs          # Nuevo VO
│   │   │   ├── Services/
│   │   │   │   ├── IValidacionService.cs
│   │   │   │   └── ICacheService.cs
│   │   │   └── Events/
│   │   │       ├── CuentaCreadaEvent.cs
│   │   │       └── CuentaModificadaEvent.cs
│   │   │
│   │   ├── PlanContable.Infrastructure/
│   │   │   ├── Data/
│   │   │   │   ├── PcgeDbContext.cs
│   │   │   │   └── Configurations/
│   │   │   ├── Repositories/
│   │   │   │   ├── CuentaRepository.cs
│   │   │   │   ├── UsuarioRepository.cs
│   │   │   │   └── AuditoriaRepository.cs
│   │   │   ├── Cache/
│   │   │   │   ├── RedisCacheService.cs
│   │   │   │   └── CacheKeys.cs
│   │   │   ├── External/
│   │   │   │   └── SunatApiService.cs
│   │   │   └── Reports/
│   │   │       ├── PdfReportService.cs
│   │   │       └── ExcelReportService.cs
│   │   │
│   │   ├── PlanContable.Application/
│   │   │   ├── Commands/
│   │   │   │   ├── CrearCuentaCommand.cs
│   │   │   │   ├── ActualizarCuentaCommand.cs
│   │   │   │   └── DesactivarCuentaCommand.cs
│   │   │   ├── Queries/
│   │   │   │   ├── ObtenerCuentaQuery.cs
│   │   │   │   └── ListarCuentasQuery.cs
│   │   │   ├── Handlers/
│   │   │   │   ├── CrearCuentaHandler.cs
│   │   │   │   └── ObtenerCuentaHandler.cs
│   │   │   ├── Services/
│   │   │   │   ├── CuentaService.cs
│   │   │   │   ├── ReporteService.cs
│   │   │   │   └── ExportacionService.cs
│   │   │   └── DTOs/
│   │   │       ├── CuentaDto.cs
│   │   │       ├── UsuarioDto.cs
│   │   │       └── ReporteDto.cs
│   │   │
│   │   └── PlanContable.Api/
│   │       ├── Controllers/
│   │       │   ├── CuentasController.cs
│   │       │   ├── ElementosController.cs
│   │       │   ├── UsuariosController.cs    # Nuevo
│   │       │   ├── ReportesController.cs    # Nuevo
│   │       │   └── ExportacionController.cs # Nuevo
│   │       ├── Middleware/
│   │       │   ├── AuthenticationMiddleware.cs
│   │       │   ├── RateLimitingMiddleware.cs
│   │       │   └── AuditingMiddleware.cs
│   │       ├── Filters/
│   │       │   ├── AuthorizeAttribute.cs
│   │       │   └── ValidateModelAttribute.cs
│   │       └── Program.cs
│
├── auth-service/                   # Servicio de autenticación
│   ├── src/
│   │   ├── Auth.Domain/
│   │   ├── Auth.Infrastructure/
│   │   ├── Auth.Application/
│   │   └── Auth.Api/
│   └── README.md
│
├── notification-service/           # Nuevo servicio
│   ├── src/
│   │   └── Notification.Api/
│   └── README.md
│
└── api-gateway/                    # Nuevo servicio
    ├── src/
    │   └── Gateway.Api/
    └── README.md
```

### Frontend (React/TypeScript)

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout/
│   │   │   ├── Navigation/
│   │   │   └── Forms/
│   │   ├── cuentas/
│   │   │   ├── CuentasList.tsx
│   │   │   ├── CuentaForm.tsx
│   │   │   ├── CuentaTree.tsx
│   │   │   └── CuentaSearch.tsx
│   │   ├── reportes/
│   │   │   ├── ReporteBuilder.tsx
│   │   │   └── ReporteViewer.tsx
│   │   └── admin/
│   │       ├── UserManagement.tsx
│   │       └── Dashboard.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Cuentas.tsx
│   │   ├── Reportes.tsx
│   │   ├── Usuarios.tsx
│   │   └── Login.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── cache.ts
│   ├── hooks/
│   │   ├── useCuentas.ts
│   │   ├── useAuth.ts
│   │   └── useCache.ts
│   ├── store/
│   │   ├── authSlice.ts
│   │   ├── cuentasSlice.ts
│   │   └── store.ts
│   └── utils/
│       ├── validators.ts
│       └── formatters.ts
├── package.json
└── vite.config.ts
```

## 🌐 API Endpoints Expandidos MVP2

### Autenticación y Usuarios

#### 1. Autenticación

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "password": "password123"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "email": "admin@empresa.com",
      "nombre": "Administrador",
      "roles": ["Admin", "Contador"]
    }
  }
}
```

#### 2. Renovar token

```http
POST /api/v1/auth/refresh
Authorization: Bearer {refreshToken}
```

#### 3. Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
```

### Gestión de Usuarios

#### 1. Crear usuario

```http
POST /api/v1/usuarios
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "contador@empresa.com",
  "nombre": "Juan Pérez",
  "roles": ["Contador"],
  "permisos": ["cuentas:read", "cuentas:write"]
}
```

#### 2. Listar usuarios

```http
GET /api/v1/usuarios
Authorization: Bearer {accessToken}
```

#### 3. Actualizar usuario

```http
PUT /api/v1/usuarios/{id}
Authorization: Bearer {accessToken}
```

### Operaciones CRUD de Cuentas

#### 1. Crear cuenta personalizada

```http
POST /api/v1/cuentas
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "codigo": "1015",
  "nombre": "Caja chica sucursal Lima",
  "padre": "101",
  "descripcion": "Caja chica para gastos menores",
  "activa": true
}
```

#### 2. Actualizar cuenta

```http
PUT /api/v1/cuentas/{codigo}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "nombre": "Caja chica sucursal Lima Norte",
  "descripcion": "Caja chica actualizada"
}
```

#### 3. Desactivar cuenta

```http
DELETE /api/v1/cuentas/{codigo}
Authorization: Bearer {accessToken}
```

#### 4. Historial de cuenta

```http
GET /api/v1/cuentas/{codigo}/historial
Authorization: Bearer {accessToken}
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "version": 2,
      "fecha": "2025-08-15T10:30:00Z",
      "usuario": "admin@empresa.com",
      "accion": "ACTUALIZAR",
      "cambios": {
        "nombre": {
          "anterior": "Caja chica sucursal",
          "nuevo": "Caja chica sucursal Lima"
        }
      }
    }
  ]
}
```

### Reportes y Exportaciones

#### 1. Generar reporte PDF

```http
POST /api/v1/reportes/pdf
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tipo": "catalogo_completo",
  "filtros": {
    "elemento": 1,
    "nivel": [2, 3],
    "activas": true
  },
  "formato": "A4",
  "incluirJerarquia": true
}
```

#### 2. Exportar a Excel

```http
GET /api/v1/exportacion/excel?elemento=1&nivel=2,3
Authorization: Bearer {accessToken}
Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

#### 3. Exportar a CSV

```http
GET /api/v1/exportacion/csv?elemento=all
Authorization: Bearer {accessToken}
Accept: text/csv
```

#### 4. Estado de reporte asíncrono

```http
GET /api/v1/reportes/{reporteId}/estado
Authorization: Bearer {accessToken}
```

### Búsqueda Avanzada

#### 1. Búsqueda con filtros múltiples

```http
GET /api/v1/cuentas/buscar
Authorization: Bearer {accessToken}
Query Parameters:
- q=efectivo                    # Texto de búsqueda
- elemento=1,2,3               # Elementos específicos
- nivel=2,3                    # Niveles específicos
- activa=true                  # Solo cuentas activas
- padre=10                     # Cuentas hijas de
- limit=20                     # Límite de resultados
- offset=0                     # Paginación
- sort=codigo                  # Ordenamiento
- order=asc                    # Dirección de orden
```

#### 2. Sugerencias de búsqueda

```http
GET /api/v1/cuentas/sugerencias?q=efe
Authorization: Bearer {accessToken}
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "codigo": "10",
      "nombre": "EFECTIVO Y EQUIVALENTES DE EFECTIVO",
      "relevancia": 0.95
    },
    {
      "codigo": "101",
      "nombre": "Caja",
      "relevancia": 0.8
    }
  ]
}
```

### Cache y Performance

#### 1. Limpiar cache

```http
DELETE /api/v1/cache
Authorization: Bearer {accessToken}
```

#### 2. Estado del cache

```http
GET /api/v1/cache/estado
Authorization: Bearer {accessToken}
```

#### 3. Métricas de performance

```http
GET /api/v1/metricas
Authorization: Bearer {accessToken}
```

### Webhooks y Notificaciones

#### 1. Registrar webhook

```http
POST /api/v1/webhooks
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "url": "https://empresa.com/webhook/pcge",
  "eventos": ["cuenta.creada", "cuenta.actualizada"],
  "secreto": "webhook_secret_key"
}
```

#### 2. Listar webhooks

```http
GET /api/v1/webhooks
Authorization: Bearer {accessToken}
```

## 🗄️ Base de Datos Expandida MVP2

### Nuevas Tablas

```sql
-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Tabla de roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    permisos JSONB NOT NULL DEFAULT '[]'
);

-- Tabla de asignación usuario-rol
CREATE TABLE usuario_roles (
    usuario_id INTEGER REFERENCES usuarios(id),
    rol_id INTEGER REFERENCES roles(id),
    PRIMARY KEY (usuario_id, rol_id)
);

-- Tabla de auditoría
CREATE TABLE auditoria_logs (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    tabla VARCHAR(50) NOT NULL,
    registro_id VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_cliente INET,
    user_agent TEXT,
    fecha TIMESTAMP DEFAULT NOW()
);

-- Tabla de versiones de cuentas
CREATE TABLE cuentas_versiones (
    id SERIAL PRIMARY KEY,
    cuenta_codigo VARCHAR(5) NOT NULL,
    version INTEGER NOT NULL,
    nombre VARCHAR(500) NOT NULL,
    padre VARCHAR(4),
    activa BOOLEAN,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_version TIMESTAMP DEFAULT NOW(),
    motivo_cambio TEXT
);

-- Tabla de webhooks
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    eventos JSONB NOT NULL DEFAULT '[]',
    secreto VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla de tokens de refresh
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    usuario_id INTEGER REFERENCES usuarios(id),
    expira_en TIMESTAMP NOT NULL,
    revocado BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Índices adicionales para performance
CREATE INDEX idx_auditoria_usuario ON auditoria_logs(usuario_id);
CREATE INDEX idx_auditoria_tabla_registro ON auditoria_logs(tabla, registro_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_logs(fecha);
CREATE INDEX idx_versiones_cuenta ON cuentas_versiones(cuenta_codigo);
CREATE INDEX idx_versiones_version ON cuentas_versiones(version);
CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

## 🔧 Configuración Avanzada MVP2

### 1. Variables de Entorno Expandidas

```env
# Base de datos
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=pcge_db
POSTGRES_USER=pcge_user
POSTGRES_PASSWORD=pcge_password

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
REDIS_DB=0

# JWT
JWT_SECRET_KEY=super_secret_key_here
JWT_EXPIRATION_MINUTES=60
JWT_REFRESH_EXPIRATION_DAYS=30

# External APIs
SUNAT_API_URL=https://api.sunat.gob.pe
SUNAT_API_KEY=sunat_api_key

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST_SIZE=20

# Email Service
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=noreply@empresa.com
EMAIL_USERNAME=email_user
EMAIL_PASSWORD=email_password

# File Storage
STORAGE_TYPE=local # local, s3, azure
STORAGE_PATH=/app/storage
AWS_S3_BUCKET=pcge-storage
AWS_ACCESS_KEY=aws_key
AWS_SECRET_KEY=aws_secret

# Monitoring
SENTRY_DSN=https://sentry.io/dsn
ELASTIC_SEARCH_URL=http://localhost:9200
```

### 2. Docker Compose Expandido

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pcge_user -d pcge_db"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data

  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8080:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
    depends_on:
      - plan-contable-api
      - auth-api

  plan-contable-api:
    build: ./services/plan-contable
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=pcge_db;Username=pcge_user;Password=pcge_password
      - Redis__ConnectionString=localhost:6379,password=redis_password
    ports:
      - "7001:80"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  auth-api:
    build: ./services/auth-service
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=pcge_db;Username=pcge_user;Password=pcge_password
    ports:
      - "7002:80"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8080/api
    depends_on:
      - api-gateway

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elastic_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  pcge_data:
  redis_data:
  elastic_data:
```

## 📊 Roles y Permisos MVP2

### Roles Predefinidos

#### 1. Super Admin

```json
{
  "nombre": "SuperAdmin",
  "descripcion": "Acceso total al sistema",
  "permisos": [
    "sistema:*",
    "usuarios:*",
    "cuentas:*",
    "reportes:*",
    "configuracion:*"
  ]
}
```

#### 2. Administrador

```json
{
  "nombre": "Administrador",
  "descripcion": "Gestión de usuarios y cuentas",
  "permisos": ["usuarios:read", "usuarios:write", "cuentas:*", "reportes:*"]
}
```

#### 3. Contador

```json
{
  "nombre": "Contador",
  "descripcion": "Gestión de cuentas contables",
  "permisos": [
    "cuentas:read",
    "cuentas:write",
    "reportes:read",
    "reportes:export"
  ]
}
```

#### 4. Consultor

```json
{
  "nombre": "Consultor",
  "descripcion": "Solo lectura del catálogo",
  "permisos": ["cuentas:read", "reportes:read"]
}
```

### Permisos Granulares

- `cuentas:read` - Consultar cuentas
- `cuentas:write` - Crear/actualizar cuentas
- `cuentas:delete` - Desactivar cuentas
- `usuarios:read` - Ver usuarios
- `usuarios:write` - Gestionar usuarios
- `reportes:read` - Ver reportes
- `reportes:export` - Exportar datos
- `sistema:config` - Configuración del sistema
- `auditoria:read` - Ver logs de auditoría

## 🚀 Plan de Desarrollo MVP2

### Fase 1 - Backend Expandido (Semanas 5-6)

- [ ] Implementar sistema de autenticación JWT
- [ ] Crear controladores de usuarios y roles
- [ ] Implementar middleware de autorización
- [ ] Agregar operaciones CRUD completas para cuentas
- [ ] Implementar auditoría y versionado

### Fase 2 - Cache y Performance (Semana 7)

- [ ] Integrar Redis para cache distribuido
- [ ] Implementar rate limiting
- [ ] Optimizar consultas con índices
- [ ] Agregar compresión de respuestas
- [ ] Implementar paginación cursor-based

### Fase 3 - Reportes y Exportaciones (Semana 8)

- [ ] Desarrollar servicio de generación de PDFs
- [ ] Implementar exportación a Excel/CSV
- [ ] Crear templates de reportes
- [ ] Agregar reportes asíncronos
- [ ] Implementar filtros avanzados

### Fase 4 - Frontend React (Semanas 9-10)

- [ ] Configurar proyecto React con TypeScript
- [ ] Implementar autenticación en frontend
- [ ] Desarrollar componentes de gestión de cuentas
- [ ] Crear dashboard administrativo
- [ ] Implementar buscador avanzado

### Fase 5 - Integraciones (Semana 11)

- [ ] Implementar webhooks
- [ ] Integrar con API de SUNAT
- [ ] Desarrollar servicio de notificaciones
- [ ] Crear API Gateway
- [ ] Implementar monitoreo y métricas

### Fase 6 - Testing y Deploy (Semana 12)

- [ ] Pruebas de integración completas
- [ ] Pruebas de carga y performance
- [ ] Configuración de CI/CD
- [ ] Deploy en ambiente de staging
- [ ] Documentación completa

## ✅ Criterios de Aceptación MVP2

### Funcionales

- [ ] Sistema completo de autenticación y autorización
- [ ] CRUD completo de cuentas con validaciones
- [ ] Generación de reportes en múltiples formatos
- [ ] Frontend web completamente funcional
- [ ] Integración con sistemas externos

### No Funcionales

- [ ] API debe soportar 1000 req/min con cache
- [ ] Tiempo de respuesta < 200ms para consultas cacheadas
- [ ] Disponibilidad 99.9% con health checks
- [ ] Backup automático de base de datos
- [ ] Logs estructurados y monitoreo completo

### Seguridad

- [ ] Autenticación JWT segura
- [ ] Autorización granular por endpoints
- [ ] Auditoría completa de operaciones
- [ ] Rate limiting efectivo
- [ ] Validación de entrada estricta

## 📈 Métricas y KPIs MVP2

### Performance

- Tiempo de respuesta promedio API: < 200ms
- Throughput: > 1000 req/min
- Cache hit rate: > 80%
- Tiempo de generación de reportes: < 30s

### Disponibilidad

- Uptime: > 99.9%
- Error rate: < 1%
- Time to recovery: < 5 min

### Uso

- Usuarios activos diarios
- Consultas por día
- Reportes generados por mes
- Operaciones CRUD por usuario

---

**Estado:** 🚧 **MVP2 EN DESARROLLO**  
**Fecha Estimada:** Octubre 2025  
**Equipo:** Desarrollo PCGE Full Stack
