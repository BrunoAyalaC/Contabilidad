# Plan Contable General Empresarial (PCGE) - Sistema Backend

[![.NET](https://img.shields.io/badge/.NET-9.0-blue.svg)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

Sistema backend completo para el manejo del Plan Contable General Empresarial (PCGE) Modificado 2019 del Perú, implementado con Clean Architecture y tecnologías modernas.

## 🏗️ Arquitectura del Proyecto

```
services/
├── plan-contable/              # Servicio principal PCGE
│   ├── src/                    # Código fuente
│   │   ├── PlanContable.Domain/        # Entidades y reglas de negocio
│   │   ├── PlanContable.Infrastructure/ # Acceso a datos y servicios externos
│   │   ├── PlanContable.Application/    # Casos de uso y servicios
│   │   ├── PlanContable.Api/           # API REST
│   │   └── PlanContable.SeedRunner/    # Importador de datos PCGE
│   ├── data/                   # Datos del PCGE (JSON/CSV)
│   ├── docs/                   # Documentación específica del servicio
│   ├── tools/                  # Herramientas y scripts
│   ├── tests/                  # Pruebas unitarias e integración
│   └── migrations/             # Migraciones de base de datos
├── auth-service/               # Servicio de autenticación
└── shared/                     # Componentes compartidos
```

## 🚀 Características Principales

- **Clean Architecture**: Separación clara de responsabilidades
- **PCGE Completo**: Implementación del catálogo oficial con 4,447+ cuentas
- **API REST**: Endpoints para consulta y gestión de cuentas contables
- **Base de Datos**: PostgreSQL con relaciones jerárquicas optimizadas
- **Docker**: Contenedores para desarrollo y producción
- **Seeding**: Importación automática del catálogo PCGE oficial
- **Validaciones**: Reglas de negocio y validaciones de jerarquía

## 🛠️ Tecnologías

### Backend

- **.NET 9**: Framework principal
- **Entity Framework Core**: ORM para acceso a datos
- **PostgreSQL**: Base de datos principal
- **Docker Compose**: Orquestación de contenedores

### Herramientas

- **Python**: Scripts de procesamiento de datos PCGE
- **JSON/CSV**: Formatos de intercambio de datos

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone [repository-url]
cd Lester
```

### 2. Configurar base de datos

```bash
cd services/plan-contable
docker-compose up -d
```

### 3. Ejecutar migraciones

```bash
cd src/PlanContable.Api
dotnet ef database update
```

### 4. Importar datos PCGE

```bash
cd ../PlanContable.SeedRunner
dotnet run
```

### 5. Iniciar API

```bash
cd ../PlanContable.Api
dotnet run
```

La API estará disponible en: `https://localhost:7001`

## 📚 Documentación

- [Documentación del Backend](./docs/PCGE_BACKEND.md)
- [Guía MVP1](./docs/PCGE_MVP1.md)
- [Guía MVP2](./docs/PCGE_MVP2.md)
- [Guía Junior Developer](./docs/JUNIOR_GUIDE.md)

## 🧪 Pruebas

```bash
cd services/plan-contable/tests
dotnet test
```

## 🐳 Docker

### Desarrollo

```bash
docker-compose up -d
```

### Producción

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Estructura de Datos PCGE

El sistema maneja el catálogo completo del PCGE con:

- **Elementos**: 10 elementos principales (0-9)
- **Cuentas**: Nivel 2 dígitos (cuentas principales)
- **Subcuentas**: Nivel 3 dígitos
- **Divisionarias**: Nivel 4 dígitos
- **Sub-divisionarias**: Nivel 5 dígitos

### Elementos del PCGE:

- **1, 2, 3**: Activo
- **4**: Pasivo
- **5**: Patrimonio
- **6**: Gastos por naturaleza
- **7**: Ingresos
- **8**: Saldos intermediarios
- **9**: Contabilidad analítica
- **0**: Cuentas de orden

## 🔧 Configuración

### Variables de Entorno

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
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte y preguntas:

- Crear issue en GitHub
- Revisar documentación en `/docs`
- Contactar al equipo de desarrollo

---

**Plan Contable General Empresarial (PCGE) - Sistema Backend**  
_Desarrollado con ❤️ para la comunidad contable peruana_
