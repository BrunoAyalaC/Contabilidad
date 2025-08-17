# Infraestructura y API Endpoints - Sistema PCGE

## 🏗️ Arquitectura de Infraestructura

### Arquitectura de Microservicios

```mermaid
graph TB
    Client[Frontend React] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> PCGE[Plan Contable Service]
    Gateway --> Notif[Notification Service]

    Auth --> PostgresAuth[(PostgreSQL Auth)]
    PCGE --> PostgresPCGE[(PostgreSQL PCGE)]
    PCGE --> Redis[(Redis Cache)]

    PCGE --> External[SUNAT API]
    Notif --> Email[Email Service]

    Gateway --> Monitoring[Monitoring Stack]
    Monitoring --> Elastic[ElasticSearch]
    Monitoring --> Kibana[Kibana]
```

### Stack Tecnológico

#### Backend

- **.NET 9**: Framework principal para microservicios
- **Entity Framework Core**: ORM para acceso a datos
- **MediatR**: Patrón CQRS y Mediator
- **FluentValidation**: Validaciones de modelos
- **AutoMapper**: Mapeo de objetos
- **Serilog**: Logging estructurado
- **HealthChecks**: Monitoreo de salud

#### Base de Datos

- **PostgreSQL 16**: Base de datos principal
- **Redis 7**: Cache distribuido y sesiones
- **Entity Framework Migrations**: Control de versiones de BD

#### Frontend

- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool moderno
- **React Query**: Gestión de estado del servidor
- **Material-UI**: Componentes de UI
- **React Router**: Navegación SPA

#### Infraestructura

- **Docker & Docker Compose**: Containerización
- **NGINX**: Reverse proxy y load balancer
- **Let's Encrypt**: Certificados SSL/TLS
- **GitHub Actions**: CI/CD pipeline

#### Monitoreo y Observabilidad

- **ElasticSearch**: Búsqueda y analytics de logs
- **Kibana**: Visualización de logs y métricas
- **Sentry**: Error tracking y performance monitoring
- **Prometheus**: Métricas de aplicación
- **Grafana**: Dashboards de monitoreo

## 🌐 Documentación Completa de APIs

### 🔐 Authentication Service

#### Base URL: `/api/v1/auth`

##### 1. Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "password123",
  "recordarme": true
}
```

**Respuesta Exitosa (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_aqui",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "refreshExpiresIn": 2592000,
    "usuario": {
      "id": 1,
      "email": "usuario@empresa.com",
      "nombre": "Juan Pérez",
      "avatar": "https://empresa.com/avatars/1.jpg",
      "roles": ["Contador", "Usuario"],
      "permisos": ["cuentas:read", "cuentas:write", "reportes:read"]
    }
  },
  "timestamp": "2025-08-16T10:30:00Z"
}
```

**Errores Posibles:**

- `401 Unauthorized`: Credenciales inválidas
- `429 Too Many Requests`: Demasiados intentos de login
- `400 Bad Request`: Datos de entrada inválidos

##### 2. Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_aqui"
}
```

##### 3. Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "refresh_token_aqui"
}
```

##### 4. Cambiar Contraseña

```http
PUT /api/v1/auth/cambiar-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "passwordActual": "password123",
  "passwordNuevo": "newpassword456",
  "confirmarPassword": "newpassword456"
}
```

##### 5. Recuperar Contraseña

```http
POST /api/v1/auth/recuperar-password
Content-Type: application/json

{
  "email": "usuario@empresa.com"
}
```

##### 6. Restablecer Contraseña

```http
POST /api/v1/auth/restablecer-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "passwordNuevo": "newpassword456",
  "confirmarPassword": "newpassword456"
}
```

### 👥 User Management Service

#### Base URL: `/api/v1/usuarios`

##### 1. Listar Usuarios

