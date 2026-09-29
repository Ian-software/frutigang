# FRUTIGANG 🍓

Página web de pedidos para un emprendimiento de cócteles de frutas.

## Qué incluye
- Portada responsive.
- Registro e inicio de sesión.
- Constructor de cócteles en 2 pasos.
- Acompañamientos y toppings múltiples.
- Precio en tiempo real.
- Vista visual dinámica del cóctel mediante capas.
- Carrito: duplicar/eliminar/comprar.
- Confirmación antes de comprar.
- Panel administrativo.
- Modo local con `localStorage` para probar sin configurar servidor.
- Integración opcional con Supabase para usuarios y pedidos.
- Compatible con GitHub Pages.

## Probar inmediatamente
Abre `index.html` en un navegador. Sin Supabase configurado, se activa el modo demo local.

Administrador:
- Botón: Admin
- Contraseña: `221208`

## Publicar en GitHub Pages
1. Crea un repositorio, por ejemplo `frutigang`.
2. Sube `index.html`, `styles.css`, `app.js`, `supabase.sql` y la carpeta `assets`.
3. GitHub → Settings → Pages.
4. Source: Deploy from a branch.
5. Selecciona `main` y `/ (root)`.
6. Guarda. GitHub proporcionará la dirección de la página.

## Conectar la base de datos Supabase
1. Crea un proyecto en Supabase.
2. Ve a SQL Editor.
3. Ejecuta `supabase.sql`.
4. Ve a Project Settings → API.
5. Copia:
   - Project URL
   - anon public key
6. En `app.js`, reemplaza:
```js
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
```
por tus datos.
7. Vuelve a subir `app.js` a GitHub.

### Importante sobre el administrador
La contraseña `221208` está implementada para cumplir el requisito y permitir una demostración sencilla desde GitHub Pages. No es una solución de seguridad para producción porque cualquier contraseña colocada en JavaScript del navegador puede ser inspeccionada.

Para un uso real con datos de clientes, el siguiente paso recomendado es convertir el acceso administrativo a autenticación de Supabase + RLS/Edge Function. Así los clientes no pueden leer los pedidos de otras personas.

## Nota sobre imágenes
El constructor usa una ilustración CSS/emoji por capas para que cada combinación cambie instantáneamente sin necesitar cientos de imágenes. Se puede sustituir cada capa por PNG/SVG reales sin cambiar la lógica de pedidos.

## Corrección incluida
- El botón **Añadir al carrito** ahora agrega correctamente el cóctel, actualiza el contador, muestra confirmación y abre el carrito automáticamente.

## Rediseño visual v3
- Interfaz inspirada en el estilo tropical de la referencia proporcionada.
- Imagen realista del cóctel como protagonista.
- Emojis conservados como controles de selección.
- Barra lateral de pasos, tarjetas modernas y base de frutas visual.
- La lógica del carrito y pedidos se mantiene.
