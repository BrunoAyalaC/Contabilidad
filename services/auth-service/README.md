# Auth Service - Microservicio de Autenticación

## 🎯 Descripción

Microservicio responsable de la autenticación simple de usuarios en el sistema contable PCGE.

**Enfoque:** Login sencillo con email y contraseña, sin roles complejos.

## 🚀 Funcionalidades

- ✅ Registro de usuarios con email único
- ✅ Autenticación con JWT tokens
- ✅ Hash seguro de contraseñas (BCrypt)
- ✅ Validación de datos robusta
- ✅ API RESTful bien documentada

## 🧠 Objetivos de aprendizaje

Este proyecto está diseñado para que un desarrollador Junior aprenda:

- **Clean Architecture** aplicada prácticamente
- **Seguridad** en aplicaciones web
- **Entity Framework Core** con PostgreSQL
- **Testing** automatizado
- **APIs RESTful** con ASP.NET Core

## 🏗️ Arquitectura

Este microservicio sigue **Clean Architecture** con las siguientes capas:

- **Auth.Api**: Capa de presentación (Controllers, Middleware)
- **Auth.Application**: Lógica de aplicación (Services, DTOs, Validators)
- **Auth.Domain**: Núcleo del negocio (Entities, Interfaces)
- **Auth.Infrastructure**: Acceso a datos (Repositories, DbContext)

## 📋 Requisitos

- .NET 9
- PostgreSQL 15+
- Docker (opcional)

## 🛠️ Configuración inicial

### 1. Crear estructura de proyectos

```bash
# Navegar al directorio del servicio
cd services/auth-service/src

# Crear proyectos
dotnet new webapi -n Auth.Api
dotnet new classlib -n Auth.Domain
dotnet new classlib -n Auth.Application
dotnet new classlib -n Auth.Infrastructure

# Crear proyecto de tests
cd ../tests
dotnet new xunit -n Auth.Tests

# Crear solución y agregar proyectos
cd ..
dotnet new sln -n AuthService
dotnet sln add src/Auth.Api/Auth.Api.csproj
dotnet sln add src/Auth.Domain/Auth.Domain.csproj
dotnet sln add src/Auth.Application/Auth.Application.csproj
dotnet sln add src/Auth.Infrastructure/Auth.Infrastructure.csproj
dotnet sln add tests/Auth.Tests/Auth.Tests.csproj
```

### 2. Configurar referencias entre proyectos

```bash
# Application referencia Domain
cd src/Auth.Application
dotnet add reference ../Auth.Domain/Auth.Domain.csproj

# Infrastructure referencia Domain y Application
cd ../Auth.Infrastructure
dotnet add reference ../Auth.Domain/Auth.Domain.csproj
dotnet add reference ../Auth.Application/Auth.Application.csproj

# API referencia todos
cd ../Auth.Api
dotnet add reference ../Auth.Domain/Auth.Domain.csproj
dotnet add reference ../Auth.Application/Auth.Application.csproj
dotnet add reference ../Auth.Infrastructure/Auth.Infrastructure.csproj

# Tests referencia todos
cd ../../tests/Auth.Tests
dotnet add reference ../src/Auth.Api/Auth.Api.csproj
dotnet add reference ../src/Auth.Domain/Auth.Domain.csproj
dotnet add reference ../src/Auth.Application/Auth.Application.csproj
dotnet add reference ../src/Auth.Infrastructure/Auth.Infrastructure.csproj
```

### 3. Instalar dependencias NuGet

```bash
# En Auth.Api
cd ../src/Auth.Api
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.Identity
dotnet add package Swashbuckle.AspNetCore
dotnet add package Serilog.AspNetCore

# En Auth.Application
cd ../Auth.Application
dotnet add package AutoMapper
dotnet add package FluentValidation
dotnet add package FluentValidation.DependencyInjectionExtensions

# En Auth.Infrastructure
cd ../Auth.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore.Npgsql
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package BCrypt.Net-Next

# En Auth.Tests
cd ../../tests/Auth.Tests
dotnet add package Moq
dotnet add package Microsoft.AspNetCore.Mvc.Testing
dotnet add package Microsoft.EntityFrameworkCore.InMemory
```

## 📊 Modelo de datos

### Entidades principales:

```csharp
// Usuario
- Id (Guid)
- Email (string)
- PasswordHash (string)
- Nombre (string)
- Apellido (string)
- EstaActivo (bool)
- FechaCreacion (DateTime)
- FechaUltimoAcceso (DateTime?)

// Rol
- Id (Guid)
- Nombre (string)
- Descripcion (string)
- EstaActivo (bool)

// UsuarioRol (relación muchos a muchos)
- UsuarioId (Guid)
- RolId (Guid)
- FechaAsignacion (DateTime)
```

## 🔗 API Endpoints

### Autenticación

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios

- `GET /api/usuarios` - Listar usuarios (Admin)
- `GET /api/usuarios/{id}` - Obtener usuario por ID
- `PUT /api/usuarios/{id}` - Actualizar usuario
- `DELETE /api/usuarios/{id}` - Desactivar usuario (Admin)

### Roles

- `GET /api/roles` - Listar roles
- `POST /api/usuarios/{id}/roles` - Asignar rol a usuario (Admin)
- `DELETE /api/usuarios/{id}/roles/{rolId}` - Quitar rol de usuario (Admin)

## 🧪 Testing

### Ejecutar todas las pruebas

```bash
dotnet test
```

### Ejecutar con cobertura

```bash
dotnet test --collect:"XPlat Code Coverage"
```

## 🐳 Docker

### Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/Auth.Api/Auth.Api.csproj", "src/Auth.Api/"]
# ... copiar otros proyectos
RUN dotnet restore "src/Auth.Api/Auth.Api.csproj"
COPY . .
WORKDIR "/src/src/Auth.Api"
RUN dotnet build "Auth.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Auth.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Auth.Api.dll"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  auth-api:
    build: .
    ports:
      - "5001:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=auth-db;Database=AuthDb;Username=authuser;Password=authpass123
    depends_on:
      - auth-db

  auth-db:
    image: postgres:15
    environment:
      POSTGRES_DB: AuthDb
      POSTGRES_USER: authuser
      POSTGRES_PASSWORD: authpass123
    ports:
      - "5433:5432"
    volumes:
      - auth_data:/var/lib/postgresql/data

volumes:
  auth_data:
```

## 📝 Variables de entorno

```bash
# appsettings.json / appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=AuthDb;Username=authuser;Password=authpass123"
  },
  "JwtSettings": {
    "SecretKey": "your-super-secret-key-here-must-be-at-least-32-chars",
    "Issuer": "AuthService",
    "Audience": "ContabilidadApp",
    "ExpiryMinutes": 60
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

## 🔐 Seguridad

- Contraseñas hasheadas con BCrypt
- Tokens JWT con expiración
- Validación de entrada con FluentValidation
- Autorización basada en roles
- Logs de auditoría

## 📈 Monitoreo

- Logs estructurados con Serilog
- Health checks
- Métricas de performance (futuro)

## 🚀 Despliegue

### Desarrollo local

```bash
docker-compose up -d
dotnet run --project src/Auth.Api
```

### Migrar base de datos

```bash
cd src/Auth.Infrastructure
dotnet ef database update
```

## 📋 Lista de tareas para Junior

### ✅ Fase 1: Setup inicial

- [ ] Crear estructura de proyectos
- [ ] Configurar referencias
- [ ] Instalar dependencias NuGet
- [ ] Verificar que compila todo

### ✅ Fase 2: Dominio

- [ ] Crear entidad Usuario
- [ ] Crear entidad Rol
- [ ] Crear entidad UsuarioRol
- [ ] Definir interfaces de repositorio

### ✅ Fase 3: Infraestructura

- [ ] Crear AuthDbContext
- [ ] Implementar repositorios
- [ ] Configurar migraciones
- [ ] Crear seeders iniciales

### ✅ Fase 4: Aplicación

- [ ] Crear DTOs
- [ ] Implementar validadores
- [ ] Crear servicios de aplicación
- [ ] Implementar JWT service

### ✅ Fase 5: API

- [ ] Crear controladores
- [ ] Configurar Swagger
- [ ] Implementar middleware de auth
- [ ] Manejo de errores

### ✅ Fase 6: Testing

- [ ] Pruebas unitarias
- [ ] Pruebas de integración
- [ ] Configurar cobertura

### ✅ Fase 7: Documentación

- [ ] Actualizar README
- [ ] Documentar API
- [ ] Guías de despliegue

---

**👨‍💻 Desarrollado por:** [Nombre del Junior]  
**📅 Fecha inicio:** [Fecha]  
**🎯 Meta:** Completar en 2 semanas

¡Mucho éxito! 🚀