```http
GET /api/v1/usuarios
Authorization: Bearer {accessToken}
Query Parameters:
- page=1                    # Página (default: 1)
- limit=20                  # Límite por página (default: 20, max: 100)
- search=juan               # Búsqueda por nombre/email
- role=Contador             # Filtrar por rol
- activo=true              # Filtrar por estado
- sort=nombre              # Ordenar por campo
- order=asc                # Dirección de orden (asc/desc)
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "usuarios": [
      {
        "id": 1,
        "email": "juan@empresa.com",
        "nombre": "Juan Pérez",
        "avatar": "https://empresa.com/avatars/1.jpg",
        "roles": ["Contador"],
        "activo": true,
        "ultimoAcceso": "2025-08-16T09:15:00Z",
        "fechaCreacion": "2025-08-01T00:00:00Z"
      }
    ],
    "paginacion": {
      "paginaActual": 1,
      "totalPaginas": 5,
      "totalRegistros": 95,
      "registrosPorPagina": 20,
      "tienePaginaAnterior": false,
      "tienePaginaSiguiente": true
    }
  }
}
```

##### 2. Obtener Usuario

```http
GET /api/v1/usuarios/{id}
Authorization: Bearer {accessToken}
```

##### 3. Crear Usuario

```http
POST /api/v1/usuarios
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "email": "nuevo@empresa.com",
  "nombre": "Nuevo Usuario",
  "password": "password123",
  "roles": ["Consultor"],
  "activo": true,
  "permisos": ["cuentas:read"]
}
```

##### 4. Actualizar Usuario

```http
PUT /api/v1/usuarios/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "nombre": "Nombre Actualizado",
  "roles": ["Contador", "Supervisor"],
  "activo": true
}
```

##### 5. Desactivar Usuario

```http
DELETE /api/v1/usuarios/{id}
Authorization: Bearer {accessToken}
```

### 📊 Plan Contable Service

#### Base URL: `/api/v1/cuentas`

##### 1. Listar Cuentas

```http
GET /api/v1/cuentas
Authorization: Bearer {accessToken}
Query Parameters:
- page=1                    # Página
- limit=50                  # Límite por página (max: 500)
- search=efectivo           # Búsqueda en código/nombre
- elemento=1,2,3           # Filtrar por elementos
- nivel=2,3                # Filtrar por niveles
- padre=10                 # Cuentas hijas de
- activa=true              # Solo cuentas activas
- incluirHijos=true        # Incluir cuentas hijas
- sort=codigo              # Ordenar por (codigo, nombre, elemento)
- order=asc                # Dirección (asc/desc)
- formato=completo         # Formato respuesta (basico/completo)
```

**Respuesta Formato Básico:**

```json
{
  "success": true,
  "data": {
    "cuentas": [
      {
        "codigo": "10",
        "nombre": "EFECTIVO Y EQUIVALENTES DE EFECTIVO",
        "nivel": 2,
        "elemento": 1,
        "tipo": "ACTIVO_DISPONIBLE_EXIGIBLE",
        "activa": true
      }
    ],
    "paginacion": {
      "paginaActual": 1,
      "totalPaginas": 89,
      "totalRegistros": 4447
    }
  }
}
```

**Respuesta Formato Completo:**

```json
{
  "success": true,
  "data": {
    "cuentas": [
      {
        "codigo": "101",
        "nombre": "Caja",
        "descripcion": "Comprende el dinero en efectivo en caja y otros valores de disponibilidad inmediata",
        "nivel": 3,
        "padre": "10",
        "elemento": 1,
        "tipo": "ACTIVO_DISPONIBLE_EXIGIBLE",
        "activa": true,
        "esPersonalizada": false,
        "cantidadHijos": 5,
        "rutaJerarquia": "1 > 10 > 101",
        "fechaCreacion": "2025-08-01T00:00:00Z",
        "fechaActualizacion": "2025-08-01T00:00:00Z",
        "creadoPor": "sistema",
        "actualizadoPor": null
      }
    ]
  }
}
```

##### 2. Obtener Cuenta Específica

