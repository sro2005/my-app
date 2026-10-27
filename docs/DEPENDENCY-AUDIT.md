# Auditoría de dependencias y estado de verificación — ElectroVibeHome

## Estado comprobado (27 de octubre de 2026)

La [ejecución 493 de ElectroVibeHome CI](https://github.com/sro2005/ElectroVibeHome/actions/runs/40566521064), correspondiente al commit `0205d6b859b516c1c3242df3a259cc0b0ffa1417` de `electrovibehome-stable`, terminó con cinco trabajos correctos:

- **frontend:** instalación con lockfile, `npm audit --audit-level=high`, pruebas y compilación.
- **backend:** instalación con lockfile, `npm audit --audit-level=high`, revisión sintáctica y pruebas unitarias.
- **backend-e2e:** pruebas HTTP contra una instancia MongoDB aislada.
- **smoke-preview:** salud del backend, conexión MongoDB, CORS, autenticación sin credenciales y catálogo de muestra.
- **frontend-browser:** comprobaciones automatizadas con Chromium en tamaños de pantalla de escritorio, tableta y móvil.

Los pasos obligatorios de auditoría de frontend y backend no detectaron vulnerabilidades de severidad **alta o crítica que bloquearan aquella ejecución**. Para afirmar cifras precisas de avisos de cualquier nivel en una ejecución posterior, deben consultarse sus archivos `npm-audit-frontend.json` y `npm-audit-backend.json` adjuntos como artefactos; el estado verde por sí solo no demuestra ausencia de avisos moderados o bajos.

## Historial anterior (conservado como referencia)

La revisión de CI #105 (22–23 de octubre de 2026, commit `baa141b845fa3fd7f2f5bcb17288e19f09423dec`) registró cero avisos en los informes de auditoría de frontend y backend de aquella ejecución. Una revisión todavía anterior informó de 112 avisos frontend y 24 backend. **Estas cifras son históricas y no deben presentarse como resultados actuales.**

## Alcance y límites

Las pruebas automáticas de CI no certifican toda la experiencia funcional ni eliminan la necesidad de comprobar permisos, formularios, pedidos, inventario, recuperación de contraseña y comportamiento ante errores con cuentas de prueba. El usuario confirmó exitosamente el flujo manual de recuperación por correo; faltan evidencias específicas de tokens expirados y reutilizados.

Los pagos reales permanecen deshabilitados. Wompi Sandbox está en pausa y Mercado Pago no está incorporado como sustituto. Antes de habilitar una pasarela se necesitarán pruebas de autenticidad de webhooks, estados de transacción, referencias, importe, autorización e inventario.

El backend de la versión estable utiliza correo transaccional mediante Brevo; las instrucciones antiguas que únicamente mencionaban SMTP no describen toda la configuración actual. Los secretos deben permanecer fuera del repositorio.

## Seguimiento

- Confirmar que la ejecución más reciente asociada al último commit termina correctamente.
- Revisar los artefactos `npm audit` si es necesario reportar conteos exactos por severidad.
- Mantener `main` sin cambios y verificar los servicios desplegados en Render.
- Completar la [lista de validación funcional](RELEASE-CHECKLIST.md) antes de declarar finalizada la revisión de la tienda.

El resultado de una auditoría de dependencias no demuestra que la aplicación sea invulnerable; la revisión de código, la configuración del alojamiento y las pruebas de seguridad siguen siendo controles separados.
