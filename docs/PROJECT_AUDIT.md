# Auditoría técnica y visual — ElectroVibeHome

**Fecha:** 29 de octubre de 2026  
**Rama de trabajo:** `audit/electrovibehome-polish`  
**Base:** `electrovibehome-stable`  
**Protección del historial:** esta revisión no modifica `main`.

## 1. Tamaño y limpieza del repositorio

La medición se hizo sobre los archivos versionados del árbol Git, no sobre el tamaño de descarga de la página ni sobre el paquete de producción comprimido.

| Medición | Antes de esta revisión | Rama auditada |
|---|---:|---:|
| Archivos versionados | 136 | 134 |
| Tamaño agregado de los archivos | 2.140.780 bytes (2,04 MiB) | 1.452.487 bytes (1,39 MiB) |
| Reducción neta | — | 688.293 bytes (672,2 KiB; 32,2 %) |

La reducción neta incorpora las nuevas piezas de interfaz y pruebas añadidas en la revisión; no equivale a la reducción exacta del paquete que descargará el navegador. El repositorio no versiona `node_modules/` ni `dist/`, por lo que no está incluyendo instalaciones completas ni resultados de compilación.

### Recursos retirados o ajustados

- `public/icono-user.png` y `public/icono-order.jpg`: reemplazados por SVG pequeños y adaptables para evitar cargar fotografías fijas dentro de cada tarjeta.
- `public/testimonial-image-1.png`, `testimonial-image-2.png` y `testimonial-image-3.png`: no se encontró marcado activo que las mostrara. Se retiraron junto con las reglas CSS específicas de la sección de testimonios.
- `public/logo.jpg`: no se encontró una referencia activa; la marca del sitio se dibuja con el icono y el texto de marca que usan el encabezado y el pie.
- `public/favicon-96x96.png`: no se referenciaba desde HTML ni desde el manifiesto y se retiró. Se conservaron el favicon SVG/ICO y el icono táctil de Apple.
- `public/web-app-manifest-512x512.png`: se conservó y se añadió al manifiesto PWA. También se conserva el icono de 192 px referenciado por el manifiesto.

Los siete archivos eliminados sumaban **692.035 bytes** antes de borrarse. Las imágenes de perfil y pedido fueron sustituidas, no simplemente quitadas de la pantalla.

## 2. Dependencias

En el manifiesto frontend se retiraron las declaraciones directas de estos paquetes al no encontrar importaciones activas en el código revisado:

- `@emotion/react` (ya no es dependencia directa; sigue presente transitivamente porque `react-select` la necesita).
- `@emotion/styled`
- `@mui/icons-material`
- `@mui/material`
- `date-fns`
- `react-icons`
- `react-phone-number-input`
- `react-spinners`
- `moment-timezone` (sustituido por utilidades nativas de zona horaria, con pruebas de formato y cambio de día)

Se conservó Font Awesome porque sí se usa en el encabezado y el pie; también se conservaron Axios, React Select y React Number Format. Moment Timezone se reemplazó en el frontend por Intl.DateTimeFormat para las fechas de Bogotá. Las dependencias del backend no se modificaron.

El lockfile frontend se sincronizó con el manifiesto y se podaron **24 entradas de paquetes**, incluidos Moment y Moment Timezone. El lockfile pasó de 122.697 a 108.321 bytes (14.376 bytes menos). La instalación limpia y auditoría de npm pasaron en CI con cero vulnerabilidades reportadas.

## 3. Paleta e interfaz

La identidad conserva el azul del encabezado y pie. Para las áreas renovadas se centralizaron los tokens principales alrededor de:

- **Azul de marca:** `#294F7D`, enlaces y estructura operativa.
- **Naranja de acento:** `#E97816`, energía de marca y acciones primarias.
- **Azul muy claro, blanco y gris frío:** superficies, fondos, divisores y formularios.
- **Verde, ámbar y rojo:** estados semánticos de éxito, espera y error. No se recolorearon las etiquetas de estado de los pedidos.

Se corrigió el contraste del botón naranja principal usando texto azul oscuro, mientras que las acciones azules conservan texto blanco. Se centralizaron los tokens existentes en su bloque principal en lugar de mantener una segunda declaración global duplicada.