```http
GET /api/v1/cuentas/{codigo}
Authorization: Bearer {accessToken}
Query Parameters:
- incluirHijos=true         # Incluir cuentas hijas
- incluirJerarquia=true     # Incluir ruta jerárquica completa
- incluirHistorial=false    # Incluir historial de cambios
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "cuenta": {
      "codigo": "1011",
      "nombre": "Caja en moneda nacional",
      "descripcion": "Dinero en efectivo en moneda nacional",
      "nivel": 4,
      "padre": "101",
      "elemento": 1,
      "tipo": "ACTIVO_DISPONIBLE_EXIGIBLE",
      "activa": true,
      "esPersonalizada": false,
      "fechaCreacion": "2025-08-01T00:00:00Z"
    },
    "jerarquia": [
      { "codigo": "1", "nombre": "ACTIVO" },
      { "codigo": "10", "nombre": "EFECTIVO Y EQUIVALENTES DE EFECTIVO" },
      { "codigo": "101", "nombre": "Caja" },
      { "codigo": "1011", "nombre": "Caja en moneda nacional" }
    ],
    "hijos": [
      {
        "codigo": "10111",
        "nombre": "Caja en soles",
        "nivel": 5,
        "activa": true
      }
    ],
    "estadisticas": {
      "totalHijos": 2,
      "hijosActivos": 2,
      "nivelMaximo": 5
    }
  }
}
```

##### 3. Crear Cuenta Personalizada

```http
POST /api/v1/cuentas
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "codigo": "1015",
  "nombre": "Caja chica oficina Lima",
  "descripcion": "Caja para gastos menores de la oficina de Lima",
  "padre": "101",
  "activa": true,
  "metadata": {
    "sucursal": "Lima",
    "responsable": "María García",
    "montoMaximo": 500.00
  }
}
```

**Validaciones Automáticas:**

- Código no debe existir
- Código debe seguir jerarquía (padre + dígitos)
- Padre debe existir y estar activo
- Nombre debe ser único en el mismo nivel
- Máximo 5 dígitos

##### 4. Actualizar Cuenta

```http
PUT /api/v1/cuentas/{codigo}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "nombre": "Caja chica oficina Lima Norte",
  "descripcion": "Descripción actualizada",
  "activa": true,
  "metadata": {
    "responsable": "Carlos López",
    "montoMaximo": 750.00
  },
  "motivoCambio": "Cambio de responsable y aumento de monto"
}
```

##### 5. Desactivar Cuenta

```http
DELETE /api/v1/cuentas/{codigo}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "motivoDesactivacion": "Cuenta ya no se utiliza",
  "desactivarHijos": false
}
```

##### 6. Buscar Cuentas Avanzado

```http
POST /api/v1/cuentas/buscar
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "criterios": {
    "texto": "caja efectivo",
    "elementos": [1, 2],
    "niveles": [3, 4, 5],
    "soloActivas": true,
    "soloPersonalizadas": false,
    "fechaDesde": "2025-08-01",
    "fechaHasta": "2025-08-16"
  },
  "ordenamiento": {
    "campo": "codigo",
    "direccion": "asc"
  },
  "paginacion": {
    "pagina": 1,
    "limite": 50
  }
}
```

##### 7. Validar Código de Cuenta

```http
GET /api/v1/cuentas/validar/{codigo}
Authorization: Bearer {accessToken}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "codigo": "1016",
    "valido": true,
    "existeCodigo": false,
    "padreExiste": true,
    "padreActivo": true,
    "siguePatro": true,
    "nivelPermitido": true,
    "mensajes": [],
    "sugerencias": ["1016", "1017", "1018"]
  }
}
```

##### 8. Historial de Cuenta

```http
GET /api/v1/cuentas/{codigo}/historial
Authorization: Bearer {accessToken}
Query Parameters:
- limit=20                  # Límite de registros
- desde=2025-08-01         # Fecha desde
- hasta=2025-08-16         # Fecha hasta
- accion=UPDATE            # Filtrar por acción (CREATE, UPDATE, DELETE)
```

### 🗂️ Elementos Service

#### Base URL: `/api/v1/elementos`

##### 1. Listar Elementos

```http
GET /api/v1/elementos
Authorization: Bearer {accessToken}
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "numero": 1,
      "nombre": "ACTIVO DISPONIBLE Y EXIGIBLE",
      "descripcion": "Comprende los fondos en caja y en instituciones financieras, y las cuentas por cobrar de disponibilidad inmediata",
      "tipoBalance": "ACTIVO",
      "totalCuentas": 145,
      "cuentasActivas": 143
    },
    {
      "numero": 2,
      "nombre": "ACTIVO REALIZABLE",
      "descripcion": "Incluye las cuentas de la 20 hasta la 29. Comprende los bienes y servicios acumulados de propiedad de la empresa",
      "tipoBalance": "ACTIVO",
      "totalCuentas": 267,
      "cuentasActivas": 265
    }
  ]
}
```

