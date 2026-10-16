# La Mesa: pedidos de comida

Proyecto de tercer ciclo con Node.js, Express, MySQL y HTML, CSS y JavaScript sin frameworks de frontend.

## Funciones

- Consultar un menú con precios en quetzales.
- Agregar platos al carrito y cambiar sus cantidades.
- Registrar un pedido con nombre e indicaciones opcionales.
- Consultar pedidos con sus detalles, fecha y total.
- Cambiar el estado a pendiente, en preparación o entregado.

Es una demostración local sin cuentas, pagos ni entregas a domicilio. La vista de pedidos está disponible para cualquier persona que acceda a la aplicación. El carrito vive en memoria y se vacía al recargar; los pedidos se guardan en MySQL.

## Requisitos y ejecución

1. Instalar Node.js 22 o superior y MySQL 8.
2. Abrir `database/schema.sql` en MySQL Workbench y ejecutar el script completo. Crea la base, tres tablas y seis platos de ejemplo. También puede importarse con `mysql -u root -p` y luego `SOURCE ruta/al/proyecto/database/schema.sql;`.
3. Copiar `.env.example` a `.env` y configurar el usuario, contraseña y puerto de MySQL. En PowerShell: `Copy-Item .env.example .env`.
4. Ejecutar `npm install` en la carpeta del proyecto.
5. Ejecutar `npm run dev` para desarrollo o `npm start` para ejecución normal.
6. Abrir <http://localhost:3000>. Express sirve tanto la página como la API.

Las pruebas automatizadas de la interfaz HTTP y de las validaciones se ejecutan con
`npm test`. No necesitan una instancia de MySQL porque sustituyen la capa de acceso
a datos por respuestas controladas.

Si no carga el menú, comprobar que MySQL esté iniciado, que el script se haya ejecutado y que `.env` tenga las credenciales correctas. Reiniciar Node después de modificar `.env`. El script puede repetirse sin borrar pedidos ni duplicar los platos iniciales.

## Organización

```text
database/schema.sql                 Tablas, relaciones y datos iniciales
public/index.html                   Menú, carrito y vista de pedidos
public/styles.css                   Diseño adaptable a pantallas pequeñas
public/app.js                       Fetch y manipulación del DOM
src/config/db.js                    Pool de conexiones MySQL
src/controllers/pedidos.controller.js Validaciones y consultas SQL
src/routes/index.js                 Rutas de la API
src/app.js                          Servidor y manejo de errores
```

## Base de datos

Un pedido tiene varios registros en `detalle_pedido`. Cada detalle pertenece a un plato. Las claves foráneas relacionan estas tres tablas. El precio unitario se guarda en el detalle para conservar el importe cobrado aunque después cambie el precio del menú.

Al registrar un pedido, el servidor valida cantidades y consulta los precios reales. Una transacción guarda el pedido y sus detalles juntos: si una consulta falla, se revierten los cambios. Las consultas con datos del usuario utilizan parámetros `?`.

## API REST

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api/platos` | Listar platos activos |
| GET | `/api/pedidos` | Listar pedidos con detalles |
| POST | `/api/pedidos` | Registrar un pedido |
| PATCH | `/api/pedidos/:id/estado` | Cambiar el estado |

Cuerpo de ejemplo para POST (cabecera `Content-Type: application/json`):

```json
{
  "cliente": "Ana",
  "notas": "Sin cebolla",
  "productos": [{ "plato_id": 1, "cantidad": 2 }]
}
```

Respuesta correcta: HTTP 201 con el identificador y total. Para PATCH, enviar `{"estado":"en preparación"}`. Se permite seleccionar cualquiera de los tres estados para corregir errores de registro. Los errores de validación usan HTTP 400; un pedido inexistente usa 404; los errores internos usan 500.

## Comprobación manual

1. Agregar dos hamburguesas y una limonada: el total debe ser Q 80.00.
2. Quitar unidades y comprobar que el total cambie; quitar todas deshabilita la confirmación.
3. Registrar un pedido con nombre y notas, comprobar el mensaje y que se vacíe el carrito.
4. Abrir Pedidos, verificar los detalles y cambiar el estado. Recargar y comprobar que persista.
5. Enviar mediante un cliente HTTP un pedido vacío, cantidad negativa o plato inexistente: debe devolver 400 sin guardar el pedido.
6. Detener MySQL y actualizar la lista: la página debe mostrar un error sin cerrarse.

## Git y GitHub

El archivo `.gitignore` excluye dependencias y credenciales. Para comenzar a versionar:

```sh
git init
git add .
git commit -m "Crear sistema básico de pedidos de comida"
```

Crear un repositorio vacío en GitHub y asociarlo con su URL:

```sh
git branch -M main
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

## Para explicar el proyecto

Seguir el recorrido de un pedido: el DOM captura los platos, `fetch` envía JSON, Express elige la ruta, el controlador valida y consulta MySQL, y el navegador muestra la respuesta. Explicar después la relación entre las tablas y por qué se utiliza una transacción.
