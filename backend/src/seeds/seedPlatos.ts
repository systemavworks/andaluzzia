/**
 * Seed de datos iniciales para Andaluzzia.
 * Ejecutar con: npx ts-node src/seeds/seedPlatos.ts
 *
 * Pobla la BD con tapas sevillanas auténticas, bebidas, mesas y horarios especiales.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Plato }           from '../models/Plato';
import { Mesa }            from '../models/Mesa';
import { HorarioEspecial } from '../models/HorarioEspecial';

// ─── Tapas ───────────────────────────────────────────────────────────────────

const tapas = [
  {
    nombre:        'Espinacas con Garbanzos',
    descripcion:   'El plato más sevillano que existe. Espinacas frescas salteadas con garbanzos cocidos, comino, pimentón de La Vera y un toque de vinagre de Jerez. Receta de la abuela Lola desde 1985.',
    precio:        4.50,
    categoria:     'tapas',
    esRecomendado: true,
    esLoMasRico:   true,
    maridaje:      'Cruzcampo bien tirada o manzanilla de Sanlúcar',
    origen:        'Tradición árabe-andaluza. Plato humilde de los barrios de Triana y San Bernardo.',
    alergenos:     ['gluten'],
    orden:         1,
  },
  {
    nombre:        'Pringá de Puchero',
    descripcion:   'La joya de Triana. Mezcla de carnes del cocido sevillano (pollo, ternera, cerdo, tocino y chorizo) desmenuzada y sofrita. Se sirve en montadito con pan de telera.',
    precio:        3.50,
    categoria:     'tapas',
    esRecomendado: true,
    esLoMasRico:   true,
    maridaje:      'Cruzcampo de barril — no se entiende la una sin la otra',
    origen:        'Aprovechamiento del cocido sevillano. Patrimonio gastronómico de Sevilla.',
    alergenos:     ['gluten', 'leche'],
    orden:         2,
  },
  {
    nombre:        'Solomillo al Whisky',
    descripcion:   'Medallones de solomillo de cerdo ibérico en salsa de whisky con ajo, perejil y pimienta negra. La tapa que triunfa desde los 70 en el barrio de los Remedios. Servido con patatas fritas.',
    precio:        6.50,
    categoria:     'tapas',
    esRecomendado: true,
    esLoMasRico:   true,
    maridaje:      'Cruzcampo especial o vino tinto de la tierra',
    origen:        'Creado en los años 70 en Sevilla. La versión más copiada fuera de Andalucía.',
    alergenos:     ['sulfitos'],
    orden:         3,
  },
  {
    nombre:        'Gambas al Ajillo',
    descripcion:   'Gambas blancas de Huelva salteadas en aceite de oliva virgen extra con ajo laminado, guindilla y perejil fresco. Se sirven en cazuela de barro chisporroteando.',
    precio:        8.50,
    categoria:     'tapas',
    esRecomendado: true,
    maridaje:      'Fino en rama o cerveza Cruzcampo muy fría',
    origen:        'Gambas de la costa onubense, las mejores del mundo según los entendidos.',
    alergenos:     ['crustáceos', 'moluscos'],
    orden:         4,
  },
  {
    nombre:        'Tortillita de Camarones',
    descripcion:   'Crujiente fritura gaditana de camarones frescos con harina de garbanzo, cebolleta y perejil. Llega a la mesa recién frita, dorada como el sol de Cádiz.',
    precio:        5.50,
    categoria:     'tapas',
    esRecomendado: true,
    maridaje:      'Rebujito (manzanilla + 7-Up) o una Cruzcampo fresquita',
    alergenos:     ['crustáceos', 'gluten', 'moluscos'],
    orden:         5,
  },
  {
    nombre:        'Montadito de Lomo en Manteca Colorá',
    descripcion:   'Lomo de cerdo ibérico macerado en manteca coloreada con pimentón, ajo y especias. Curado artesanalmente 48h. Se sirve en pan de telera sevillano recién horneado.',
    precio:        3.20,
    categoria:     'tapas',
    maridaje:      'Cruzcampo de botellín bien fría',
    origen:        'Técnica ancestral de conservación andaluza. Los carniceros de El Arenal guardan el secreto.',
    alergenos:     ['gluten', 'leche'],
    orden:         6,
  },
  {
    nombre:        'Boquerones en Vinagre',
    descripcion:   'Boquerones de la bahía gaditana marinados 24h en vinagre de Jerez, aliñados con ajo, aceite de oliva y perejil. Tapa de veraneo y de toda la vida.',
    precio:        4.80,
    categoria:     'tapas',
    maridaje:      'Cerveza Cruzcampo o manzanilla bien fría',
    alergenos:     ['pescado'],
    orden:         7,
  },
  {
    nombre:        'Cazón en Adobo',
    descripcion:   'Dados de cazón marinados una noche en adobo de ajo, orégano, comino y pimentón. Rebozados en harina y fritos en aceite de oliva hasta dorar. El bienmesabé del mar.',
    precio:        5.50,
    categoria:     'tapas',
    maridaje:      'Cruzcampo muy fría — el rebujito es para los perezosos',
    origen:        'El adobo sevillano tiene raíces fenicias. Sin él no se entiende ninguna fritanga andaluza.',
    alergenos:     ['pescado', 'gluten'],
    orden:         8,
  },
  {
    nombre:        'Croquetas de Jamón Ibérico',
    descripcion:   'Bechamel densa con tropezones de jamón ibérico de bellota, rebozadas a mano y fritas en aceite de oliva. Crujientes por fuera, cremosas por dentro. Como las hacía la Conchi.',
    precio:        5.00,
    categoria:     'tapas',
    esRecomendado: true,
    maridaje:      'Cruzcampo de grifo o fino de Jerez',
    alergenos:     ['gluten', 'leche', 'huevo'],
    orden:         9,
  },
  {
    nombre:        'Patatas Bravas con Alioli',
    descripcion:   'Patatas fritas en aceite de oliva con salsa brava casera (pimentón, caldo, cayena) y alioli de ajo asado. El picante justo, sin pasarse, que esto es Sevilla.',
    precio:        4.00,
    categoria:     'tapas',
    maridaje:      'Cruzcampo en tubo',
    alergenos:     ['huevo'],
    orden:         10,
  },
  {
    nombre:        'Huevos a la Flamenca',
    descripcion:   'Huevos camperos en cazuela de barro con sofrito de tomate, pimientos, chorizo, jamón y guisantes. Al horno hasta que la clara cuaja. Plato de domingo y de Feria.',
    precio:        7.50,
    categoria:     'tapas',
    esLoMasRico:   true,
    maridaje:      'Rebujito de Feria o cerveza Cruzcampo',
    origen:        'Plato típico de las ventas sevillanas del siglo XIX. La Feria de Abril no sería lo mismo sin ellos.',
    alergenos:     ['huevo', 'gluten'],
    orden:         11,
  },
  {
    nombre:        'Mollejas de Pollo al Ajillo',
    descripcion:   'Mollejas de pollo de corral salteadas con ajo, vino fino de Jerez, limón y guindilla. Tapa de siempre en los bares de Triana. No la mires, cómetela.',
    precio:        5.50,
    categoria:     'tapas',
    maridaje:      'Fino de La Guita o Cruzcampo de grifería',
    alergenos:     ['sulfitos'],
    orden:         12,
  },
];

// ─── Raciones ────────────────────────────────────────────────────────────────

const raciones = [
  {
    nombre:        'Plato de Jamón Ibérico de Bellota',
    descripcion:   'Jamón ibérico de bellota cortado a cuchillo, de cerdo pata negra criado en la dehesa de Jabugo. La ración que se comparte en las bodas, bautizos y comuniones de Sevilla.',
    precio:        18.00,
    categoria:     'raciones',
    esLoMasRico:   true,
    maridaje:      'Fino en rama, manzanilla o cualquier vino blanco de Jerez',
    origen:        'Denominación de Origen Jabugo, Sierra Norte de Huelva.',
    alergenos:     [],
    orden:         20,
  },
  {
    nombre:        'Ensaladilla Rusa de la Casa',
    descripcion:   'Patata, zanahoria, atún del sur, aceitunas, pimientos asados y mayonesa casera. La ensaladilla que no puede faltar en ningún bar sevillano que se precie.',
    precio:        6.50,
    categoria:     'raciones',
    esRecomendado: true,
    maridaje:      'Cruzcampo de barril muy fría',
    alergenos:     ['huevo', 'pescado'],
    orden:         21,
  },
  {
    nombre:        'Carrillada Ibérica al Pedro Ximénez',
    descripcion:   'Carrillada de cerdo ibérico estofada 4 horas en vino Pedro Ximénez, naranja de Sevilla y especias. Se deshace en la boca. El plato que piden los que saben.',
    precio:        14.00,
    categoria:     'raciones',
    esLoMasRico:   true,
    esRecomendado: true,
    maridaje:      'Vino tinto de Rioja Reserva o un oloroso seco',
    origen:        'Guiso tradicional de matanza sevillana, adaptado a los tiempos.',
    alergenos:     ['sulfitos'],
    orden:         22,
  },
  {
    nombre:        'Puntillitas Fritas',
    descripcion:   'Chopitos de la bahía de Cádiz, enharinados en harina especial de fritura andaluza y fritos en abundante aceite de oliva. Crujientes, tiernos, perfectos.',
    precio:        11.00,
    categoria:     'raciones',
    esRecomendado: true,
    maridaje:      'Cruzcampo tubo grande o manzanilla de Sanlúcar',
    alergenos:     ['moluscos', 'gluten'],
    orden:         23,
  },
  {
    nombre:        'Rabo de Toro Estofado',
    descripcion:   'Rabo de toro bravo cocinado a fuego lento con verduras, vino tinto y especias durante 6 horas. Receta que viene de las ferias ganaderas del sur. Para valientes.',
    precio:        15.00,
    categoria:     'raciones',
    esLoMasRico:   true,
    maridaje:      'Vino tinto de Montilla-Moriles o un Ribera del Duero',
    origen:        'Plato de taberna del siglo XVIII, ligado a las corridas y ferias del sur.',
    alergenos:     ['sulfitos', 'apio'],
    orden:         24,
  },
];

// ─── Postres ─────────────────────────────────────────────────────────────────

const postres = [
  {
    nombre:        'Torrijas de Semana Santa',
    descripcion:   'Pan brioche empapado en leche con canela, rebozado en huevo y frito. Bañado en almíbar de miel de caña y espolvoreado con canela. La tradición sevillana por excelencia.',
    precio:        4.50,
    categoria:     'postres',
    esRecomendado: true,
    maridaje:      'Café solo o moscatel de Chipiona',
    origen:        'Las torrijas llegaron a Sevilla con los conventos del siglo XV. Hoy son Patrimonio Inmaterial.',
    alergenos:     ['gluten', 'leche', 'huevo'],
    orden:         40,
  },
  {
    nombre:        'Bienmesabe de Almendra',
    descripcion:   'Crema dulce de almendras molidas, azúcar, yemas de huevo y canela. El postre convento de las monjas clarisas de Sevilla. Se sirve frío con bizcocho de soletilla.',
    precio:        4.00,
    categoria:     'postres',
    esLoMasRico:   true,
    maridaje:      'Pedro Ximénez helado',
    origen:        'Herencia morisca, elaborado en conventos sevillanos desde el siglo XVI.',
    alergenos:     ['frutos secos', 'huevo', 'gluten'],
    orden:         41,
  },
  {
    nombre:        'Pestiños con Miel',
    descripcion:   'Pastelitos de masa frita con anís y ajonjolí, bañados en miel de caña de la Axarquía. Dulce de Navidad y Semana Santa, aunque en Andaluzzia los hacemos todo el año.',
    precio:        3.80,
    categoria:     'postres',
    maridaje:      'Anís del mono o café con leche',
    alergenos:     ['gluten', 'sésamo'],
    orden:         42,
  },
  {
    nombre:        'Flan de Naranja de Sevilla',
    descripcion:   'Flan casero de huevo con zumo y ralladura de naranja amarga de Sevilla, caramelo oscuro. El cítrico sevillano en formato postre. Fresco, cremoso y con personalidad.',
    precio:        3.50,
    categoria:     'postres',
    maridaje:      'Café solo bien cargado',
    alergenos:     ['huevo', 'leche'],
    orden:         43,
  },
];

// ─── Bebidas ─────────────────────────────────────────────────────────────────

const bebidas = [
  {
    nombre:        'Cruzcampo de Barril (Tubo)',
    descripcion:   'La cerveza de Sevilla por antonomasia. Tubo de 33cl servido en vaso frío, espuma perfecta, temperatura exacta a 3°C. Como manda la tradición de Triana.',
    precio:        2.50,
    categoria:     'bebidas',
    esRecomendado: true,
    esLoMasRico:   true,
    origen:        'Fundada en Sevilla en 1904. La cerveza que se toma con las tapas desde hace 120 años.',
    orden:         50,
  },
  {
    nombre:        'Cruzcampo Gran Reserva (Botellín)',
    descripcion:   'Cruzcampo Gran Reserva en botellín de 33cl. Más malta, más carácter. La premium de la casa sevillana. Para los que quieren algo especial.',
    precio:        3.00,
    categoria:     'bebidas',
    orden:         51,
  },
  {
    nombre:        'Rebujito de Feria',
    descripcion:   'La combinación reina de la Feria de Abril: manzanilla de Sanlúcar + 7-Up con mucho hielo, yerbabuena y limón. El trago de las casetas de Sevilla.',
    precio:        4.50,
    categoria:     'bebidas',
    esRecomendado: true,
    maridaje:      'Acompaña todo lo que se mueva en esta carta',
    alergenos:     ['sulfitos'],
    orden:         52,
  },
  {
    nombre:        'Manzanilla de Sanlúcar',
    descripcion:   'Copa de manzanilla de las bodegas Barbadillo de Sanlúcar de Barrameda. El vino más fresco y salino del sur. Imprescindible con el jamón y las gambas.',
    precio:        3.50,
    categoria:     'bebidas',
    esLoMasRico:   true,
    maridaje:      'Jamón ibérico, gambas al ajillo, boquerones',
    alergenos:     ['sulfitos'],
    origen:        'Vino único en el mundo por la influencia del mar y del viento del Atlántico sobre las botas.',
    orden:         53,
  },
  {
    nombre:        'Fino de Jerez',
    descripcion:   'Copa de fino del Marco de Jerez, fresco y seco, con ese toque de levadura que lo hace único. El vino del sur. La cepa palomino manda.',
    precio:        3.20,
    categoria:     'bebidas',
    maridaje:      'Croquetas, mollejas, jamón, mariscos',
    alergenos:     ['sulfitos'],
    orden:         54,
  },
  {
    nombre:        'Pedro Ximénez',
    descripcion:   'Copa de Pedro Ximénez de Montilla-Moriles. Dulce, espeso, con aromas de pasas, higos secos y café. El postre líquido de Andalucía. Se sirve muy frío.',
    precio:        4.00,
    categoria:     'bebidas',
    maridaje:      'Bienmesabe, flan, cualquier postre — o solo',
    alergenos:     ['sulfitos'],
    origen:        'La uva Pedro Ximénez se seca al sol en las paseras de Córdoba y Málaga. Dulzor natural, sin añadir azúcar.',
    orden:         55,
  },
  {
    nombre:        'Agua Mineral (50cl)',
    descripcion:   'Agua mineral natural de manantial andaluz, botella de 50cl. Con gas o sin gas.',
    precio:        1.50,
    categoria:     'bebidas',
    orden:         56,
  },
  {
    nombre:        'Café Solo Sevillano',
    descripcion:   'Café solo de mezcla de tueste natural, servido en taza caliente. La mezcla que usan los bares de Sevilla de toda la vida. Corto, cargado, perfecto.',
    precio:        1.80,
    categoria:     'bebidas',
    orden:         57,
  },
  {
    nombre:        'Anís El Mono',
    descripcion:   'Chupito de anís El Mono, el licor de Badalona que adoptó Andalucía como propio. Dulce o seco, como prefiera.',
    precio:        2.80,
    categoria:     'bebidas',
    alergenos:     ['sulfitos'],
    orden:         58,
  },
];

// ─── Especiales (plato del día y temporada) ──────────────────────────────────

const especiales = [
  {
    nombre:        'Plato del Día: Cocido Sevillano',
    descripcion:   'El puchero sevillano completo: garbanzos de Pedrera, verduras de temporada, pollo de corral, ternera morcillo, chorizo, morcilla y tocino. Las carnes se sirven como pringá al día siguiente. Solo los martes y jueves.',
    precio:        12.00,
    categoria:     'especiales',
    esPlatoDia:    true,
    esLoMasRico:   true,
    esRecomendado: true,
    maridaje:      'Cruzcampo de barril clara y fresca',
    origen:        'El cocido sevillano bebe del puchero andalusí. El azafrán y el comino son el sello de Triana.',
    alergenos:     ['gluten', 'apio'],
    orden:         60,
  },
  {
    nombre:        'Menú de Degustación Andaluzzia (6 tapas + postre + bebida)',
    descripcion:   '6 tapas de la selección del maitre + postre del día + Cruzcampo o manzanilla. El chef elige según el mercado de por la mañana. La mejor manera de conocer el restaurante.',
    precio:        25.00,
    categoria:     'especiales',
    esRecomendado: true,
    esLoMasRico:   true,
    maridaje:      'Incluido en el precio',
    orden:         61,
  },
];

// ─── Mesas ───────────────────────────────────────────────────────────────────

const mesas = [
  { numero: 1,  zona: 'terraza',  capacidad: 2,  notas: 'Vista al río Guadalquivir' },
  { numero: 2,  zona: 'terraza',  capacidad: 2,  notas: 'Vista al río Guadalquivir' },
  { numero: 3,  zona: 'terraza',  capacidad: 4,  notas: 'Esquina con sombra, ideal mediodía' },
  { numero: 4,  zona: 'terraza',  capacidad: 4 },
  { numero: 5,  zona: 'terraza',  capacidad: 6,  notas: 'Mesa grande junto a la maceta de geranios' },
  { numero: 6,  zona: 'interior', capacidad: 2,  notas: 'Junto a la ventana con azulejos de Triana' },
  { numero: 7,  zona: 'interior', capacidad: 2 },
  { numero: 8,  zona: 'interior', capacidad: 4,  notas: 'Centro del salón, bajo la lámpara de forja' },
  { numero: 9,  zona: 'interior', capacidad: 4 },
  { numero: 10, zona: 'interior', capacidad: 4 },
  { numero: 11, zona: 'interior', capacidad: 6,  notas: 'Mesa familiar, ideal para grupos' },
  { numero: 12, zona: 'interior', capacidad: 8,  notas: 'Mesa larga para celebraciones' },
  { numero: 13, zona: 'barra',    capacidad: 1,  notas: 'Taburete 1 — barra de madera de caoba' },
  { numero: 14, zona: 'barra',    capacidad: 1,  notas: 'Taburete 2' },
  { numero: 15, zona: 'barra',    capacidad: 1,  notas: 'Taburete 3' },
  { numero: 16, zona: 'barra',    capacidad: 1,  notas: 'Taburete 4' },
  { numero: 17, zona: 'privado',  capacidad: 12, notas: 'Salón privado "La Giralda" — reserva mínima 8 personas. Decoración exclusiva.' },
  { numero: 18, zona: 'privado',  capacidad: 20, notas: 'Salón grande "La Maestranza" — eventos, comuniones, cenas de empresa' },
];

// ─── Horarios especiales ─────────────────────────────────────────────────────

const horariosEspeciales = [
  {
    fecha:       new Date('2026-04-12'),
    descripcion: 'Domingo de Ramos — Cierre por procesión en Calle Betis',
    tipo:        'cierre',
    activo:      true,
  },
  {
    fecha:       new Date('2026-04-17'),
    descripcion: 'Viernes Santo — Cierre por respeto a la tradición sevillana',
    tipo:        'cierre',
    activo:      true,
  },
  {
    fecha:       new Date('2026-04-21'),
    descripcion: 'Feria de Abril — Horario especial de tarde-noche',
    tipo:        'horario_reducido',
    horaApertura: '16:00',
    horaCierre:   '03:00',
    activo:      true,
  },
  {
    fecha:       new Date('2026-04-25'),
    descripcion: 'Feria de Abril — Horario especial último día',
    tipo:        'evento',
    horaApertura: '12:00',
    horaCierre:   '03:00',
    activo:      true,
  },
];

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ Conectado a MongoDB');

  // Vaciar colecciones antes de poblar
  await Promise.all([
    Plato.deleteMany({}),
    Mesa.deleteMany({}),
    HorarioEspecial.deleteMany({}),
  ]);
  console.log('🗑️  Colecciones vaciadas');

  const todosLosPlatos = [...tapas, ...raciones, ...postres, ...bebidas, ...especiales];
  await Plato.insertMany(todosLosPlatos);
  console.log(`🍽️  ${todosLosPlatos.length} platos insertados`);

  await Mesa.insertMany(mesas);
  console.log(`🪑  ${mesas.length} mesas insertadas`);

  await HorarioEspecial.insertMany(horariosEspeciales);
  console.log(`📅  ${horariosEspeciales.length} horarios especiales insertados`);

  console.log('');
  console.log('🎉 ¡Seed completado! Andaluzzia está lista para abrir.');
  console.log('');
  console.log('Resumen:');
  console.log(`  Tapas:       ${tapas.length}`);
  console.log(`  Raciones:    ${raciones.length}`);
  console.log(`  Postres:     ${postres.length}`);
  console.log(`  Bebidas:     ${bebidas.length}`);
  console.log(`  Especiales:  ${especiales.length}`);
  console.log(`  Mesas:       ${mesas.length}`);
  console.log(`  Horarios:    ${horariosEspeciales.length}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