##### 2. Obtener Elemento Específico

```http
GET /api/v1/elementos/{numero}
Authorization: Bearer {accessToken}
Query Parameters:
- incluirCuentas=true       # Incluir listado de cuentas principales
- incluirEstadisticas=true  # Incluir estadísticas detalladas
```

##### 3. Cuentas por Elemento

```http
GET /api/v1/elementos/{numero}/cuentas
Authorization: Bearer {accessToken}
Query Parameters:
- nivel=2                   # Filtrar por nivel específico
- activas=true             # Solo cuentas activas
- limit=50                 # Límite de resultados
```

### 📄 Reportes Service

#### Base URL: `/api/v1/reportes`

##### 1. Generar Reporte Asíncrono

```http
POST /api/v1/reportes/generar
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tipo": "catalogo_completo",
  "formato": "pdf",
  "configuracion": {
    "elementos": [1, 2, 3],
    "niveles": [2, 3, 4],
    "soloActivas": true,
    "incluirDescripciones": true,
    "incluirJerarquia": true,
    "incluirMetadata": false
  },
  "formatoPDF": {
    "tamanoPagina": "A4",
    "orientacion": "vertical",
    "incluirPortada": true,
    "incluirIndice": true,
    "numerarPaginas": true
  },
  "enviarPorEmail": {
    "destinatarios": ["contador@empresa.com"],
    "asunto": "Catálogo PCGE - Agosto 2025"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "reporteId": "rpt_123456789",
    "estado": "EN_COLA",
    "tiempoEstimado": 30,
    "mensaje": "El reporte se está generando. Recibirás una notificación cuando esté listo."
  }
}
```

##### 2. Estado del Reporte

```http
GET /api/v1/reportes/{reporteId}/estado
Authorization: Bearer {accessToken}
```

**Estados Posibles:**

- `EN_COLA`: En cola de procesamiento
- `PROCESANDO`: Generando el reporte
- `COMPLETADO`: Listo para descarga
- `ERROR`: Error en la generación
- `EXPIRADO`: El archivo ha expirado

##### 3. Descargar Reporte

```http
GET /api/v1/reportes/{reporteId}/descargar
Authorization: Bearer {accessToken}
```

##### 4. Listar Reportes Generados

```http
GET /api/v1/reportes/historial
Authorization: Bearer {accessToken}
Query Parameters:
- page=1
- limit=20
- estado=COMPLETADO
- desde=2025-08-01
- hasta=2025-08-16
```

### 📤 Exportación Service

#### Base URL: `/api/v1/exportacion`

##### 1. Exportar a Excel

