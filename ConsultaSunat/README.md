# Consulta RUC - SUNAT (Node.js + Puppeteer)

Proyecto pequeño para consultas ocasionales de RUC en la web de SUNAT usando Puppeteer (sin Python).

Requisitos

- Node.js 16+ y npm

Instalación (PowerShell):

```powershell
cd C:/Users/Pc/tests
npm install
```

Uso:

```powershell
node consulta-ruc.js 20123456789
```

Salida: JSON con algunos campos básicos (razón social, estado, dirección si están disponibles).

Notas y advertencias

- Este script usa scraping. Respeta las condiciones de uso de SUNAT y evita consultas masivas.
- La estructura HTML del sitio puede cambiar; si el script falla, actualiza los selectores en `consulta-ruc.js`.
