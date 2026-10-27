# ElectroVibeHome — lista de verificación de la versión estable

**Alcance:** rama `electrovibehome-stable`. La rama `main` conserva la versión original y no fue modificada en esta validación. ElectroVibeHome mantiene el modo de compra simulado; no se procesan pagos reales. En las pruebas automatizadas de esta revisión no se crearon pedidos, no se modificó inventario ni se realizaron pagos en la base de datos viva. La comprobación manual de recuperación/restablecimiento de contraseña realizada con una cuenta cliente está registrada más abajo.

## Validación de actualización de dependencias — 27 de octubre de 2026

- Ejecución de GitHub Actions: [CI #516 — actualización de dependencias](https://github.com/sro2005/ElectroVibeHome/actions/runs/40595370695).
- Commit validado: `76b5dfeb3f8025c6ccb9181afa9a905ea41c27ae`.
- Resultado: **5/5 trabajos correctos**: frontend, backend, backend E2E, smoke del sitio/API publicados y navegador responsive.
- Se refrescaron únicamente `package-lock.json` y `backend/package-lock.json` con las versiones más recientes permitidas por los rangos actuales; no se modificaron los manifiestos `package.json` ni la lógica funcional.
- Dependencias directas actualizadas: Axios `1.20.0 → 1.21.0`, React Router / react-router-dom `7.18.4 → 7.18.5`, Mongoose `8.24.6 → 8.24.7` y Nodemailer `10.2.0 → 10.2.1`. También se actualizaron dependencias transitivas compatibles.
- Las auditorías `npm audit --audit-level=high` pasaron en frontend y backend; ambos informes reportaron **cero vulnerabilidades conocidas** en los árboles instalados.
- Validación automatizada: pruebas frontend, build frontend, sintaxis JavaScript backend, pruebas unitarias backend y E2E HTTP contra MongoDB desechable pasaron. El smoke del sitio/API comprobó salud de la API, conexión MongoDB, CORS, rutas protegidas y catálogo publicado; Playwright pasó en escritorio, tableta y móvil.
- Capturas responsive: [artefacto de screenshots del CI #516](https://github.com/sro2005/ElectroVibeHome/actions/runs/40595370695/artifacts/12776021447). Informes de auditoría: [frontend](https://github.com/sro2005/ElectroVibeHome/actions/runs/40595370695/artifacts/12775678570) y [backend](https://github.com/sro2005/ElectroVibeHome/actions/runs/40595370695/artifacts/12775777492).
- Tras superar CI, los lockfiles actualizados se desplegaron en Render desde el commit `76b5dfeb`: frontend `dep-dbgie2p42hec73f688m0` y API `dep-dbgidv4s728c73e6ndl0`. Ambos despliegues terminaron en estado `live`.
- `main` permanece intacta. Las actualizaciones mayores no se incorporaron automáticamente; requieren una evaluación de compatibilidad y sus propias pruebas antes de adoptarse.

## Validaciones automatizadas completadas

### Backend y datos — MongoDB de prueba aislado

- [x] Registro y login de cliente; el registro público no concede rol de administrador.
- [x] Perfil y actualización de campos permitidos; se rechazan cambios no autorizados de perfil, rol o contraseña.
- [x] Las respuestas de perfil/login no exponen hashes de contraseña ni campos de recuperación.
- [x] Cálculo del total del pedido a partir de precios del servidor.
- [x] El inventario disminuye una sola vez al crear una orden; no se crea una segunda orden ante stock insuficiente.
- [x] Reintentos idempotentes y solicitudes concurrentes no duplican pedidos ni permiten sobreventa.
- [x] El historial de un cliente no muestra pedidos de otro usuario.
- [x] El ciclo de recuperación de contraseña acepta un token válido, rechaza su reutilización y rechaza un token vencido; estas pruebas usan fixtures y una base desechable.
- [x] La suite E2E prueba notificaciones de pago simuladas: firma inválida no cambia estado; aprobación y rechazo funcionan en los fixtures; eventos repetidos no duplican movimientos de inventario.
- [x] El modo de compra demostrativo crea una orden marcada como simulada con datos de la base desechable, sin requerir credenciales de una pasarela.

### Backend en el servicio publicado — solo lectura

- [x] `/health` responde correctamente y reporta MongoDB conectado.
- [x] El frontend público cargado y el bundle compilado apuntan a la URL actual de la API.
- [x] CORS permite el dominio frontend publicado y no concede permiso a un origen no aprobado.
- [x] Las rutas protegidas comprobadas rechazan solicitudes sin token o con token inválido; los payloads incompletos de registro/login son rechazados.
- [x] Está presente la cabecera de seguridad `X-Content-Type-Options: nosniff`.
- [x] La API publica 66 fichas de muestra en 22 categorías; el smoke test verificó que están marcadas como datos de demostración, con precio e inventario positivos y sin nombres duplicados por categoría.

### Frontend publicado — Playwright/Chromium

- [x] Portada responsive en 1440, 1024, 768, 390 y 320 px sin desbordamiento horizontal detectado.
- [x] Catálogo con 66 productos, filtro por categoría, búsqueda, estado vacío y recuperación mediante «Limpiar filtros».
- [x] Rutas públicas de registro, login, recuperación, restablecimiento, catálogo, acerca de, privacidad y términos responden correctamente y pasan la comprobación de ancho móvil.
- [x] Validación de formularios bloquea registro vacío, email mal formado, recuperación sin email y contraseña de restablecimiento débil; el test confirma que no se enviaron solicitudes mutativas.
- [x] La guía ElectroVibe apareció disponible y su interacción local de ejemplo no llamó al endpoint de chat de pago.
- [x] Pantallas principales de administración y cliente recorridas en escritorio y móvil: panel, inventario, alta de producto, clientes, pedidos, seguridad, home, catálogo, formulario de pedido, historial, perfil y resultado informativo de pago.
- [x] Se verificaron filtros, edición simulada de inventario, cancelación del diálogo de eliminación, validación de producto vacío, estado logístico de pedido en fixtures, validación de perfil/contraseña y redirección de un rol cliente fuera de una ruta administrativa.
- [x] El formulario de pedido se llevó hasta la confirmación y se volvió a editar/cancelar; el test comprobó que no se envió ningún POST para crear una orden en el backend publicado.
- [x] No se detectaron errores JavaScript durante las pruebas de navegador.
- [x] Las llamadas de los módulos autenticados se interceptaron con fixtures locales de Playwright: esas pruebas validan la UI y las interacciones, no modifican cuentas, productos ni pedidos de la base viva.

Las capturas de las pruebas responsive y de los módulos están disponibles en el [artefacto de screenshots de la ejecución más reciente](https://github.com/sro2005/ElectroVibeHome/actions/runs/40590623401/artifacts/12774216283).

### Comprobaciones manuales confirmadas

- [x] El usuario confirmó que probó solicitud de recuperación, recepción de correo y cambio de contraseña con una cuenta cliente y su buzón (27 de octubre de 2026).

## Verificaciones complementarias realizadas y límites de alcance

Los puntos marcados con `[x]` se completaron en los entornos indicados. Estos controles no son fallos de CI, pero sí delimitan el alcance: la UI autenticada se probó con fixtures, los endpoints administrativos con una base desechable y los pagos reales permanecen deshabilitados.

- [x] Prueba autenticada real del backend publicado (27-oct-2026): API saludable y MongoDB conectado; registro HTTP 201; inicio de sesión HTTP 200; perfil HTTP 200; historial propio HTTP 200; intentos de acceder a directorios de administración bloqueados con HTTP 403. No se crearon pedidos ni se llamaron pasarelas de pago. Se eliminó la cuenta sintética y su registro de inicio de sesión de MongoDB, y se comprobó que ya no existen.
- [x] Aceptación funcional del panel administrativo en CI con datos descartables (run [40590252750](https://github.com/sro2005/ElectroVibeHome/actions/runs/40590252750)): un administrador sintético pudo consultar clientes/pedidos, crear/editar/eliminar un producto sin referencias y cambiar un pedido simulado de Procesando a Enviado y Entregado. Los datos vivieron solo en MongoDB desechable de CI.
- [x] Escaneo Gitleaks histórico (27-oct-2026): detectó dos certificados TLS locales heredados (`localhost-key.pem` y `backend/localhost-key.pem`) en el commit `e4cf25e02f6777881770e8a98643ccf013028f1a`. Se decidió conservar el historial y no reescribir ramas; se retiró el workflow de escaneo repetitivo porque volvería a señalar este mismo hallazgo conocido.
- [x] Evidencia visual final revisada en capturas de escritorio (1440 px) y móvil (390 px); la prueba Playwright valida desbordamiento, pantallas de administración/cliente, catálogo y formularios. Artefacto de capturas del run [40590252750](https://github.com/sro2005/ElectroVibeHome/actions/runs/40590252750/artifacts). Esto es una revisión visual general, no una auditoría pixel a pixel de cada estado.

## Verificación adicional — 27 de octubre de 2026

- [x] La aceptación autenticada se ejecutó contra el backend publicado en el run [40578235519](https://github.com/sro2005/ElectroVibeHome/actions/runs/40578235519): salud HTTP 200; registro HTTP 201; login y perfil HTTP 200; `/api/customers/all` y `/api/orders/all` rechazaron el token de cliente con HTTP 403; historial de pedidos propio HTTP 200 y vacío.
- [x] La respuesta de login y perfil no expuso contraseña ni campos de restablecimiento. No se creó ningún pedido ni se inició ningún pago.
- [x] Se eliminaron y verificaron ausentes tanto la cuenta sintética de aceptación como su registro en `loginlogs`.
- [x] El escaneo histórico [detectó dos claves PEM](https://github.com/sro2005/ElectroVibeHome/actions/runs/40578235519). Los dos archivos tienen el mismo contenido y proceden del commit `e4cf25e02f6777881770e8a98643ccf013028f1a` (24-feb-2025): certificados locales `localhost`, usados por el código de desarrollo fuera de producción. No son credenciales de MongoDB, Brevo ni Wompi y no deben reutilizarse. `.gitignore` de `electrovibehome-stable` ignora `*.pem` y `*.key`; en `main` no se añadieron reglas para respetar la versión antigua.
- [x] Decisión (27-oct-2026): conservar el historial existente, no reescribir `electrovibehome-stable` y dejar `main` intacta. La versión actual de stable no contiene los PEM y `.gitignore` impide añadirlos de nuevo. El hallazgo se limita a certificados TLS locales heredados; no se identificaron como credenciales de MongoDB, Brevo ni pagos. No reutilizarlos. No se necesita cambiar protecciones de ramas ni pausar/reanudar Render.
- [x] La suite de navegador comprobó el flujo de cierre de sesión con fixtures locales: cancelar conserva la sesión y confirmar elimina `authToken`, `userData` y `userId`. La UI autenticada usa respuestas simuladas para no tocar datos de producción; los endpoints administrativos se aceptan por separado contra MongoDB desechable en CI. La UI no se probó con una sesión admin real contra la base de producción, deliberadamente, para no modificar registros vivos.

## Pagos — en pausa

No se habilitaron pagos reales. La suite prueba lógica y firmas de Wompi con secretos y datos de prueba dentro de un entorno aislado; **eso no equivale a haber probado una transacción real en la cuenta Sandbox del proveedor**.

Solo si se decide reactivar una pasarela:
- [ ] Elegir proveedor (Wompi Sandbox, investigar Mercado Pago o conservar la simulación).
- [ ] Configurar únicamente credenciales Sandbox, webhook de pruebas y URLs correctas.
- [ ] Probar aprobado, rechazado, pendiente, eventos duplicados y tardíos desde el proveedor de pruebas; verificar pedido, importe, referencia, moneda y reserva/restauración de inventario.
- [ ] No considerar una redirección del navegador como confirmación definitiva del pago.

## Estado de ramas y despliegues

- [x] `main` permanece en su commit original y protegida.
- [x] `electrovibehome-stable` está protegida contra eliminación y `force push`.
- [x] Frontend Render está publicado desde el commit validado de la rama estable.
- [x] No se modificaron secretos, variables reales de Render, datos de la base viva ni configuración del backend.
- [x] Wompi/Mercado Pago siguen en pausa; no se realizaron pagos reales.

## Enlaces

- [Repositorio ElectroVibeHome](https://github.com/sro2005/ElectroVibeHome)
- [Frontend publicado](https://electrovibehome.onrender.com/)
- [API publicada](https://electrovibehome-v2-api.onrender.com)
- [CI final — 40590623401 (5/5 trabajos correctos)](https://github.com/sro2005/ElectroVibeHome/actions/runs/40590623401)
- [Capturas responsive y módulos — ejecución final](https://github.com/sro2005/ElectroVibeHome/actions/runs/40590623401/artifacts/12774216283)
- [CI de autenticación real y escaneo histórico único](https://github.com/sro2005/ElectroVibeHome/actions/runs/40578235519)
- [Despliegue frontend en Render](https://dashboard.render.com/static/srv-dbg1n0psrm7s73c8gom0)
- [Variables de ejemplo del backend](../backend/.env.example)