```http
GET /api/v1/exportacion/excel
Authorization: Bearer {accessToken}
Query Parameters:
- elemento=1,2,3           # Elementos a incluir
- nivel=2,3,4             # Niveles a incluir
- activas=true            # Solo cuentas activas
- formato=completo        # basico/completo/personalizado
- incluirFormulas=true    # Incluir fórmulas Excel
- incluirGraficos=false   # Incluir gráficos
Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

##### 2. Exportar a CSV

```http
GET /api/v1/exportacion/csv
Authorization: Bearer {accessToken}
Query Parameters:
- elemento=all
- separador=,             # Separador de campos
- encoding=utf8           # Codificación del archivo
- incluirCabeceras=true   # Incluir fila de cabeceras
Accept: text/csv
```

##### 3. Exportar a JSON

```http
GET /api/v1/exportacion/json
Authorization: Bearer {accessToken}
Query Parameters:
- elemento=all
- formato=completo        # Nivel de detalle
- minificar=false         # JSON minificado
Accept: application/json
```

### 🔔 Webhooks Service

#### Base URL: `/api/v1/webhooks`

##### 1. Registrar Webhook

```http
POST /api/v1/webhooks
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "url": "https://miempresa.com/webhook/pcge",
  "eventos": [
    "cuenta.creada",
    "cuenta.actualizada",
    "cuenta.desactivada",
    "usuario.creado"
  ],
  "secreto": "webhook_secret_key_aqui",
  "activo": true,
  "configuracion": {
    "reintentos": 3,
    "timeoutSegundos": 30,
    "incluirDatos": true
  }
}
```

##### 2. Listar Webhooks

```http
GET /api/v1/webhooks
Authorization: Bearer {accessToken}
```

##### 3. Actualizar Webhook

```http
PUT /api/v1/webhooks/{id}
Authorization: Bearer {accessToken}
```

##### 4. Probar Webhook

```http
POST /api/v1/webhooks/{id}/probar
Authorization: Bearer {accessToken}
```

##### 5. Historial de Entregas

```http
GET /api/v1/webhooks/{id}/entregas
Authorization: Bearer {accessToken}
Query Parameters:
- limit=50
- estado=exitoso          # exitoso/fallido/pendiente
- desde=2025-08-01
```

### 📊 Monitoreo y Métricas

#### Base URL: `/api/v1/sistema`

##### 1. Health Check

```http
GET /api/v1/sistema/health
```

**Respuesta:**

```json
{
  "status": "Healthy",
  "timestamp": "2025-08-16T10:30:00Z",
  "checks": {
    "database": {
      "status": "Healthy",
      "description": "PostgreSQL connection successful",
      "responseTime": "15ms"
    },
    "redis": {
      "status": "Healthy",
      "description": "Redis cache operational",
      "responseTime": "5ms"
    },
    "external_apis": {
      "status": "Degraded",
      "description": "SUNAT API slow response",
      "responseTime": "2500ms"
    }
  },
  "totalResponseTime": "2520ms"
}
```

##### 2. Métricas de Performance

```http
GET /api/v1/sistema/metricas
Authorization: Bearer {accessToken}
```

##### 3. Información del Sistema

```http
GET /api/v1/sistema/info
Authorization: Bearer {accessToken}
```

##### 4. Limpiar Cache

```http
DELETE /api/v1/sistema/cache
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tipo": "cuentas",          # cuentas/usuarios/reportes/todo
  "patron": "elemento:1:*"    # Patrón específico de keys
}
```

## 🔒 Seguridad y Autenticación

### Headers Requeridos

#### Autenticación

```http
Authorization: Bearer {accessToken}
```

#### Headers Adicionales

```http
Content-Type: application/json
X-API-Version: 1.0
X-Request-ID: unique-request-id
User-Agent: MiApp/1.0.0
```

### Rate Limiting

#### Límites por Endpoint

- **Login**: 5 intentos por minuto por IP
- **APIs de consulta**: 100 requests por minuto por usuario
- **APIs de escritura**: 50 requests por minuto por usuario
- **Reportes**: 10 reportes por hora por usuario
- **Exportaciones**: 20 exportaciones por día por usuario

#### Headers de Rate Limit

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1629123600
```

### Manejo de Errores

#### Estructura de Error Estándar

```json
{
  "success": false,
  "error": {
    "codigo": "CUENTA_NO_ENCONTRADA",
    "mensaje": "La cuenta con código '999' no existe",
    "detalles": {
      "codigo": "999",
      "timestamp": "2025-08-16T10:30:00Z",
      "requestId": "req_123456789"
    }
  }
}
```

#### Códigos de Error Comunes

- `400`: Bad Request - Datos de entrada inválidos
- `401`: Unauthorized - Token inválido o expirado
- `403`: Forbidden - Sin permisos suficientes
- `404`: Not Found - Recurso no encontrado
- `409`: Conflict - Conflicto en la operación
- `422`: Unprocessable Entity - Validación de negocio fallida
- `429`: Too Many Requests - Rate limit excedido
- `500`: Internal Server Error - Error interno del servidor

## 🚀 Configuración de Despliegue

### Variables de Entorno Completas

