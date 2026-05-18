-- ============================================================
-- Andaluzzia — Seed de datos de prueba
-- Versión: 2026-03
-- Ejecutar DESPUÉS de 001_schema.sql
-- ============================================================

-- ── TAPAS (carta actual ampliada) ─────────────────────────────────────
INSERT INTO tapas (nombre, precio, descripcion, ingredientes, alergenos, categoria, popular, es_recomendado, es_lo_mas_rico, es_plato_dia, maridaje, origen, disponible, orden) VALUES

('Montadito de Pringa', 2.50,
 'Montadito sevillano de pringa de cocido, jugoso y con pan crujiente.',
 ARRAY['pan','carnes de cocido'], ARRAY['gluten'],
 'calientes', TRUE, TRUE, FALSE, FALSE,
 'Cruzcampo de grifo', 'Clasico de la casa en Triana.', TRUE, 1),

('Espinacas con Garbanzos', 3.50,
 'Receta tradicional con comino y pimenton, textura melosa y sabor redondo.',
 ARRAY['espinacas','garbanzos','ajo'], ARRAY[]::TEXT[],
 'calientes', TRUE, TRUE, FALSE, FALSE,
 'Manzanilla fria', 'Receta andaluza de siempre.', TRUE, 2),

('Mejillones a la Marinera', 4.80,
 'Mejillones en salsa marinera casera con tomate, vino blanco y toque picante.',
 ARRAY['mejillones','tomate','vino blanco'], ARRAY['moluscos','sulfitos'],
 'pescaíto', TRUE, FALSE, FALSE, TRUE,
 'Fino Tio Pepe', 'Producto del mar con salsa de la casa.', TRUE, 3),

('Croquetas de Jamon Iberico', 5.50,
 'Croquetas cremosas de jamon iberico, crujientes por fuera.',
 ARRAY['jamon iberico','harina','leche'], ARRAY['gluten','lactosa'],
 'calientes', TRUE, TRUE, FALSE, FALSE,
 'Cruzcampo bien fria', 'Receta clasica de cocina casera.', TRUE, 4),

('Gambas al Ajillo', 8.50,
 'Gambas de Huelva al ajillo en cazuela de barro con guindilla y perejil.',
 ARRAY['gambas','ajo','AOVE'], ARRAY['crustáceos'],
 'pescaíto', TRUE, TRUE, TRUE, FALSE,
 'Fino o manzanilla', 'Plato estrella de la semana.', TRUE, 5),

('Flamenquin Cordobes', 4.20,
 'Flamenquin crujiente con relleno tradicional y toque sevillano.',
 ARRAY['cerdo','jamon','pan rallado'], ARRAY['gluten','huevo'],
 'carnes', TRUE, FALSE, FALSE, FALSE,
 'Tinto joven', 'Version cordobesa adaptada a la casa.', TRUE, 6),

('Ceviche de Corvina', 11.00,
 'Corvina marinada en limon, cilantro y cebolla morada.',
 ARRAY['corvina','limon','cebolla morada'], ARRAY['pescado'],
 'frías', TRUE, TRUE, FALSE, FALSE,
 'Albarino frio', 'Fuera de carta en fin de semana.', TRUE, 7),

('Rabo de Toro Estofado', 13.50,
 'Rabo de toro guisado a fuego lento con verduras y vino tinto.',
 ARRAY['rabo de toro','verduras','vino tinto'], ARRAY['sulfitos','apio'],
 'carnes', TRUE, FALSE, TRUE, FALSE,
 'Ribera del Duero', 'Guiso largo de tradicion andaluza.', TRUE, 8),

('Salmorejo Cordobes', 3.80,
 'Salmorejo suave con AOVE, huevo duro y jamon en virutas.',
 ARRAY['tomate','pan','AOVE'], ARRAY['gluten','huevo'],
 'frías', TRUE, FALSE, FALSE, FALSE,
 'Manzanilla', 'Clasico frio para todo el ano.', TRUE, 9),

