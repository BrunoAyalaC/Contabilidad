## Guía de instalación y comandos (Windows PowerShell)

Breve: aquí están los comandos mínimos para instalar dependencias, ejecutar en desarrollo, crear builds y las rutas relativas clave del proyecto. Ejecuta todos los comandos desde la raíz del proyecto (la carpeta que contiene `package.json`).

### Checklist rápido

- Ejecutar desde la raíz del proyecto (donde está `package.json`).
- Usar PowerShell (o adaptar comandos a tu shell preferido).
- Asegurarse de tener Node.js (recomendado >= 18) y npm instalados.

---

### 1) Instalar dependencias

Abre PowerShell en la raíz del proyecto y ejecuta:

```powershell
npm install
```

Si prefieres una instalación reproducible cuando hay `package-lock.json`, puedes usar:

```powershell
npm ci
```

### 2) Comandos de desarrollo y ejecución

- Iniciar solo el frontend (Vite):

```powershell
npm run dev
```

- Iniciar Vite y Electron (modo desarrollo, recomendado):

```powershell
npm run electron:dev
# o alternativamente
npm start
```

- Previsualizar build (servidor estático) y abrir Electron:

```powershell
npm run electron:preview
```

- Crear build de producción (frontend):

```powershell
npm run build
```

### 3) Comandos útiles de diagnóstico

- Ejecutar tests rápidos del mapeador (si aplica):

```powershell
npm run test:mapper
```

- Comprobar tipos TypeScript sin emitir archivos:

```powershell
npx tsc --noEmit
```

---

### 4) Variables de entorno y configuración

- La app guarda configuraciones en tiempo de ejecución (ej. API keys) mediante la UI de `Settings`. Si necesitas probar con la variable de entorno en tu sesión PowerShell, haz:

```powershell
$env:GEMINI_API_KEY = "TU_API_KEY_AQUI"
# luego ejecutar el comando de desarrollo en la misma sesión
npm run electron:dev
```

Nota: en producción la app persiste configuraciones en `userData/config.json` (gestión vía la UI de Settings). Evita poner claves en el repositorio.

---

### 5) Rutas relativas importantes

Ejecuta los comandos desde la raíz del proyecto (donde está `package.json`). A continuación las rutas relativas más relevantes dentro del repo:

- `package.json` -> raíz del proyecto (scripts)
- `electron/main.cjs` -> proceso principal de Electron
- `electron/preload.js` -> script preload que expone `window.electronAPI`
- `lib/database.cjs` -> helpers de SQLite (usa `../contabilidad.db` desde `lib`)
- `contabilidad.db` -> archivo SQLite (en la raíz del proyecto)
- `index.html` -> entrada HTML del renderer
- `index.tsx` / `App.tsx` -> entrada React/TS del renderer
- `pages/` -> páginas React (Sales, Purchases, etc.)
- `components/` -> componentes de UI
- `docs/setup.md` -> este archivo

Paths de ejemplo para abrir/editar (relativos a la raíz):

```text
./electron/main.cjs
./electron/preload.js
./lib/database.cjs
./contabilidad.db
./pages/PurchasesPage.tsx
```

---

### 6) Notas específicas para Windows PowerShell

- Si tienes permisos UAC activados, abre PowerShell como Administrador para ciertas operaciones que requieran permisos de escritura en carpetas especiales.
- Mantén la misma sesión de PowerShell si defines variables con `$env:...` para que estén disponibles al ejecutar scripts.

---

### 7) Contraseña hasheada

$2b$10$4sThFdvKOsA9RETzYwuGVO8K8zVO6bvbIMWfT0fSp3Jzryxzw7k9.(admin)