```env
# === APLICACIÓN ===
APP_NAME=PCGE_Backend
APP_VERSION=1.0.0
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=https://+:443;http://+:80

# === BASE DE DATOS ===
POSTGRES_HOST=postgres-cluster.internal
POSTGRES_PORT=5432
POSTGRES_DB=pcge_production
POSTGRES_USER=pcge_app
POSTGRES_PASSWORD=super_secure_password
POSTGRES_SSL_MODE=require
CONNECTION_TIMEOUT=30
COMMAND_TIMEOUT=300
POOL_SIZE_MIN=5
POOL_SIZE_MAX=100

# === REDIS CACHE ===
REDIS_HOST=redis-cluster.internal
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password
REDIS_DB=0
REDIS_CONNECT_TIMEOUT=5000
REDIS_SYNC_TIMEOUT=5000
REDIS_DEFAULT_TTL=3600

# === JWT CONFIGURACIÓN ===
JWT_SECRET_KEY=super_secret_jwt_key_256_bits_minimum
JWT_ISSUER=https://api.pcge.empresa.com
JWT_AUDIENCE=pcge-frontend
JWT_ACCESS_TOKEN_EXPIRATION=3600
JWT_REFRESH_TOKEN_EXPIRATION=2592000
JWT_CLOCK_SKEW=300

# === RATE LIMITING ===
RATE_LIMIT_GENERAL=100
RATE_LIMIT_LOGIN=5
RATE_LIMIT_REPORTS=10
RATE_LIMIT_EXPORT=20
RATE_LIMIT_WINDOW_MINUTES=60

# === CORS ===
CORS_ORIGINS=https://pcge.empresa.com,https://admin.pcge.empresa.com
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Authorization,Content-Type,X-API-Version

# === SMTP EMAIL ===
SMTP_HOST=smtp.empresa.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=noreply@empresa.com
SMTP_PASSWORD=email_password
EMAIL_FROM_NAME=Sistema PCGE
EMAIL_FROM_ADDRESS=noreply@empresa.com

# === STORAGE ===
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=pcge-storage-production
S3_BUCKET_REGION=us-east-1
FILE_MAX_SIZE_MB=50
ALLOWED_FILE_TYPES=.pdf,.xlsx,.csv,.json

# === APIS EXTERNAS ===
SUNAT_API_URL=https://api.sunat.gob.pe/v1
SUNAT_API_KEY=sunat_api_key_here
SUNAT_TIMEOUT_SECONDS=30
EXTERNAL_API_RETRIES=3

# === LOGGING ===
SERILOG_MINIMUM_LEVEL=Information
SERILOG_WRITE_TO_FILE=true
SERILOG_WRITE_TO_ELASTICSEARCH=true
SERILOG_FILE_PATH=/var/log/pcge/app.log
SERILOG_ELASTICSEARCH_URI=http://elasticsearch:9200
SERILOG_ELASTICSEARCH_INDEX=pcge-logs

# === MONITOREO ===
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENDPOINT=/metrics
SENTRY_DSN=https://your-sentry-dsn-here
ELASTIC_APM_SERVICE_NAME=pcge-backend
ELASTIC_APM_SERVER_URL=http://apm-server:8200

# === SEGURIDAD ===
HTTPS_ONLY=true
HSTS_MAX_AGE=31536000
CONTENT_SECURITY_POLICY=default-src 'self'
X_FRAME_OPTIONS=DENY
X_CONTENT_TYPE_OPTIONS=nosniff
REFERRER_POLICY=strict-origin-when-cross-origin

# === CACHE ESPECÍFICO ===
CACHE_CUENTAS_TTL=3600
CACHE_ELEMENTOS_TTL=86400
CACHE_USUARIOS_TTL=1800
CACHE_REPORTES_TTL=300
CACHE_PREFIX=pcge:prod
```

### Docker Compose Producción

```yaml
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api-gateway
    restart: unless-stopped

  api-gateway:
    image: pcge/api-gateway:latest
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    ports:
      - "8080:80"
    depends_on:
      - plan-contable-api
      - auth-api
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  plan-contable-api:
    image: pcge/plan-contable:latest
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=${POSTGRES_CONNECTION}
      - Redis__ConnectionString=${REDIS_CONNECTION}
      - JWT__SecretKey=${JWT_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
          cpus: "0.5"

  auth-api:
    image: pcge/auth-service:latest
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=${POSTGRES_CONNECTION}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - elastic_data:/usr/share/elasticsearch/data
    restart: unless-stopped

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  elastic_data:

networks:
  default:
    driver: bridge
```

---

**Documento:** Infraestructura y API Endpoints Sistema PCGE  
**Versión:** 1.0.0  
**Fecha:** Agosto 2025  
**Estado:** 📋 Documentación Completa
