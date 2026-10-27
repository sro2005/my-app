# ElectroVibeHome

Tienda web de electrodomésticos construida con React, Vite, Node.js, Express y MongoDB. Este repositorio corresponde a un proyecto personal de demostración; no está habilitado para ventas ni pagos reales.

## Ramas y despliegue

- `electrovibehome-stable`: rama predeterminada y versión renovada que se mantiene y valida.
- `main`: versión original conservada por separado; no modificarla al trabajar en la versión estable.
- Frontend publicado: https://electrovibehome.onrender.com/
- API de la versión estable: https://electrovibehome-v2-api.onrender.com
- El frontend y la API de la versión estable se despliegan desde `electrovibehome-stable`.
- Ambas ramas tienen reglas contra eliminación y pushes forzados. Estas reglas no impiden los pushes normales ni exigen pull requests.

Los nombres heredados que puedan permanecer en URLs de servicios o en código no implican la existencia de una tercera rama o una versión distinta.

## Requisitos

- Node.js 24.x y npm compatible.
- MongoDB configurado para el backend.
- Variables de entorno locales o del proveedor de alojamiento; no publicar credenciales en Git.

## Frontend

Desde la raíz del repositorio:

```bash
npm ci
cp .env.example .env.development
npm run dev
```

Vite inicia el frontend en `http://localhost:3000`. Configura `REACT_APP_API_BASE_URL` con la URL base del backend, sin añadir `/api` al final.

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

Consulta [backend/.env.example](backend/.env.example) como referencia de variables y contrasta los valores de ejemplo con las URLs actuales indicadas arriba antes de utilizarlos. Configura los secretos exclusivamente en el entorno autorizado. La API expone `/health` para comprobar su estado y la conexión a MongoDB.

### Acceso de administración

El registro público crea cuentas de cliente, no administradores. El script interno `backend/scripts/provisionAdmin.js` está destinado únicamente al aprovisionamiento controlado de una cuenta administradora cuando no exista; **no debe ejecutarse como parte de las verificaciones normales ni para restablecer una cuenta existente**.

Antes de cualquier aprovisionamiento, comprueba la base de datos y el servicio de destino de la versión estable, manteniéndolos separados de `main`. Consulta el código y las instrucciones del script, utiliza secretos temporales fuera de Git y retíralos al terminar. El script no se ejecuta automáticamente durante el despliegue.

### Recuperación de contraseña

La recuperación utiliza correo transaccional mediante Brevo en el backend. El flujo de solicitud, recepción del correo y cambio de contraseña fue probado satisfactoriamente con una cuenta de cliente y un buzón accesible (confirmación manual del 27 de octubre de 2026). Las pruebas de caducidad, uso único y otras condiciones negativas del enlace deben registrarse de forma independiente; no se consideran cubiertas por esa comprobación manual.

## Guía ElectroVibe (opcional)

El catálogo dispone de una guía conversacional para orientar sobre productos. No crea pedidos ni gestiona pagos o información privada de cuentas.

Para habilitarla se requiere `OPENAI_API_KEY` en el backend y opcionalmente `OPENAI_MODEL`. Su uso de API puede generar costos independientes de ChatGPT. Sin una clave, la guía no queda operativa. Nunca coloques claves en variables públicas del frontend o en el repositorio.

## Pedidos y pagos

ElectroVibeHome es una demostración. La integración con Wompi existe en el código, pero **su activación está en pausa**: no hay credenciales de Sandbox listas en el entorno revisado, y no se autorizan pagos reales. Mercado Pago se ha considerado como alternativa, pero no está implementado ni validado como nuevo proveedor.

No interpretar una redirección del navegador como confirmación de pago. Antes de reactivar cualquier proveedor deben verificarse las credenciales de pruebas, la firma o autenticidad de las notificaciones, los estados de pedidos y la devolución segura de inventario. Las operaciones transaccionales de inventario requieren MongoDB con soporte de transacciones.

## CI y validación

[ElectroVibeHome CI](.github/workflows/ci.yml) se ejecuta para los cambios relevantes de `electrovibehome-stable` y admite ejecución manual. Comprueba, según el trabajo, pruebas unitarias, compilación, auditoría de dependencias, sintaxis backend, pruebas HTTP aisladas con MongoDB temporal, salud de API/CORS/catálogo publicado y navegación responsive mediante Chromium.

La [ejecución 493](https://github.com/sro2005/ElectroVibeHome/actions/runs/40566521064) del 27 de octubre de 2026 terminó correctamente con cinco trabajos. Esto no equivale a una validación manual completa de todos los flujos de compra y administración.

Consulta [la lista de validación pendiente](docs/RELEASE-CHECKLIST.md) para las comprobaciones que todavía requieren evidencia.

Repositorio: https://github.com/sro2005/ElectroVibeHome
