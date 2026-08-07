# nrd-catalogo

App de catálogo y pedidos para clientes (ej. Panadería Nueva Río D'or). Sin registro ni login: el cliente navega el catálogo, arma el pedido y lo envía.

## Backend

El PWA (`https://catalogo.nrdonline.site`) **solo** habla con la API:

- Base: `https://api.nrdonline.site`
- Auth: header `X-Catalog-Key`
- Firebase queda en el server (cuenta `auto@nrd.uy`); no hay Auth anónima ni SDK de Firebase en el cliente.

### Endpoints usados

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/catalog` | Vitrina (productos, categorías, envío, horarios) |
| `POST` | `/orders` | Crear pedido (precios/total los calcula el server) |
| `GET` | `/orders/{orderId}` | Estado del pedido activo (poll ~15–20s) |

Cliente: `modules/catalog-api.js`.

## Uso

- Productos: vienen de `GET /catalog` (`products` + `optionsCatalog`).
- Pedidos: `POST /orders` con `items[].sku` (sin `price`/`total` del cliente).
- Pedido activo: snapshot en `localStorage` + estado vía `GET /orders/{id}`.
