# ElectroVibeHome — checklist de publicación segura

## Antes de publicar
- [ ] Confirmar que el workflow de CI de esta rama termina en verde; revisar el build de producción del frontend y la sintaxis del backend.
- [ ] Añadir y ejecutar pruebas automatizadas reales de pedidos, inventario, permisos, recuperación y webhooks antes de aprobar la publicación.
- [ ] Confirmar que `FRONTEND_URL` y `ALLOWED_ORIGINS` contienen el dominio HTTPS real.
- [ ] Configurar `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` en el hosting; nunca en el frontend ni en Git.
- [ ] Empezar con credenciales Sandbox de Wompi (prefijos de prueba). No aceptar pagos reales hasta completar pruebas.
- [ ] Configurar en el dashboard Sandbox de Wompi la URL de eventos: `https://<dominio-api>/api/orders/wompi/webhook`.
- [ ] Confirmar que la API y MongoDB están conectados en el entorno de pruebas.
- [ ] Probar recuperación de contraseña con un buzón real y verificar vencimiento y uso único del enlace.
- [ ] Probar un pago aprobado, rechazado y pendiente; confirmar pedido, importe, stock y webhooks.
- [ ] Definir y probar una reconciliación segura de pedidos pendientes abandonados. Hoy no se debe liberar automáticamente el inventario de un pedido con referencia Wompi sin verificar el resultado real de la transacción.
- [ ] Verificar que un usuario no puede leer o pagar pedidos ajenos.
- [ ] Verificar que respuestas de perfil/listado nunca incluyen hashes de contraseña ni campos de recuperación.
- [ ] Verificar que los webhooks duplicados no duplican la devolución de inventario y que no se pueden borrar pedidos con pagos en curso o historial terminal.
- [ ] Revisar que no hay certificados privados, contraseñas SMTP, secretos JWT ni claves Wompi en el repositorio.
- [ ] Hacer despliegue gradual solo después de aprobar pruebas y revisar el estado de la rama.

## Flujo de pago
1. El backend valida los productos y calcula el importe con precios de MongoDB.
2. El pedido se asocia al usuario autenticado y se genera una referencia de pago única.
3. El backend genera la firma de integridad y entrega el enlace del checkout oficial de Wompi.
4. La redirección de vuelta solo informa al cliente; nunca confirma por sí sola un pago.
5. El webhook verifica el checksum del evento, referencia, importe y moneda antes de marcar el pedido como pagado.

## Variables necesarias en el backend
Usa `backend/.env.example` como lista de referencia. Las credenciales reales se configuran solo en el panel seguro del hosting. Mantén Sandbox y Producción separados, con URLs de eventos distintas.