('Ensaladilla de Pulpo', 7.90,
 'Ensaladilla cremosa con pulpo tierno, una de las mas pedidas.',
 ARRAY['patata','pulpo','mayonesa'], ARRAY['moluscos','huevo'],
 'frías', TRUE, TRUE, FALSE, FALSE,
 'Verdejo', 'Entrante destacado por clientes.', TRUE, 10),

('Lingote de Foie con Manzana y Queso de Cabra', 9.80,
 'Foie marcado con manzana caramelizada y queso de cabra.',
 ARRAY['foie','manzana','queso de cabra'], ARRAY['lactosa'],
 'frías', FALSE, TRUE, FALSE, FALSE,
 'Pedro Ximenez', 'Entrante de perfil gourmet.', TRUE, 11),

('Ensalada Cesar', 6.90,
 'Lechuga romana, pollo crujiente, parmesano y salsa cesar casera.',
 ARRAY['lechuga','pollo','parmesano'], ARRAY['huevo','lactosa'],
 'frías', FALSE, FALSE, FALSE, TRUE,
 'Blanco joven', 'Ensalada clasica para compartir.', TRUE, 12),

('Boquerones al Limon', 6.20,
 'Boqueron fresco marinado al limon y frito al momento.',
 ARRAY['boquerones','limon','harina'], ARRAY['pescado','gluten'],
 'pescaíto', TRUE, FALSE, FALSE, FALSE,
 'Cerveza fria', 'Fritura marinera tradicional.', TRUE, 13),

('Cartucho de Chocos', 7.40,
 'Choco en fritura fina y crujiente, servido en cartucho.',
 ARRAY['chocos','harina de fritura'], ARRAY['moluscos','gluten'],
 'pescaíto', TRUE, FALSE, FALSE, FALSE,
 'Manzanilla', 'Clasico del sur.', TRUE, 14),

('Pez Arana en Adobo', 7.10,
 'Pescado en adobo andaluz con fritura dorada.',
 ARRAY['pez arana','adobo','harina'], ARRAY['pescado','gluten'],
 'pescaíto', FALSE, FALSE, FALSE, FALSE,
 'Fino', 'Adobo de estilo gaditano.', TRUE, 15),

('Tacos de Camaron con Guacamole y Sriracha', 8.40,
 'Tacos de camaron con guacamole fresco y toque picante.',
 ARRAY['camaron','guacamole','sriracha'], ARRAY['crustáceos'],
 'especiales', TRUE, FALSE, FALSE, FALSE,
 'IPA suave', 'Fusion de cocina andaluza y callejera.', TRUE, 16),

('Patatas Bravas', 5.60,
 'Patata dorada con salsa brava casera y punto picante equilibrado.',
 ARRAY['patata','salsa brava'], ARRAY[]::TEXT[],
 'calientes', TRUE, TRUE, FALSE, FALSE,
 'Lager', 'Uno de los platos mas pedidos.', TRUE, 17),

('Flamenquin de Cecina y Queso Brie', 8.90,
 'Flamenquin version premium con cecina y corazon de brie.',
 ARRAY['cecina','brie','pan rallado'], ARRAY['gluten','lactosa','huevo'],
 'carnes', TRUE, FALSE, FALSE, FALSE,
 'Tempranillo', 'Version de autor de un clasico.', TRUE, 18),

('Socarrat de Arroz Negro', 10.90,
 'Arroz negro con fondo de marisco y socarrat intenso.',
 ARRAY['arroz','caldo de marisco'], ARRAY['crustáceos','moluscos'],
 'pescaíto', TRUE, TRUE, FALSE, FALSE,
 'Albarino', 'Especial recomendado en fines de semana.', TRUE, 19),

('Canelones Caseros', 8.20,
 'Canelones gratinados con relleno meloso y bechamel ligera.',
 ARRAY['pasta','carne','bechamel'], ARRAY['gluten','lactosa'],
 'calientes', FALSE, FALSE, FALSE, FALSE,
 'Rioja joven', 'Plato casero de cuchara y horno.', TRUE, 20),

