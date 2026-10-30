# ElectroVibeHome

**Transforma tu hogar con la energía del futuro.**

ElectroVibeHome es una plataforma web de comercio electrónico enfocada en productos y soluciones para el hogar. Integra una experiencia de catálogo, cuentas de cliente, pedidos y herramientas de administración en una aplicación construida con React, Node.js y MongoDB.

El repositorio corresponde a un proyecto personal y de demostración técnica. La experiencia permite recorrer el flujo de compra y administrar pedidos, pero **no procesa cobros ni transferencias reales**. Los precios, productos y existencias del catálogo son información de muestra.

## Sitio, API y ramas

- **Tienda:** [electrovibehome.onrender.com](https://electrovibehome.onrender.com/)
- **API:** [electrovibehome-v2-api.onrender.com](https://electrovibehome-v2-api.onrender.com/)
- **Repositorio:** [github.com/sro2005/ElectroVibeHome](https://github.com/sro2005/ElectroVibeHome)

La rama `electrovibehome-stable` es la rama principal de trabajo y contiene la versión vigente del proyecto. La rama `main` conserva la versión original como referencia independiente y debe permanecer sin cambios durante el mantenimiento de la versión estable.

Ambos servicios de Render se despliegan desde `electrovibehome-stable`. Los rulesets protegen las ramas principales frente a eliminación y `force push`; la rama estable exige que los controles configurados de CI se completen antes de integrar cambios.

El nombre `-v2-api` se conserva únicamente en el dominio heredado del servicio backend. No representa una segunda versión activa del producto.

## Funcionalidades

### Experiencia de cliente

- Explorar el catálogo, buscar productos y filtrar por categoría.
- Crear una cuenta de cliente, iniciar y cerrar sesión.
- Consultar y actualizar la información del perfil.
- Solicitar la recuperación de contraseña y establecer una nueva mediante un enlace de un solo uso.
- Registrar pedidos y consultar su historial y evolución.

### Administración

- Consultar el panel general.
- Crear, consultar, editar y eliminar productos.
- Gestionar existencias e información del inventario.
- Consultar clientes y revisar pedidos.
- Actualizar las etapas logísticas de los pedidos.

El registro público crea cuentas de cliente; no concede permisos de administrador. El acceso administrativo requiere aprovisionamiento controlado.

### Guía ElectroVibe

La guía conversacional ofrece recomendaciones a partir de nombres, categorías, descripciones, precios de referencia y existencias del catálogo. Actualmente funciona con reglas locales en el navegador: no llama a OpenAI ni a otros servicios externos de IA, no necesita una clave de API y no genera cargos por uso de modelos.

## Tecnologías

| Capa | Tecnologías principales |
| --- | --- |
| Frontend | React, Vite, React Router, JavaScript y CSS |
| Backend | Node.js, Express y API REST |
| Persistencia | MongoDB y Mongoose |
| Validación | Joi y validaciones específicas de dominio |
| Autenticación | JSON Web Tokens (JWT), bcrypt y control de acceso por roles |
| Correo transaccional | Brevo para recuperación de contraseña |
| Calidad | Vitest, Node.js Test Runner, GitHub Actions y Playwright/Chromium |
| Alojamiento | Render para el frontend y la API |

El backend centraliza la validación de solicitudes y los permisos. Las operaciones que coordinan pedidos e inventario utilizan transacciones de MongoDB; para probar ese flujo localmente se requiere MongoDB Atlas o una instancia compatible con replica set.

## Catálogo de muestra

El catálogo incluye **66 productos distribuidos en 22 categorías**. Estos registros sirven para recorrer la experiencia y probar la gestión de productos; no representan ofertas, existencias ni compromisos comerciales reales. La aplicación prioriza el catálogo de la API y dispone de datos locales de respaldo cuando corresponde.

Consulta [docs/DEMO-CATALOG.md](docs/DEMO-CATALOG.md) para conocer el origen de los datos y las condiciones del script de carga. Ese script está restringido a bases aisladas de prueba y no debe ejecutarse contra la base de datos de los servicios publicados.

## Pedidos y pagos

El checkout actual utiliza **ElectroVibe Pay** como interfaz propia para registrar y confirmar la solicitud del pedido. La modalidad vigente es **Pago pendiente de coordinación**: no se solicitan datos de tarjeta o credenciales bancarias, no se inicia una operación financiera y no se recibe dinero.

Los pedidos se guardan con `paymentStatus: PENDING` y `paymentConfirmed: false`. El administrador puede gestionar las etapas logísticas sin que eso signifique que el pago haya sido recibido o confirmado. Las fechas solicitadas por el cliente tampoco constituyen una promesa de despacho.

El checkout se limita al registro del pedido y a su revisión manual dentro de ElectroVibeHome. El administrador debe comprobar el pago por el canal que corresponda antes de aprobar la preparación. No se conecta con pasarelas externas, no solicita datos bancarios y no realiza cobros ni transferencias.

## Configuración local

### Requisitos

- Node.js **24.x** y npm.
- Una instancia de MongoDB accesible. Para probar pedidos y movimientos de inventario debe admitir transacciones (por ejemplo, MongoDB Atlas o un replica set local).
- Git.

### 1. Clonar e instalar el frontend

```bash
git clone https://github.com/sro2005/ElectroVibeHome.git
cd ElectroVibeHome
npm ci
```

Crea el archivo local de variables de Vite a partir de `.env.example`:

```powershell
Copy-Item .env.example .env.development
```

En macOS o Linux, utiliza `cp .env.example .env.development`. Verifica que `.env.development` contenga la URL base de la API local, sin añadir `/api` al final:

```dotenv
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 2. Configurar e iniciar el backend

En otra terminal:

```bash
cd backend
npm ci
```

Copia `backend/.env.example` como `backend/.env.development` (PowerShell: `Copy-Item .env.example .env.development`; macOS/Linux: `cp .env.example .env.development`). Ajusta como mínimo estas variables para desarrollo local:

```dotenv
NODE_ENV=development
PORT=5000
MONGO_URI=URI_DE_TU_BASE_DE_DATOS
JWT_SECRET=SECRETO_LOCAL_LARGO_Y_UNICO
ALLOWED_ORIGINS=http://localhost:3000
```

No reutilices secretos de producción. Mantén `MONGO_URI` y `JWT_SECRET` fuera del repositorio. El archivo `.gitignore` excluye los archivos `.env` y `.env.development`.

Para probar el envío de recuperación de contraseña, configura también `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y `BREVO_SENDER_NAME` con un remitente autorizado en Brevo y define `FRONTEND_URL` con una dirección HTTPS accesible que pueda abrir el enlace de restablecimiento. No es necesario configurar correo para ejecutar la aplicación básica.

Inicia el backend desde la carpeta `backend`:

```bash
npm run dev
```

La API queda disponible por defecto en `http://localhost:5000`; el endpoint `/health` informa el estado de la API y la conexión con MongoDB.

### 3. Iniciar el frontend

Desde la raíz del repositorio, en una tercera terminal:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000/). Comprueba que el backend esté activo y que `REACT_APP_API_BASE_URL` apunte a él.

## Pruebas y compilación

Desde la raíz del repositorio:

```bash
npm test
npm run build
npm run preview
```

Desde `backend/`, para ejecutar las pruebas del backend:

```bash
npm test
```

`npm run preview` sirve localmente la compilación de producción y debe ejecutarse después de `npm run build`. La integración continua ejecuta además pruebas HTTP de extremo a extremo con una instancia MongoDB desechable, comprobaciones del servicio publicado y pruebas responsive con Chromium.

## Aprovisionamiento de administración

El script `backend/scripts/provisionAdmin.js` está reservado para crear de forma controlada una cuenta administradora cuando corresponda. No se ejecuta durante el despliegue ni forma parte de las comprobaciones normales. Antes de utilizarlo, revisa sus instrucciones, confirma la base de datos de destino y evita operar sobre una base distinta de la autorizada.

## Integración continua y estado de validación

El workflow [ElectroVibeHome CI](.github/workflows/ci.yml) valida los cambios relevantes en `electrovibehome-stable` y en las solicitudes de integración. Incluye instalación limpia desde lockfiles, auditoría de dependencias, pruebas y compilación del frontend, revisión sintáctica y pruebas unitarias del backend, pruebas E2E con MongoDB aislado, smoke tests del sitio/API publicados y navegación responsive.

La última ejecución posterior a la limpieza del repositorio, [CI #41001693723](https://github.com/sro2005/ElectroVibeHome/actions/runs/41001693723), terminó el **29 de octubre de 2026 (hora de Colombia)** con **5/5 trabajos aprobados**. Los controles de auditoría configurados no detectaron vulnerabilidades altas o críticas que bloquearan esa ejecución. El resultado automatizado no sustituye las pruebas manuales de cada operación con cuentas reales.

Consulta la [lista de verificación de la versión estable](docs/RELEASE-CHECKLIST.md) para el alcance de las pruebas, los límites conocidos y las validaciones manuales. El resumen de dependencias está en [docs/DEPENDENCY-AUDIT.md](docs/DEPENDENCY-AUDIT.md).

---

Repositorio: https://github.com/sro2005/ElectroVibeHome