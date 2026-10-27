# Catálogo de demostración de ElectroVibeHome

El archivo [data/demo-products.json](../data/demo-products.json) contiene **66 productos de muestra distribuidos en 22 categorías** (tres por categoría, verificado el 27 de octubre de 2026). Los nombres, precios, existencias e imágenes identificativas son datos ilustrativos, no ofertas comerciales ni inventario real.

## Funcionamiento

- La interfaz prioriza el catálogo de la API cuando está disponible.
- Cuando no hay conexión a la API o el catálogo está vacío, puede usar las fichas de ejemplo locales.
- La búsqueda y los filtros ayudan a explorar los productos por nombre y categoría.
- El catálogo de respaldo local no autoriza compras ni pagos reales.
- El test de comprobación del sitio publicado validó 66 productos de muestra en 22 categorías, precios e inventarios positivos y ausencia de duplicados de nombre dentro de una categoría.

## Carga opcional en una base aislada

Existe un script de carga idempotente en `backend/scripts/seedDemoProducts.js`. Requiere `ALLOW_DEMO_SEED=true` y una conexión `DEMO_MONGODB_URI` **distinta** de la base de datos configurada para la aplicación. Además, rechaza `NODE_ENV=production` y exige que el nombre de base contenga `demo`, `test` o `sandbox`.

**No ejecutes el script sobre la base de la versión estable ni sobre la versión original.** La carga solo debe realizarse en una base adicional aislada y autorizada. No es necesaria para el catálogo actual ni forma parte de esta actualización de documentación.

El identificador heredado `electrovibehome-v2-demo` que aparece en datos y en el script es un valor interno de versión del catálogo. Se conserva para mantener compatibilidad con los registros existentes; no indica una rama Git adicional ni el nombre oficial del proyecto.
