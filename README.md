# nrd-catalogo

App de catálogo y pedidos para clientes (ej. Panadería Nueva Río D'or). Sin registro ni login: el cliente navega el catálogo, arma el pedido y lo envía.

## Firebase

La app usa **autenticación anónima** para acceder a Firebase (productos, información de la empresa, órdenes). No hay pantalla de login.

- En **Firebase Console** → **Authentication** → **Sign-in method** hay que **activar "Anonymous"**.
- La librería NRD Data Access debe incluir `signInAnonymously()` (versión que lo soporte).

## Uso

- Productos: se obtienen de la API de productos; solo se muestran los que tienen la etiqueta **CATALOGO**.
- Imágenes: campo `imagePath` del producto (ruta relativa a la app, ej. `assets/images/pan.jpg`).
