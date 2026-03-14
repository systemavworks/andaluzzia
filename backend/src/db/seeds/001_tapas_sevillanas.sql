-- ============================================================
-- Andaluzzia — Seed de datos de prueba
-- Versión: 2026-03
-- Ejecutar DESPUÉS de 001_schema.sql
-- ============================================================

-- ── TAPAS (12 tapas típicas sevillanas) ─────────────────────────────────────
INSERT INTO tapas (nombre, precio, descripcion, ingredientes, alergenos, categoria, popular, es_recomendado, es_lo_mas_rico, es_plato_dia, maridaje, origen, disponible, orden) VALUES

('Salmorejo Cordobés',        4.50,
 'Crema fría de tomate y pan con huevo duro, jamón ibérico y AOVE Hojiblanca.',
 ARRAY['tomate','pan','ajo','AOVE','huevo','jamón ibérico'],
 ARRAY['gluten','huevo'],
 'frías', TRUE, TRUE, TRUE, FALSE,
 'Manzanilla La Gitana bien fresquita',
 'Receta de la abuela Lola. El tomate viene directamente de la Vega de la Rinconada.',
 TRUE, 1),

('Tortillitas de Camarones',  5.20,
 'Tortillitas crujientes de camarones de la bahía de Cádiz, fritas al momento.',
 ARRAY['camarones','harina de garbanzo','harina de trigo','cebolleta','perejil'],
 ARRAY['gluten','crustáceos'],
 'pescaíto', TRUE, TRUE, FALSE, FALSE,
 'Fino En Rama Tío Pepe o Cruzcampo bien tirada',
 'Plato gaditano adoptado por Triana. Solo con camarones frescos, nunca congelados.',
 TRUE, 2),

('Pringá de Puchero',         3.80,
 'Carnes del cocido (cerdo, pollo, chorizo, morcilla) desmenuzadas sobre pan telera.',
 ARRAY['cerdo','pollo','chorizo','morcilla','panceta','pan'],
 ARRAY['gluten'],
 'calientes', TRUE, TRUE, TRUE, FALSE,
 'Cruzcampo de grifo, que va de maravilla',
 'La pringá es el alma del puchero sevillano. Receta de la casa desde 1987.',
 TRUE, 3),

('Gambas al Ajillo',          7.50,
 'Gambas de Huelva salteadas en aceite de oliva virgen con ajo laminado y guindilla.',
 ARRAY['gambas','AOVE','ajo','guindilla','perejil'],
 ARRAY['crustáceos'],
 'calientes', TRUE, TRUE, TRUE, FALSE,
 'Fino o manzanilla muy fríos',
 'Las gambas llegan de La Lonja de Huelva tres veces por semana.',
 TRUE, 4),

('Solomillo al Whisky',       9.80,
 'Medallones de solomillo de cerdo ibérico en salsa de whisky con patatas panadera.',
 ARRAY['solomillo ibérico','whisky','ajo','pimienta','patatas'],
 ARRAY['sulfitos'],
 'carnes', TRUE, FALSE, TRUE, FALSE,
 'Ribera del Duero Crianza o Cruzcampo Premium',
 'El plato favorito de los sevillanos para celebrar. Secreto: la salsa lleva manzanilla.',
 TRUE, 5),

('Espinacas con Garbanzos',   4.20,
 'Espinacas frescas con garbanzos pedrosillanos, comino, pimentón y vinagre de Jerez.',
 ARRAY['espinacas','garbanzos','ajo','comino','pimentón','vinagre de Jerez'],
 ARRAY[],
 'calientes', TRUE, TRUE, FALSE, FALSE,
 'Pan con aceite o una Cruzcampo',
 'El plato más sevillano que existe. Receta heredada de la cocina árabe-andaluza.',
 TRUE, 6),

('Croquetas de Jamón Ibérico', 4.90,
 'Croquetas caseras de bechamel espesa con viruta de jamón ibérico de bellota.',
 ARRAY['jamón ibérico','harina','leche','mantequilla','nuez moscada'],
 ARRAY['gluten','lactosa'],
 'calientes', TRUE, TRUE, FALSE, FALSE,
 'Fría Cruzcampo lager o Manzanilla Sanlúcar',
 'Las más crujientes de Triana. La bechamel reposa 24 horas mínimo.',
 TRUE, 7),

('Montadito de Lomo en Manteca', 2.80,
 'Pan viena con lomo de cerdo ibérico en manteca colorá y pimientos asados.',
 ARRAY['lomo ibérico','manteca colorá','pan','pimientos asados'],
 ARRAY['gluten'],
 'frías', FALSE, TRUE, FALSE, FALSE,
 'Cruzcampo de tapon muy fría',
 'Clásico del tapeo de Sevilla. La manteca colorá llega de Montellano.',
 TRUE, 8),

('Huevos a la Flamenca',      6.50,
 'Huevos al horno sobre sofrito de tomate, jamón, chorizo y guisantes. Con pan.',
 ARRAY['huevos','tomate','jamón','chorizo','guisantes','pimientos','pan'],
 ARRAY['gluten','huevo'],
 'calientes', FALSE, FALSE, TRUE, FALSE,
 'Fino o Cruzcampo lager',
 'Plato del Siglo XVIII sevillano. Nacieron en las tabernas de Triana.',
 TRUE, 9),

