# ElectroVibeHome

Tienda web de electrodomésticos construida con React, Vite, Node.js, Express y MongoDB.

## Requisitos

- Node.js 24.x
- npm compatible con Node 24
- Una base de datos MongoDB para ejecutar el backend
- Variables de entorno configuradas; nunca publiques credenciales reales en Git

## Frontend

Desde la raíz del repositorio:

```bash
npm ci
cp .env.example .env.development
npm run dev
```

Vite inicia el frontend en `http://localhost:3000`. Configura `REACT_APP_API_BASE_URL` en el archivo de entorno con la URL base del backend (sin añadir `/api` al final).

Comandos de validación:

```bash
npm test
npm run build
npm run preview
```

## Backend

Desde otra terminal:

```bash
cd backend
npm ci
npm start
```

Configura las variables indicadas en [backend/.env.example](backend/.env.example) en el entorno local o en el panel de tu proveedor de hosting. En producción se deben usar variables del proveedor, no archivos con secretos dentro del repositorio.

El backend expone `/health` para comprobar si la API está funcionando y si MongoDB está conectado.

## Guía ElectroVibe (opcional)

El catálogo incluye una guía conversacional que usa productos disponibles para orientar la elección. No crea pedidos, no procesa pagos ni consulta datos de cuenta.

Para habilitarla, configura `OPENAI_API_KEY` en el entorno del backend y, opcionalmente, `OPENAI_MODEL` (por defecto `gpt-4.1-mini`). Nunca pongas la clave en variables del frontend ni en Git. Sin una clave, la interfaz informa que la guía todavía no está configurada.

La integración limita el tamaño de la conversación y la respuesta, envía hasta 20 productos disponibles y establece `store: false` en la solicitud. Los mensajes se mantienen solo en el estado de la página y no se guardan en ElectroVibeHome. Las llamadas a la API tienen facturación independiente de una suscripción de ChatGPT; revisa el [precio actual de la API](https://developers.openai.com/api/docs/pricing) y configura el presupuesto de uso de tu proyecto antes de habilitarla.

## Pagos

El checkout se integra con Wompi. Para pruebas utiliza únicamente credenciales y configuración de **Sandbox**. La página de redirección no confirma un pago; el estado definitivo debe proceder del webhook validado por el backend.

Los flujos de devolución de inventario usan transacciones MongoDB. El entorno de base de datos debe admitir transacciones, como MongoDB Atlas configurado como replica set.

## CI y cambios de seguridad

La rama `security/electrovibehome-hardening` ejecuta las pruebas del frontend, compilación, auditoría de dependencias y pruebas del backend. Los cambios de esta rama no se consideran desplegados en producción hasta que sean revisados, probados y aprobados explícitamente.

Repositorio: https://github.com/sro2005/my-app
