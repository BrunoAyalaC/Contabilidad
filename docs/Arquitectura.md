# Arquitectura y Endpoints Principales - Sistema PCGE

## Arquitectura General

- Microservicios: Auth, Plan Contable, Notificaciones
- API Gateway centraliza acceso
- PostgreSQL y Redis como almacenamiento principal
- Docker y NGINX para despliegue y balanceo
- Observabilidad: ElasticSearch, Kibana, Prometheus, Grafana

## Stack Tecnológico

- Backend: .NET 9, Entity Framework Core, MediatR, Serilog
- Base de datos: PostgreSQL 16, Redis 7
- Frontend: React 18, TypeScript, Vite, Material-UI
- Infraestructura: Docker Compose, NGINX, GitHub Actions

## Endpoints Principales (REST)

### Auth Service

- `/api/v1/auth/login` (POST): Login
- `/api/v1/auth/refresh` (POST): Refresh token
- `/api/v1/auth/logout` (POST): Logout
- `/api/v1/auth/cambiar-password` (PUT): Cambiar contraseña

### Usuarios

- `/api/v1/usuarios` (GET/POST): Listar y crear usuarios
- `/api/v1/usuarios/{id}` (GET/PUT/DELETE): Obtener, actualizar, desactivar usuario

### Plan Contable

- `/api/v1/cuentas` (GET/POST): Listar y crear cuentas
- `/api/v1/cuentas/{codigo}` (GET/PUT/DELETE): Obtener, actualizar, desactivar cuenta
- `/api/v1/cuentas/buscar` (POST): Búsqueda avanzada

### Elementos

- `/api/v1/elementos` (GET): Listar elementos
- `/api/v1/elementos/{numero}` (GET): Detalle de elemento

### Reportes y Exportación

- `/api/v1/reportes/generar` (POST): Generar reporte
- `/api/v1/exportacion/excel` (GET): Exportar a Excel
- `/api/v1/exportacion/csv` (GET): Exportar a CSV
- `/api/v1/exportacion/json` (GET): Exportar a JSON

### Monitoreo y Webhooks

- `/api/v1/sistema/health` (GET): Health check
- `/api/v1/webhooks` (GET/POST): Listar y registrar webhooks

## Seguridad y Buenas Prácticas

- JWT para autenticación
- Rate limiting por endpoint
- Validaciones y manejo de errores estándar
- Despliegue con Docker Compose y variables de entorno

---

## Extensiones Recomendadas

### Visual Studio 2022 (.NET Backend)

- **C#** (oficial de Microsoft)
- **NuGet Package Manager**
- **Entity Framework Core Power Tools**
- **SQL Server Data Tools**
- **Azure Data Studio** (opcional, para gestión avanzada de bases de datos)
- **GitHub Extension for Visual Studio**
- **Roslynator** (análisis y refactorización de código C#)
- **SonarLint** (análisis estático de calidad y seguridad)
- **EditorConfig Language Service**
- **Docker Tools**
- **Visual Studio Spell Checker** (opcional)
- **.NET MAUI (si aplica para apps móviles)**

### Visual Studio Code / Frontend (React)

- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **Simple React Snippets**
- **Bracket Pair Colorizer 2**
- **GitLens**
- **VSCode Styled Components** (si usas styled-components)
- **SCSS IntelliSense**
- **Path Intellisense**
- **Import Cost**
- **Jest** (para testing)
- **REST Client** (para probar APIs)
- **Error Lens**
- **Material Icon Theme**
- **Thunder Client** (alternativa ligera a Postman)

---

**Documento resumido. Para detalles, ver documentación extendida.**
