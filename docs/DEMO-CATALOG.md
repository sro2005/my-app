# Catálogo de demostración de ElectroVibeHome

La nueva interfaz contiene 22 fichas de producto ilustrativas, una por cada categoría disponible en las preferencias del perfil. Los nombres, precios e inventario son datos de demostración; no representan marcas, precios comerciales ni stock real.

## Cómo se comporta el catálogo

- Si la API devuelve productos, la interfaz muestra el catálogo de la API.
- Si la URL de la API no está configurada, falla la petición o la API todavía no contiene registros, la interfaz utiliza los productos de muestra locales.
- Los usuarios pueden buscar por nombre, descripción o categoría; las preferencias son un filtro opcional, no un bloqueo para ver todo el catálogo.
- El catálogo de muestra no permite comprar ni iniciar pagos.

## Cargar fichas en una base de datos aislada de demostración

El backend incluye un seeder idempotente. Solo inserta fichas que aún no existen; conserva los registros existentes. Está deliberadamente separado de `MONGODB_URI` y requiere una URI específica llamada `DEMO_MONGODB_URI`.

1. Crea en MongoDB Atlas una base de datos independiente cuyo nombre incluya `demo`, `test` o `sandbox`, por ejemplo `electrovibehome_demo`.
2. Desde la carpeta `backend`, configura `DEMO_MONGODB_URI` para esa base independiente y ejecuta el comando con consentimiento explícito:

   ```bash
   ALLOW_DEMO_SEED=true DEMO_MONGODB_URI='mongodb+srv://USUARIO:CLAVE@HOST/electrovibehome_demo?retryWrites=true&w=majority' npm run seed:demo
   ```

3. El script rechaza `NODE_ENV=production`, requiere `ALLOW_DEMO_SEED=true`, exige la variable separada `DEMO_MONGODB_URI` y comprueba el nombre de la base de datos. No uses una URI de producción.

No se ha ejecutado el seeder contra ninguna base de datos desde este cambio. La interfaz ya puede mostrar las 22 fichas locales aun cuando el backend no esté disponible; el seeder es opcional para un entorno de prueba con MongoDB propio.
