# Auditoría de dependencias y estado de verificación — ElectroVibeHome

Última verificación automatizada: CI #105, commit `baa141b845fa3fd7f2f5bcb17288e19f09423dec` (22 de octubre de 2026, hora de Colombia; 23 de octubre UTC).

## Resultado más reciente de npm audit

Los informes JSON adjuntos al workflow **ElectroVibeHome CI #105** fueron descargados y revisados.

| Paquete | Dependencias incluidas en el informe | Informativas | Bajas | Moderadas | Altas | Críticas | Total reportado |
|---|---:|---:|---:|---:|---:|---:|---:|
| Frontend | 245 | 0 | 0 | 0 | 0 | 0 | **0** |
| Backend | 127 | 0 | 0 | 0 | 0 | 0 | **0** |

Los informes no detectaron avisos de vulnerabilidad conocidos por la base de datos de advisories de npm consultada en esa ejecución. Esto **no** demuestra que la aplicación sea invulnerable ni sustituye el análisis del código, las dependencias transitivas que no cubra el informe, la configuración de hosting o las pruebas funcionales.

CI ejecuta `npm audit --json` con tolerancia de error para poder generar y guardar el informe como artefacto. Por tanto, un informe con avisos por sí solo no hace fallar el workflow; revisar los informes continúa siendo un control explícito.

Artefactos asociados a la ejecución #105:
- `frontend-dependency-audit`
- `backend-dependency-audit`

## Estado de verificación de CI

La ejecución #105 terminó correctamente:
- Instalación limpia de dependencias frontend y backend con los lockfiles.
- Pruebas automatizadas frontend.
- Build de producción del frontend.
- Validación sintáctica del backend.
- Pruebas unitarias del backend.
- Generación y publicación de los dos informes de auditoría.

Esto comprueba los pasos ejecutados en CI, no el funcionamiento end-to-end de todas las pantallas, la conexión con MongoDB, el servicio SMTP ni los pagos.

## Riesgos y tareas funcionales pendientes

1. **Base de datos de pruebas:** crear una base MongoDB independiente cuyo nombre incluya `demo`, `test` o `sandbox`. No conectar la vista previa a la variable `MONGODB_URI` de producción.
2. **Pedidos e inventario:** al crear un pedido, las unidades se reservan antes de completar el checkout. Un checkout abandonado puede dejar inventario reservado. No liberar unidades automáticamente sin reconciliar de forma segura el estado de la transacción Wompi.
3. **Wompi Sandbox:** probar pagos aprobados, rechazados, con error, pendientes, abandonados y eventos tardíos; webhooks repetidos; referencias, importe y moneda discordantes. La redirección del navegador no confirma por sí sola un pago.
4. **Transacciones MongoDB:** confirmar que la base de pruebas admite transacciones (por ejemplo, un clúster de Atlas apto para ellas) antes de probar los flujos concurrentes de pedidos e inventario.
5. **Autenticación y permisos:** probar registro, login, rol administrador, expiración JWT, perfil, recuperación y restablecimiento de contraseña, y aislamiento de pedidos entre usuarios.
6. **Correo:** validar envío SMTP de recuperación en el entorno de pruebas sin incluir credenciales reales en Git, registros o frontend.
7. **Configuración:** establecer valores de pruebas para `JWT_SECRET`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, variables SMTP y credenciales exclusivas de Wompi Sandbox.
8. **Secretos históricos:** si una clave privada real fue subida al historial del repositorio, retirarla del código actual no basta; hay que revocarla o rotarla y revisar el historial.
9. **Abuso de endpoints:** evaluar limitación de frecuencia para login y recuperación de contraseña antes de producción.
10. **Pruebas manuales:** recorrer la vista previa y validar que cada pantalla se comporta como se espera; el éxito del build y de las pruebas unitarias no es una prueba completa de los flujos de usuario.

## Historial de cifras

Una ejecución histórica reportó 112 avisos frontend y 24 backend. Esos números corresponden a una versión anterior y **no** describen el informe más reciente, que registró cero avisos en ambas partes.

## Criterio de publicación

No habilitar pagos reales ni fusionar/desplegar esta rama a producción hasta:
- CI verde en el commit que se proponga publicar.
- Informes de auditoría revisados.
- Base de datos y backend de pruebas separados de producción.
- Pruebas funcionales de frontend, API, autorización, correo, pedidos, inventario, Sandbox y webhooks.
- Confirmación de todas las variables de entorno y revisión manual del diff final.
