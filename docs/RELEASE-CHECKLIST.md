# ElectroVibeHome — checklist de publicación segura

## Antes de publicar
- [ ] Ejecutar el workflow de CI: compilación del frontend y validaciones del backend.
- [ ] Confirmar que `FRONTEND_URL` y `ALLOWED_ORIGINS` contienen el dominio HTTPS real.
- [ ] Configurar `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` en el hosting; nunca en el frontend ni en Git.
- [ ] Empezar con credenciales Sandbox de Wompi (prefijos de prueba). No aceptar pagos reales hasta completar pruebas.
- [ ] Configurar en el dashboard Sandbox de Wompi la URL de eventos: `https://<dominio-api>/api/orders/wompi/webhook`.
- [ ] Confirmar que la API y MongoDB están conectados en el entorno de pruebas.
- [ ] Probar recuperación de contraseña con un buzón real y verificar vencimiento y uso único del enlace.
- [ ] Probar un pago aprobado, rechazado y pendiente; confirmar pedido, importe, stock y webhooks.
- [ ] Verificar que un usuario no puede leer o pagar pedidos ajenos.
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
