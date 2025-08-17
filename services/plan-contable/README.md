# Plan Contable Service - PCGE Backend

Servicio backend para el manejo del Plan Contable General Empresarial (PCGE) Modificado 2019.

## 🏗️ Estructura del Proyecto

```
src/
├── PlanContable.Domain/        # Entidades y reglas de negocio
├── PlanContable.Infrastructure/ # Acceso a datos
├── PlanContable.Application/    # Casos de uso
├── PlanContable.Api/           # API REST
└── PlanContable.SeedRunner/    # Importador de datos

data/                           # Datos del PCGE (JSON/CSV)
docs/                          # Documentación del servicio
tools/                         # Herramientas y parsers
tests/                         # Pruebas
migrations/                    # Migraciones de BD
```

## 🚀 Configuración Rápida

### 1. Base de Datos

```bash
docker-compose up -d
```

### 2. Migraciones

```bash
cd src/PlanContable.Api
dotnet ef database update
```

### 3. Importar PCGE

```bash
cd ../PlanContable.SeedRunner
dotnet run
```

### 4. Ejecutar API

```bash
cd ../PlanContable.Api
dotnet run
```

## 📊 API Endpoints

### Cuentas PCGE

- `GET /api/cuentas` - Lista todas las cuentas
- `GET /api/cuentas/{codigo}` - Obtiene cuenta específica
- `GET /api/cuentas/elemento/{elemento}` - Cuentas por elemento
- `GET /api/cuentas/jerarquia/{codigo}` - Jerarquía de cuenta

### Elementos

- `GET /api/elementos` - Lista todos los elementos
- `GET /api/elementos/{numero}` - Elemento específico

## 🗄️ Base de Datos

### Configuración PostgreSQL

- **Host**: localhost
- **Puerto**: 5433
- **Base**: pcge_db
- **Usuario**: pcge_user
- **Password**: pcge_password

### Tablas Principales

- `cuentas_pcge` - Catálogo de cuentas
- `elementos_pcge` - Elementos del PCGE

## 🛠️ Herramientas

### Parser PCGE (`tools/pcge_parser.py`)

Extrae cuentas del documento oficial PCGE en formato Markdown.

```bash
cd tools
python pcge_parser.py
```

Genera:

- `data/pcge_completo.json` - Catálogo en JSON
- `data/pcge_completo.csv` - Catálogo en CSV

## 🧪 Pruebas

```bash
cd tests
dotnet test
```

## 📈 Características

- ✅ Clean Architecture
- ✅ Entity Framework Core
- ✅ PostgreSQL optimizado
- ✅ Docker containerizado
- ✅ Importación automática PCGE
- ✅ API REST completa
- ✅ Validaciones de jerarquía
- ✅ Documentación Swagger

## 🔧 Desarrollo

### Agregar Nueva Migración

```bash
cd src/PlanContable.Infrastructure
dotnet ef migrations add NombreMigracion --startup-project ../PlanContable.Api
```

### Actualizar Base de Datos

```bash
cd src/PlanContable.Api
dotnet ef database update
```

### Generar Datos PCGE

```bash
cd tools
python pcge_parser.py
cd ../src/PlanContable.SeedRunner
dotnet run
```
