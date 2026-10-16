# Fase 1 - Planteamiento, base de datos e interfaz

Esta carpeta contiene la primera entrega del sistema **La Mesa**. Su alcance es:

- análisis del problema y requisitos iniciales;
- diseño de la base de datos;
- creación de tablas y relaciones en MySQL;
- datos iniciales del catálogo;
- prototipo de interfaz en HTML5, CSS3 y JavaScript;
- catálogo con búsqueda y filtro por categoría.

La API REST, el carrito de compras y el registro de pedidos pertenecen a fases posteriores y no forman parte de esta versión.

## Estructura

```text
fase-1/
|-- database/
|   |-- schema.sql
|   `-- seeds.sql
|-- documentacion/
|   `-- analisis-y-diseno.md
`-- public/
    |-- index.html
    |-- styles.css
    `-- app.js
```

## Cómo revisar la entrega

1. Ejecutar `database/schema.sql` en MySQL 8.
2. Ejecutar `database/seeds.sql` para cargar los platos de ejemplo.
3. Abrir `public/index.html` en un navegador. Esta interfaz es estática y no necesita Node.js ni conexión a MySQL.

El catálogo del prototipo usa los mismos datos de ejemplo que `seeds.sql`, lo que permite evaluar el diseño y los filtros antes de conectar la interfaz con la API.