La hoja `src/styles/styles.css` sigue siendo el archivo de código más grande (aproximadamente 198 KiB). La revisión retiró las reglas de testimonios e imágenes que ya no se usan y reforzó los componentes renovados; **no se borró masivamente el CSS legado**, porque hay selectores repetidos y reglas responsive que podrían afectar módulos que todavía funcionan. Conviene consolidar esa hoja por módulos después de revisar el resultado visual con las pruebas de navegador.

## 4. Datos de género, avatar y perfil

El género se solicita **de forma opcional y auto-declarada**. No se infiere por el nombre, el correo ni ninguna otra característica. Las opciones son Femenino, Masculino, No binario y Prefiero no decirlo.

El campo se conectó en el registro, el modelo de MongoDB, la validación del servidor, la actualización del perfil y la vista de gestión de clientes. El valor predeterminado para los registros nuevos y para la interfaz de perfiles sin dato es `unspecified`. Los iconos SVG usan rosa para la opción femenina, azul para la masculina y un tono azul neutro para no binario/sin especificar. Se añadió una prueba de persistencia y se aclaró el uso opcional del dato en la Política de Privacidad.

Mi Perfil ahora muestra y permite editar ese dato; el avatar antiguo de iniciales se sustituyó por el icono vectorial. Los pedidos usan un SVG con caja y rayo en azul/naranja. Las etiquetas de estado y sus colores permanecen independientes del icono.

## 5. Módulos y flujos incluidos en la revisión

- **Navegación y experiencia compartida:** encabezado, pie, rutas, identidad de marca, enlaces y capitalización de títulos y acciones.
- **Catálogo y guía ElectroVibe:** búsqueda, categorías, recomendación local y estados vacíos. La Política de Privacidad se corrigió para reflejar que la guía actual funciona con reglas locales y no envía mensajes a servicios externos de IA.
- **Inventario y productos:** búsqueda/actualización de existencias, edición y eliminación confirmada; las pruebas conservan las comprobaciones de precio y stock.
- **Clientes y cuentas:** listado y filtros, historial de pedidos, registro, autenticación, perfil, actualización de datos y recuperación de contraseña.
- **Pedidos y pago ilustrativo:** vistas de administración y cliente, iconografía, estados y revisión manual; no se habilitó el cobro ni se cambiaron las etiquetas de estado.
- **Backend y datos:** modelo/validación de clientes y controladores de registro y actualización que reciben el nuevo campo. Las rutas y protecciones preexistentes se mantienen; no se han tocado las dependencias del backend.
- **Contenido y recursos:** referencias de los archivos públicos, iconos PWA, recursos antiguos sin uso y coherencia de textos de privacidad.

## 6. Pruebas añadidas o ajustadas

Se añadieron o actualizaron pruebas para verificar:

- Los valores válidos y el valor predeterminado del campo de género.
- La persistencia de la elección al registrar y la aceptación de una actualización del perfil.
- El icono de perfil de acuerdo con el dato declarado y el icono vectorial de los pedidos.
- Los textos de acciones del inventario y los selectores usados por la prueba de navegador.

**Estado de validación:** CI de la rama completado correctamente: frontend (20 archivos de prueba, 82 pruebas), backend y backend E2E, compilación de producción e instalación limpia. Las comprobaciones smoke-preview/frontend-browser estaban omitidas para esta rama y deben verificarse tras la integración y el despliegue.

## 7. Límites y seguimiento

Medidas de Vite: el JavaScript principal pasó de 1.477,92 kB / 268,66 kB gzip a 371,68 kB / 113,00 kB gzip gracias a la carga diferida por ruta. El CSS principal pasa de 192,06 kB / 34,71 kB gzip a 162,27 kB / 30,16 kB gzip. Los otros módulos cargan sus propios fragmentos a demanda; no confundir la reducción del bloque inicial con una reducción equivalente de todo el código. Se eliminó el fragmento de Moment Timezone de casi 793 kB sin comprimir.

La hoja de estilos aún requiere una siguiente fase de consolidación gradual por módulo, guiada por pruebas responsive, no una eliminación automática basada solo en el número de selectores. Se debe mantener la rama `main` intacta y promover estos cambios solo si el PR y el despliegue pasan las verificaciones.
