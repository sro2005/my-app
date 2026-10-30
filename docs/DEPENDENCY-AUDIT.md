# Auditoría de dependencias y estado de verificación — ElectroVibeHome

## Última verificación — 29 de octubre de 2026

La [ejecución 41001693723](https://github.com/sro2005/ElectroVibeHome/actions/runs/41001693723), sobre el commit `66433c2776b10cf464fa373e4ca2dbb2eff3c0ec` de `electrovibehome-stable`, terminó con **5/5 trabajos correctos**:

- **frontend:** instalación limpia, auditoría de dependencias, pruebas y compilación aprobadas.
- **backend:** instalación limpia, auditoría de dependencias, comprobación sintáctica y pruebas unitarias aprobadas.
- **backend-e2e:** pruebas HTTP contra una instancia MongoDB temporal con soporte para transacciones.
- **smoke-preview:** comprobación de salud de la API, conexión MongoDB, CORS, rutas protegidas y catálogo publicado.
- **frontend-browser:** comprobaciones responsive con Chromium en el sitio publicado; capturas disponibles en el [artefacto de la ejecución](https://github.com/sro2005/ElectroVibeHome/actions/runs/41001693723/artifacts/12954105915).

Las auditorías ejecutaron `npm audit --audit-level=high` tanto en frontend como en backend y ambas pasaron. Esto significa que no se detectaron vulnerabilidades altas o críticas que bloquearan la ejecución; no equivale a afirmar que no existan avisos de severidad moderada o baja. Los informes completos se conservaron como artefactos: [auditoría frontend](https://github.com/sro2005/ElectroVibeHome/actions/runs/41001693723/artifacts/12953812069) y [auditoría backend](https://github.com/sro2005/ElectroVibeHome/actions/runs/41001693723/artifacts/12953856717).

El E2E incluye comprobaciones de tokens de restablecimiento válidos, vencidos y reutilizados en una base MongoDB desechable. La ejecución no procesó pagos ni modificó pedidos, inventario o cuentas en la base de datos viva.

## Verificación anterior — 29 de octubre de 2026

La [ejecución 41000310456](https://github.com/sro2005/ElectroVibeHome/actions/runs/41000310456), sobre el commit `35aff4d5ed61df1eea8bfcacabe1909c77223963`, también terminó con **5/5 trabajos correctos**. Validó las pruebas y compilación del frontend, las pruebas de backend, E2E con MongoDB temporal, smoke del servicio publicado y navegación responsive. Se conserva como referencia de la revisión de inventario y precios anterior a la limpieza de dependencias.

## Referencia histórica — 27 de octubre de 2026

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

Las pruebas automáticas de CI no certifican toda la experiencia funcional ni eliminan la necesidad de comprobar permisos, formularios, pedidos, inventario, recuperación de contraseña y comportamiento ante errores con cuentas de prueba. El flujo manual de recuperación por correo fue confirmado anteriormente; la suite E2E actual también comprueba expiración y reutilización de tokens en MongoDB desechable.

El checkout vigente solo registra pedidos con pago pendiente de coordinación. La aprobación o el rechazo se realiza manualmente desde el panel administrativo. El código activo no integra proveedores externos de pago ni solicita credenciales bancarias; el repositorio no inicia cobros ni transferencias.

El backend de la versión estable utiliza correo transaccional mediante Brevo; las instrucciones antiguas que únicamente mencionaban SMTP no describen toda la configuración actual. Los secretos deben permanecer fuera del repositorio.

## Seguimiento

- Confirmar que la ejecución más reciente asociada al último commit termina correctamente.
- Revisar los artefactos `npm audit` si es necesario reportar conteos exactos por severidad.
- Mantener `main` sin cambios y verificar los servicios desplegados en Render.
- Completar la [lista de validación funcional](RELEASE-CHECKLIST.md) antes de declarar finalizada la revisión de la tienda.

El resultado de una auditoría de dependencias no demuestra que la aplicación sea invulnerable; la revisión de código, la configuración del alojamiento y las pruebas de seguridad siguen siendo controles separados.
