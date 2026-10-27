# ElectroVibeHome — lista de verificación de la versión estable

**Alcance:** rama `electrovibehome-stable`. La rama `main` conserva la versión original y no fue modificada en esta validación. ElectroVibeHome sigue siendo una demostración: no se realizaron pedidos, cambios de inventario, cambios de contraseñas ni pagos en la base de datos viva.

## Validación más reciente

- Ejecución de GitHub Actions: [CI #500, intento 2](https://github.com/sro2005/ElectroVibeHome/actions/runs/40570994624).
- Commit validado: `b969b4d1003c4bd675ef31c09fa4123d6b89c63a`.
- Resultado: **5/5 trabajos correctos** (frontend, backend, backend E2E, comprobación live y navegador).
- Frontend Render actualizado: despliegue `dep-dbgg24m7bikc73bfr6fg`, estado `live`, desde `electrovibehome-stable`.
- Backend Render: sigue activo. En esta tanda no cambió el código de ejecución del backend; las modificaciones allí fueron de documentación/configuración de ejemplo. La comprobación live confirmó que la API y MongoDB estaban listos.

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

Las capturas de las pruebas responsive y de los módulos están disponibles en el [artefacto de screenshots de CI](https://github.com/sro2005/ElectroVibeHome/actions/runs/40570994624/artifacts/12766436535).

### Comprobaciones manuales confirmadas

- [x] El usuario confirmó que probó solicitud de recuperación, recepción de correo y cambio de contraseña con una cuenta cliente y su buzón (27 de octubre de 2026).

## Pendiente antes de declarar la aceptación funcional completa

Estas pruebas no se han presentado como completadas porque requieren un entorno/cuenta de prueba separado o evidencia que no se obtiene de un test unitario:

- [x] Prueba autenticada real del backend publicado (27-oct-2026): API saludable y MongoDB conectado; registro HTTP 201; inicio de sesión HTTP 200; perfil HTTP 200; historial propio HTTP 200; intentos de acceder a directorios de administración bloqueados con HTTP 403. No se crearon pedidos ni se llamaron pasarelas de pago. Se eliminó la cuenta sintética y su registro de inicio de sesión de MongoDB, y se comprobó que ya no existen.
- [ ] Validar manualmente el panel de administración con una cuenta y datos descartables (gestión real de productos/clientes/pedidos), evitando modificar inventario o registros reales.
- [x] Escaneo Gitleaks histórico (27-oct-2026): detectó dos certificados TLS locales heredados (`localhost-key.pem` y `backend/localhost-key.pem`) en el commit `e4cf25e02f6777881770e8a98643ccf013028f1a`. Se decidió conservar el historial y no reescribir ramas; se retiró el workflow de escaneo repetitivo porque volvería a señalar este mismo hallazgo conocido.
- [ ] Conservar evidencia manual de aceptación visual final. La automatización comprobó responsividad y las capturas principales se revisaron, pero no constituye una auditoría pixel a pixel de todos los estados de todas las pantallas.

## Verificación adicional — 27 de octubre de 2026

- [x] La aceptación autenticada se ejecutó contra el backend publicado en el run [40578235519](https://github.com/sro2005/ElectroVibeHome/actions/runs/40578235519): salud HTTP 200; registro HTTP 201; login y perfil HTTP 200; `/api/customers/all` y `/api/orders/all` rechazaron el token de cliente con HTTP 403; historial de pedidos propio HTTP 200 y vacío.
- [x] La respuesta de login y perfil no expuso contraseña ni campos de restablecimiento. No se creó ningún pedido ni se inició ningún pago.
- [x] Se eliminaron y verificaron ausentes tanto la cuenta sintética de aceptación como su registro en `loginlogs`.
- [x] El escaneo histórico [detectó dos claves PEM](https://github.com/sro2005/ElectroVibeHome/actions/runs/40578235519). Los dos archivos tienen el mismo contenido y proceden del commit `e4cf25e02f6777881770e8a98643ccf013028f1a` (24-feb-2025): certificados locales `localhost`, usados por el código de desarrollo fuera de producción. No son credenciales de MongoDB, Brevo ni Wompi y no deben reutilizarse. `.gitignore` de `electrovibehome-stable` ignora `*.pem` y `*.key`; en `main` no se añadieron reglas para respetar la versión antigua.
- [x] Decisión (27-oct-2026): conservar el historial existente, no reescribir `electrovibehome-stable` y dejar `main` intacta. La versión actual de stable no contiene los PEM y `.gitignore` impide añadirlos de nuevo. El hallazgo se limita a certificados TLS locales heredados; no se identificaron como credenciales de MongoDB, Brevo ni pagos. No reutilizarlos. No se necesita cambiar protecciones de ramas ni pausar/reanudar Render.
- [ ] La prueba cubrió los endpoints de autenticación y autorización reales; no equivale a validar toda la interfaz frontend con una sesión real ni incluye edición de perfil, logout por UI o una aceptación autenticada real del panel administrador.

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
- [CI #500 — intento 2](https://github.com/sro2005/ElectroVibeHome/actions/runs/40570994624)
- [CI de autenticación real y escaneo histórico único](https://github.com/sro2005/ElectroVibeHome/actions/runs/40578235519)
- [Despliegue frontend en Render](https://dashboard.render.com/static/srv-dbg1n0psrm7s73c8gom0)
- [Variables de ejemplo del backend](../backend/.env.example)
