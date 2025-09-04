# Guía de Instalación de Dependencias del Proyecto

Este documento detalla los pasos necesarios para instalar todas las dependencias de los diferentes servicios y el frontend del proyecto.

## Requisitos Previos

Asegúrate de tener instalados los siguientes programas:
*   **Node.js** (versión 16 o superior) y **npm**
*   **.NET SDK** (versión 6 o superior, según los proyectos .NET)

## Instalación de Dependencias

Para cada componente del proyecto, abre una terminal o línea de comandos, navega al directorio indicado y ejecuta el comando de instalación.

### 1. Frontend

```bash
cd C:\Users\Pc\Desktop\Lester\Front
npm install
```

### 2. Backend - Scrapping (Scripts de Playwright)

```bash
cd C:\Users\Pc\Desktop\Lester\Backend\Scrapping
npm install
```

### 3. Backend - SunatService (Servicio de Consulta RUC)

```bash
cd C:\Users\Pc\Desktop\Lester\Backend\SunatService
npm install
```

### 4. Backend - Servicios .NET (AuthService, AccountingService, Facturas, OcrService)

Para los servicios de .NET, la restauración de dependencias se realiza automáticamente al construir o ejecutar el proyecto. Sin embargo, puedes forzar la restauración si es necesario.

#### 4.1. AuthService

```bash
cd C:\Users\Pc\Desktop\Lester\Backend\AuthService
dotnet restore
```

#### 4.2. AccountingService

```bash
cd C:\Users\Pc\Desktop\Lester\Backend\AccountingService
dotnet restore
```

#### 4.3. Facturas (Posiblemente InvoiceService)

```bash
cd C:\Users\Pc\Desktop\Lester\Backend\Facturas
dotnet restore
```

#### 4.4. OcrService

```bash
cd C:\Users\Pc\Desktop\Lester\Backend\OcrService
dotnet restore
```

---

**Nota:** Después de instalar todas las dependencias, puedes iniciar los servicios y el frontend según las instrucciones específicas de cada uno (ej. `npm start` para el frontend, `node index.js` para SunatService, `dotnet run` para servicios .NET).

## Cómo Iniciar los Servicios

Para iniciar cada componente del proyecto, abre una terminal o línea de comandos **diferente para cada servicio** y sigue los pasos. Asegúrate de haber instalado las dependencias previamente.

### 1. Frontend

*   **Puerto:** `5173` (o el que asigne Vite)
```bash
cd C:\Users\Pc\Desktop\Lester\Front
npm start
```

### 2. Backend - SunatService (Servicio de Consulta RUC)

*   **Puerto:** `5008`
```bash
cd C:\Users\Pc\Desktop\Lester\Backend\SunatService
node index.js
```

### 3. Backend - AuthService

*   **Puerto:** `5000`
```bash
cd C:\Users\Pc\Desktop\Lester\Backend\AuthService
dotnet run
```

### 4. Backend - AccountingService

*   **Puerto:** `5002`
```bash
cd C:\Users\Pc\Desktop\Lester\Backend\AccountingService
dotnet run
```

### 5. Backend - OcrService

*   **Puerto:** `5004`
```bash
cd C:\Users\Pc\Desktop\Lester\Backend\OcrService
dotnet run
```

### 6. Backend - Facturas (Posiblemente InvoiceService)

*   **Puerto:** (Asignado por .NET, usualmente 5000/5001 si no hay conflicto)
```bash
cd C:\Users\Pc\Desktop\Lester\Backend\Facturas
dotnet run
```