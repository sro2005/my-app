# ElectroVibeHome — lista de verificación de la versión estable

**Alcance:** `electrovibehome-stable`; conservar `main` intacta. Proyecto demostrativo sin ventas ni pagos reales.

## Comprobaciones ya respaldadas

- [x] CI: ejecución 493 del 27 de octubre de 2026 finalizada con cinco trabajos correctos (backend, frontend, backend E2E aislado, smoke publicado, navegador responsive).
- [x] Frontend y backend de la rama estable desplegados con estado `live` en Render para el commit `0205d6b859b516c1c3242df3a259cc0b0ffa1417` (verificado el 27 de octubre de 2026).
- [x] API y MongoDB listos en la comprobación automatizada de salud.
- [x] CORS, rechazo de rutas protegidas sin autenticación y revisión del catálogo de demostración comprobados por el smoke test.
- [x] Reglas de GitHub activas contra la eliminación y los pushes forzados en `main` y `electrovibehome-stable`.
- [x] Solicitud, recepción del mensaje y cambio de contraseña probados manualmente con una cuenta de cliente y acceso al buzón (confirmación del usuario, 27 de octubre de 2026).

Los resultados anteriores reflejan las pruebas mencionadas: **no certifican todos los flujos funcionales ni todas las condiciones de seguridad**.

## Validación funcional pendiente

- [ ] Cliente: registro, inicio/cierre de sesión, perfil, carrito, formulario de pedido, validación de campos e historial.
- [ ] Administración: permisos y restricciones de roles, gestión de productos, inventario, clientes y pedidos.
- [ ] Casos negativos: datos incorrectos, acceso a pedidos de otros usuarios, intentos sin sesión, controles de validación y mensajes de error.
- [ ] Recuperación: verificar explícitamente la caducidad, el uso único del enlace y el rechazo de tokens inválidos.
- [ ] Confirmar que los datos sensibles (hashes de contraseña, tokens de recuperación) no aparecen en respuestas de API.
- [ ] Revisar la experiencia visual en móvil/tableta/escritorio: encabezado, favicon, formularios, botones, modales, navegación y mensajes de confirmación.
- [ ] Confirmar configuración HTTPS, orígenes permitidos y manejo seguro de secretos sin publicar valores.
- [ ] Revisar que las cuentas administradoras no puedan realizar acciones de compra propias de clientes, de acuerdo con los requisitos de la demostración.

## Pagos: en pausa, no bloquean la validación del resto del proyecto

- [ ] Decidir si se conserva Wompi Sandbox, se investiga Mercado Pago o se presenta únicamente una simulación sin transacciones reales.
- [ ] Si se reactiva un proveedor, utilizar exclusivamente credenciales y notificaciones de entorno de pruebas.
- [ ] Validar con casos aislados los estados aprobado, rechazado, pendiente, duplicados y fallos de webhook; comprobar pedido, importe, referencia e inventario.
- [ ] Confirmar que ningún retorno del navegador marca unilateralmente un pedido como pagado.
- [ ] Definir reconciliación de pedidos pendientes abandonados sin liberar inventario hasta verificar con seguridad el estado del pago.
- [ ] Probar que un usuario no puede leer ni pagar pedidos de otra cuenta.
- [ ] Validar que notificaciones duplicadas no duplican movimientos de inventario y que no se alteran pedidos con pagos activos o finalizados.

**No configurar claves de producción ni realizar pagos reales para completar esta demostración.** Los valores Wompi presentes como ejemplo en archivos de entorno no indican que el proveedor esté habilitado.

## Antes de declarar terminada la revisión

- [ ] Resolver problemas detectados y volver a ejecutar el CI sobre `electrovibehome-stable`.
- [ ] Confirmar que los servicios Render siguen saludables y usan la rama esperada.
- [ ] Documentar evidencia y resultado de cada validación funcional.
- [ ] Mantener `main` sin modificaciones y evitar cambios de configuración o despliegues innecesarios.

## Referencias

- [Repositorio](https://github.com/sro2005/ElectroVibeHome)
- [Frontend estable](https://electrovibehome.onrender.com/)
- [API estable](https://electrovibehome-v2-api.onrender.com)
- [GitHub Actions — ejecución 493](https://github.com/sro2005/ElectroVibeHome/actions/runs/40566521064)
- [Variables de ejemplo del backend](../backend/.env.example) — verificar las direcciones heredadas antes de copiarlas.
