# Fase 4 - Cierre final

Versión final del sistema **La Mesa**. Integra el catálogo, carrito persistente, registro y consulta de pedidos, actualización de estados, manejo de errores y pruebas automatizadas.

## Preparación

1. Instalar Node.js 22 o superior y MySQL 8.
2. Ejecutar `database/schema.sql` y después `database/seeds.sql`.
3. Copiar `.env.example` como `.env` y configurar las credenciales.
4. Ejecutar `npm install` dentro de `fase-4`.
5. Ejecutar `npm start` y abrir <http://localhost:3000>.

Las pruebas se ejecutan con `npm test` y no necesitan una instancia activa de MySQL.

## API REST

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api/platos` | Listar platos activos |
| GET | `/api/pedidos` | Consultar pedidos y detalles |
| POST | `/api/pedidos` | Registrar un pedido |
| PATCH | `/api/pedidos/:id/estado` | Actualizar el estado |

## Comprobación manual

1. Buscar un plato y agregar varias unidades al carrito.
2. Recargar la página y comprobar que el carrito persiste.
3. Registrar el pedido y verificar que el carrito se vacíe.
4. Abrir la vista **Pedidos**, revisar sus detalles y cambiar el estado.
5. Recargar la lista para comprobar que el cambio quedó guardado.
