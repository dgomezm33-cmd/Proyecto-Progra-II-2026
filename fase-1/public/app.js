const platos = [
  { id: 1, nombre: 'Hamburguesa clásica', descripcion: 'Carne, queso, lechuga y tomate con papas fritas.', categoria: 'Platos fuertes', precio: 35, imagen: '../../public/images/menu/hamburguesa.png' },
  { id: 2, nombre: 'Pizza personal', descripcion: 'Pizza de queso mozzarella y pepperoni.', categoria: 'Platos fuertes', precio: 40, imagen: '../../public/images/menu/pizza.png' },
  { id: 3, nombre: 'Tacos de pollo', descripcion: 'Tres tacos de pollo con cebolla, cilantro y limón.', categoria: 'Platos fuertes', precio: 25, imagen: '../../public/images/menu/tacos.png' },
  { id: 4, nombre: 'Ensalada fresca', descripcion: 'Lechuga, tomate, pepino y aderezo de la casa.', categoria: 'Ensaladas', precio: 22, imagen: '../../public/images/menu/ensalada.png' },
  { id: 5, nombre: 'Limonada', descripcion: 'Limonada natural preparada al momento.', categoria: 'Bebidas', precio: 10, imagen: '../../public/images/menu/limonada.png' },
  { id: 6, nombre: 'Brownie', descripcion: 'Brownie de chocolate de la casa.', categoria: 'Postres', precio: 15, imagen: '../../public/images/menu/brownie.png' }
];

const catalogo = document.querySelector('#catalogo');
const busqueda = document.querySelector('#busqueda');
const selectorCategoria = document.querySelector('#categoria');
const resumen = document.querySelector('#resumen');
const sinResultados = document.querySelector('#sin-resultados');

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function crearElemento(etiqueta, texto, clase) {
  const elemento = document.createElement(etiqueta);
  if (texto !== undefined) elemento.textContent = texto;
  if (clase) elemento.className = clase;
  return elemento;
}

function crearTarjeta(plato, indice) {
  const tarjeta = crearElemento('article', undefined, 'plato');
  const imagen = crearElemento('img', undefined, 'imagen-plato');
  imagen.src = plato.imagen;
  imagen.alt = plato.nombre;
  imagen.loading = 'lazy';
  const pie = crearElemento('div', undefined, 'pie-plato');
  pie.append(
    crearElemento('span', plato.categoria, 'categoria'),
    crearElemento('strong', `Q ${plato.precio.toFixed(2)}`)
  );
  tarjeta.append(
    imagen,
    crearElemento('span', String(indice + 1).padStart(2, '0'), 'numero'),
    crearElemento('h2', plato.nombre),
    crearElemento('p', plato.descripcion),
    pie
  );
  return tarjeta;
}

function mostrarCatalogo() {
  const texto = normalizar(busqueda.value.trim());
  const categoria = selectorCategoria.value;
  const resultados = platos.filter(plato => {
    const coincideTexto = normalizar(`${plato.nombre} ${plato.descripcion}`).includes(texto);
    const coincideCategoria = categoria === 'todas' || plato.categoria === categoria;
    return coincideTexto && coincideCategoria;
  });

  catalogo.replaceChildren(...resultados.map(crearTarjeta));
  resumen.textContent = `${resultados.length} ${resultados.length === 1 ? 'plato encontrado' : 'platos encontrados'}`;
  sinResultados.hidden = resultados.length > 0;
}

const categorias = [...new Set(platos.map(plato => plato.categoria))].sort();
categorias.forEach(categoria => {
  const opcion = crearElemento('option', categoria);
  opcion.value = categoria;
  selectorCategoria.append(opcion);
});

busqueda.addEventListener('input', mostrarCatalogo);
selectorCategoria.addEventListener('change', mostrarCatalogo);
document.querySelector('#limpiar').addEventListener('click', () => {
  busqueda.value = '';
  selectorCategoria.value = 'todas';
  mostrarCatalogo();
  busqueda.focus();
});

mostrarCatalogo();
