# Fase 3 - Frontend y registro de pedidos

Esta entrega incorpora todo lo desarrollado en las fases anteriores y agrega:

- consumo de la API con `fetch`;
- carrito persistente en `localStorage`;
- validaciones en navegador y servidor;
- registro de pedidos con `POST /api/pedidos`;
- transacciones de MySQL para guardar el pedido y sus detalles juntos.

## Ejecución

1. Ejecutar `database/schema.sql` y `database/seeds.sql` en MySQL 8.
2. Copiar `.env.example` como `.env` y configurar MySQL.
3. Ejecutar `npm install` dentro de `fase-3`.
4. Ejecutar `npm start` y abrir <http://localhost:3000>.
