# Auditoría de dependencias y estado de verificación — ElectroVibeHome

Última revisión documental: 21 de octubre de 2026.

## Estado verificado en GitHub Actions

- La ejecución #61 (221ca31) terminó correctamente: instalación limpia, pruebas frontend, compilación de producción, comprobación de sintaxis del backend y pruebas unitarias del backend.
- Esa ejecución generó artefactos JSON de auditoría para frontend y backend, retenidos por GitHub Actions durante 14 días.
- Esa ejecución no prueba por sí sola que toda la aplicación funcione de extremo a extremo ni que los flujos de pago sean seguros en producción.
- Se añadieron pruebas de AuthProvider para comprobar el saneamiento de sesiones persistidas inválidas y el cierre de sesión sin borrar otras preferencias del navegador. Las ejecuciones posteriores deben confirmar estos nuevos tests.

## Dependencias y herramientas

La rama de endurecimiento migra el frontend de Create React App a Vite/Vitest, usa React 19 y Node.js 24, y actualiza las dependencias del backend dentro de versiones principales compatibles. Los lockfiles se instalan mediante npm ci en CI.

**No se debe afirmar que hay cero vulnerabilidades hasta revisar el contenido de los dos informes JSON más recientes.** El hecho de que npm audit --json se ejecute y se almacene como artefacto no hace que CI falle automáticamente cuando reporta avisos. Las cantidades antiguas documentadas abajo son históricas, no un inventario actual.

## Hallazgos y riesgos que siguen pendientes

1. **Pedidos pendientes y stock:** al crear un pedido se reduce el inventario antes de completar el checkout. Si el cliente abandona el checkout, el inventario puede permanecer reservado. No se debe liberar automáticamente sin reconciliar la referencia con el estado real de Wompi; una política segura requiere consulta/verificación de transacciones y pruebas de concurrencia.
2. **Pagos:** validar en Wompi Sandbox pagos aprobados, rechazados, en error, pendientes, abandonados, webhooks repetidos, importes/monedas discordantes y eventos tardíos. La redirección del navegador no es prueba de pago.
3. **Configuración de despliegue:** confirmar MONGODB_URI, JWT_SECRET, FRONTEND_URL, ALLOWED_ORIGINS, variables SMTP y las credenciales Wompi de Sandbox en el entorno de prueba. No copiar secretos reales al repositorio.
4. **MongoDB:** comprobar que el clúster de pruebas admite transacciones (replica set o Atlas) antes de probar los flujos que usan sesiones/transacciones. No actualizar la versión del servidor MongoDB sin conocer la versión actual y tener respaldo.
5. **Autenticación:** ampliar pruebas de integración para registro, inicio de sesión, autorización de roles, expiración de JWT, recuperación y restablecimiento de contraseña, y acceso a pedidos ajenos.
6. **Abuso de endpoints:** valorar limitación de frecuencia para inicio de sesión y recuperación de contraseña antes de producción.
7. **Secretos históricos:** si se llegó a subir una clave privada real al repositorio, eliminarla del historial no basta: debe revocarse/rotarse y comprobarse el historial con herramientas adecuadas.
8. **Despliegue:** confirmar que Render utiliza Node 24, el comando de compilación y el directorio de publicación build; probar el frontend con la API de pruebas antes de fusionar.

## Artefactos de auditoría

La ejecución #61 almacenó los artefactos frontend-dependency-audit y backend-dependency-audit. Deben descargarse y analizarse para registrar versiones afectadas, severidad, rutas de dependencias y remediaciones disponibles. Repetir la auditoría después de cambios sustanciales y guardar los resultados nuevos.

## Historial

Una ejecución anterior reportó 112 avisos de frontend (6 bajos, 17 moderados, 85 altos y 4 críticos) y 24 de backend (1 bajo, 5 moderados, 16 altos y 2 críticos). Estos datos pertenecen a una versión anterior y no deben presentarse como estado actual.

## Criterio de salida

La rama solo debe proponerse para publicación después de:
- CI verde en el commit final.
- Informes de auditoría revisados y vulnerabilidades remediadas o aceptadas con justificación.
- Pruebas funcionales del frontend y de los endpoints críticos.
- Pruebas de pago Sandbox y webhook, inventario y recuperación de contraseña.
- Verificación de configuración de Render y MongoDB en entorno de prueba.
- Revisión manual del diff final. No fusionar ni desplegar sin aprobación explícita.