('Berenjenas con Miel de Caña', 4.20,
 'Berenjenas en tempura crujiente con miel de caña de la Costa Tropical granadina.',
 ARRAY['berenjenas','harina','huevo','miel de caña'],
 ARRAY['gluten','huevo'],
 'calientes', TRUE, TRUE, FALSE, FALSE,
 'Vino blanco fresco o Cruzcampo',
 'El contraste dulce-salado que enamora. Plato de influencia árabe-granadina.',
 TRUE, 10),

('Cocido Sevillano',          8.90,
 'Puchero completo: garbanzos, carnes del cerdo, verduras y caldo de pringá.',
 ARRAY['garbanzos','cerdo','pollo','chorizo','morcilla','zanahoria','apio'],
 ARRAY['apio'],
 'especiales', FALSE, FALSE, FALSE, TRUE,
 'Manzanilla Barbadillo fría o vino tinto joven',
 'Solo martes y jueves. El plato que une a todo Sevilla.',
 TRUE, 11),

('Chicharrones de Cádiz',     4.10,
 'Chicharrones prensados de Cádiz con limón, sal gorda y pimentón picante.',
 ARRAY['cerdo','sal','pimentón','limón'],
 ARRAY[],
 'frías', FALSE, FALSE, FALSE, FALSE,
 'Cruzcampo de grifo muy fría',
 'Directamente de la carnicería Hermanos Jiménez en el Mercado del Carmen, Cádiz.',
 TRUE, 12);

-- ── VINOS Y BEBIDAS ─────────────────────────────────────────────────────────
INSERT INTO vinos (nombre, tipo, precio_copa, descripcion_corta, disponible) VALUES

('Manzanilla La Gitana',     'manzanilla',     2.80,
 'Manzanilla fresca y salina de Sanlúcar. Perfecta con pescaíto.', TRUE),

('Fino En Rama Tío Pepe',    'fino',           3.20,
 'El fino más famoso de Jerez. Sin filtrar, tal como sale del cañón.', TRUE),

('Ribera del Duero Crianza', 'tinto crianza',  4.50,
 'Tinto con carácter, taninos suaves. Va de lujo con las carnes.', TRUE),

('Albariño Rías Baixas',     'blanco',         4.20,
 'Blanco gallego fresco y aromático. Ideal para gambas y mariscos.', TRUE),

('Cruzcampo Lager',          'cerveza',        2.50,
 'La cerveza de Sevilla. De grifo, bien tirada y muy fría.', TRUE),

('Rosado Cigales',           'rosado',         3.50,
 'Rosado fresco y frutal de Cigales (Valladolid). Versátil pa todo.', TRUE);

-- ── MARIDAJES ───────────────────────────────────────────────────────────────
INSERT INTO maridajes (tapa_id, vino_id, recomendacion)
SELECT t.id, v.id, rec.recomendacion FROM (VALUES
    ('Gambas al Ajillo',           'Fino En Rama Tío Pepe',     'Escándalo de maridaje, miarma'),
    ('Gambas al Ajillo',           'Manzanilla La Gitana',      'Lo mejor con camarones y gambas'),
    ('Tortillitas de Camarones',   'Manzanilla La Gitana',      'El maridaje clásico gaditano'),
    ('Tortillitas de Camarones',   'Cruzcampo Lager',           'Sencillo pero perfecto'),
    ('Salmorejo Cordobés',         'Manzanilla La Gitana',      'La salinidad va de lujo'),
    ('Solomillo al Whisky',        'Ribera del Duero Crianza',  'Tinto con alma pa la carne'),
    ('Espinacas con Garbanzos',    'Cruzcampo Lager',           'Pa mojar el pan y que no sobre'),
    ('Berenjenas con Miel de Caña','Albariño Rías Baixas',      'El dulce necesita frescor'),
    ('Croquetas de Jamón Ibérico', 'Cruzcampo Lager',           'Las más pedidas con cañita'),
    ('Huevos a la Flamenca',       'Ribera del Duero Crianza',  'El tinto aguanta bien el sofrito')
) AS rec(tapa_nombre, vino_nombre, recomendacion)
JOIN tapas  t ON t.nombre = rec.tapa_nombre
JOIN vinos  v ON v.nombre = rec.vino_nombre;

-- ── MESAS ───────────────────────────────────────────────────────────────────
INSERT INTO mesas (numero, zona, capacidad, activa, notas) VALUES
(1,  'terraza',  4,  TRUE, 'Primera mesa nada entrar, vistas al Guadalquivir'),
(2,  'terraza',  4,  TRUE, NULL),
(3,  'terraza',  6,  TRUE, 'Mesa grande con sombrilla'),
(4,  'interior', 2,  TRUE, 'Mesa romántica al fondo'),
(5,  'interior', 4,  TRUE, NULL),
(6,  'interior', 4,  TRUE, NULL),
(7,  'interior', 8,  TRUE, 'Mesa larga pa grupos'),
(8,  'barra',    2,  TRUE, 'Dos taburetes en la barra'),
(9,  'barra',    2,  TRUE, NULL),
(10, 'privado',  12, TRUE, 'Salón privado pa celebraciones');
