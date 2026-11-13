# FIKA ELDRA · Tienda

Tienda de velas con runas, brumas textiles y rituales. Hecha con Next.js 16 y pensada para **Vercel + Neon Postgres + Vercel Blob**.

- Catálogo, fichas de producto con elección de fragancia (22 aromas), stock por aroma y conjuntos (ritual completo).
- Carrito lateral con barra de envío gratis, checkout en una sola página y pedido final por **WhatsApp** (no se cobra online).
- Panel `/admin` con contraseña: productos, stock por aroma, pedidos y estados, runas, contenidos, estadísticas, respaldo e importación.
- SEO: metadatos por página, datos estructurados de producto y FAQ, `sitemap.xml` y `robots.txt`.

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Neon Postgres. La completa Vercel al conectar Neon en **Storage**. |
| `BLOB_READ_WRITE_TOKEN` | Subir fotos desde el panel. La completa Vercel al crear un **Blob** store. |
| `ADMIN_PASSWORD` | Contraseña del panel `/admin`. |
| `AUTH_SECRET` | Opcional. Firma de la sesión del panel. |
| `NEXT_PUBLIC_SITE_URL` | Opcional. Dominio público, para el sitemap. |
| `RESEND_API_KEY`, `MAIL_FROM`, `ORDER_EMAIL` | Opcional. Copia del pedido por correo. |

La base de datos se crea sola en el primer acceso: tablas y catálogo inicial (`lib/seed.json`).

## Desarrollo local

```bash
pnpm install
DATABASE_URL=pglite:./.data ADMIN_PASSWORD=dev pnpm dev
```

`pglite:` usa un Postgres local embebido, sin instalar nada. En producción usá la URL de Neon.

## Migrar pedidos de la tienda anterior

Los pedidos tienen datos personales de clientes y **no están en este repositorio**. Para recuperarlos: entrá a `/admin`, abrí **Configuración**, elegí **Importar respaldo** y cargá el archivo JSON de migración. Se puede importar más de una vez sin duplicar registros.
