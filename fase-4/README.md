# Fase 4 - Cierre final

Versión final del sistema **La Mesa**. Integra el catálogo, carrito persistente, registro y consulta de pedidos, actualización de estados, manejo de errores y pruebas automatizadas.

El panel administrativo incluye estadísticas del día, filtros por estado y fecha, y control de existencias. Cada pedido descuenta el stock dentro de la misma transacción que guarda sus detalles.

El formulario de productos permite arrastrar una imagen o seleccionarla desde la computadora. Se aceptan archivos JPG, PNG y WebP de hasta 5 MB; también se conserva la opción de pegar un enlace.

## Preparación

1. Instalar Node.js 22 o superior y MySQL 8.
2. Para una base nueva, ejecutar `database/schema.sql` y después `database/seeds.sql`. Si la base ya existía, ejecutar primero `database/migration-admin.sql` y luego `database/seeds.sql`.
3. Copiar `.env.example` como `.env` y configurar las credenciales.
4. Ejecutar `npm install` dentro de `fase-4`.
5. Ejecutar `npm start` y abrir <http://localhost:3000>.

Las pruebas se ejecutan con `npm test` y no necesitan una instancia activa de MySQL.

## Acceso administrativo

Al presionar **Pedidos**, la aplicación solicita las credenciales configuradas en `.env`. Los valores iniciales del archivo de ejemplo son:

```text
Usuario: admin
Contraseña: admin123
```

Cambiar `ADMIN_PASSWORD` antes de utilizar el sistema fuera de una demostración local. La sesión dura ocho horas y se elimina al cerrar sesión o reiniciar el servidor.

## API REST

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api/platos` | Listar platos activos |
| POST | `/api/admin/login` | Iniciar sesión administrativa |
| GET | `/api/pedidos` | Consultar pedidos y detalles (protegida) |
| POST | `/api/pedidos` | Registrar un pedido |
| PATCH | `/api/pedidos/:id/estado` | Actualizar el estado (protegida) |
| GET | `/api/admin/platos` | Listar todos los productos |
| GET | `/api/admin/resumen` | Consultar ventas, pedidos y stock bajo |
| POST | `/api/admin/imagenes` | Guardar una imagen del producto |
| POST | `/api/admin/platos` | Crear un producto |
| PUT | `/api/admin/platos/:id` | Editar o reactivar un producto |
| DELETE | `/api/admin/platos/:id` | Retirar un producto del menú |
| PATCH | `/api/admin/platos/:id/reactivar` | Reactivar un producto retirado |

## Comprobación manual

1. Buscar un plato y agregar varias unidades al carrito.
2. Recargar la página y comprobar que el carrito persiste.
3. Registrar el pedido y verificar que el carrito se vacíe.
4. Abrir **Pedidos**, iniciar sesión, revisar sus detalles y cambiar el estado.
5. Entrar en **Productos**, crear uno nuevo y comprobar que aparezca en el menú.
6. Editar, retirar y reactivar el producto desde el mismo formulario.
