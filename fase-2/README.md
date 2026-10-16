# Fase 2 - Backend, API REST y carrito

Esta entrega amplía la Fase 1 con un servidor Node.js y Express, conexión a MySQL, el endpoint `GET /api/platos` y un carrito que funciona en memoria mientras la página está abierta.

## Ejecución

1. Ejecutar `database/schema.sql` y luego `database/seeds.sql` en MySQL 8.
2. Copiar `.env.example` como `.env` y colocar las credenciales de MySQL.
3. Ejecutar `npm install` dentro de `fase-2`.
4. Ejecutar `npm start` y abrir <http://localhost:3000>.

El carrito todavía no envía pedidos ni se conserva al recargar; esas funciones pertenecen a la Fase 3.