('Brioche de Ternera con Verduras', 9.20,
 'Pan brioche tostado con ternera jugosa y verduras salteadas.',
 ARRAY['brioche','ternera','verduras'], ARRAY['gluten'],
 'carnes', FALSE, FALSE, FALSE, FALSE,
 'Tinto suave', 'Bocado de estilo fusion.', TRUE, 21),

('Wok de Pollo Agridulce', 8.60,
 'Pollo salteado al wok con verduras y salsa agridulce.',
 ARRAY['pollo','verduras','salsa agridulce'], ARRAY['soja'],
 'especiales', FALSE, FALSE, FALSE, FALSE,
 'Blanco semiseco', 'Toque internacional en la carta.', TRUE, 22),

('Carrillera en Salsa', 10.40,
 'Carrillera iberica estofada lentamente hasta quedar melosa.',
 ARRAY['carrillera','verduras','vino'], ARRAY['sulfitos'],
 'carnes', TRUE, TRUE, FALSE, FALSE,
 'Ribera', 'Guiso intenso de larga coccion.', TRUE, 23),

('Bacalao al Pilpil', 11.40,
 'Lomo de bacalao confitado con salsa pilpil ligada al momento.',
 ARRAY['bacalao','ajo','AOVE'], ARRAY['pescado'],
 'pescaíto', TRUE, FALSE, FALSE, FALSE,
 'Txakoli', 'Plato marinero de tecnica clasica.', TRUE, 24),

('Tosta de Bacalao', 4.90,
 'Tosta crujiente con bacalao desalado y aliño citrico.',
 ARRAY['pan','bacalao'], ARRAY['gluten','pescado'],
 'frías', FALSE, FALSE, FALSE, FALSE,
 'Verdejo', 'Tapa fria de barra.', TRUE, 25),

('Tosta de Tartar de Vaca', 6.80,
 'Pan de masa madre con tartar de vaca y encurtidos finos.',
 ARRAY['pan','vaca','encurtidos'], ARRAY['gluten'],
 'frías', FALSE, FALSE, FALSE, FALSE,
 'Mencia', 'Tapa fria de perfil contemporaneo.', TRUE, 26),

('Steak Tartar', 12.50,
 'Tartar de solomillo cortado a cuchillo con yema curada.',
 ARRAY['ternera','yema','mostaza'], ARRAY['huevo'],
 'frías', TRUE, TRUE, FALSE, FALSE,
 'Rioja crianza', 'Plato premium de fines de semana.', TRUE, 27),

('Tataki de Atun', 10.80,
 'Atun rojo sellado con sesamo tostado y salsa ponzu citrica.',
 ARRAY['atun','sesamo','ponzu'], ARRAY['pescado','sésamo'],
 'frías', TRUE, FALSE, FALSE, FALSE,
 'Godello', 'Tapa fria marinera de fusion.', TRUE, 28),

('Torrija Casera', 5.20,
 'Torrija caramelizada al momento con helado de vainilla.',
 ARRAY['pan brioche','leche','huevo'], ARRAY['gluten','lactosa','huevo'],
 'postres', TRUE, TRUE, FALSE, FALSE,
 'PX', 'Postre clasico muy valorado.', TRUE, 29),

('Brownie Blanco', 5.60,
 'Brownie de chocolate blanco con nuez y crema inglesa.',
 ARRAY['chocolate blanco','nuez','huevo'], ARRAY['huevo','lactosa','frutos secos'],
 'postres', TRUE, FALSE, FALSE, FALSE,
 'Cafe', 'Postre moderno de la casa.', TRUE, 30),

('Coulant de Chocolate', 5.90,
 'Bizcocho caliente con corazon fundente de chocolate negro.',
 ARRAY['chocolate','huevo','harina'], ARRAY['gluten','huevo','lactosa'],
 'postres', TRUE, TRUE, FALSE, FALSE,
 'Pedro Ximenez', 'Postre estrella para cerrar la cena.', TRUE, 31);

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
