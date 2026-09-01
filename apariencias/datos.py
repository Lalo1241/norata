# -*- coding: utf-8 -*-
"""Los siete ambientes, la escalera y los cinco rangos, en un solo sitio.

Vienen del chat que Eduardo llevó en el teléfono los días 29 y 30 de agosto y
que estaba solo en artifacts. Se recuperaron leyendo esos artifacts —«Recolores
de Norata», «Nivel de expedición», «Rangos de expedición» y «Camino a la
beta»— y se escriben aquí para que no vuelvan a vivir fuera del repositorio.

Ningún tono de abajo se eligió a ojo: están medidos, y las medidas están en
CONTRASTES. De aquí salen `ambientes.css` y la lámina del conjunto."""

# grado 0 = el de casa · 1 = solo el suelo · 2 = suelo y acento · 3 = además
# invierte algo que ningún otro toca
#
# Eran ocho. Reliquia se fue a `mundos/` el 30 de agosto: era lo único que
# Fundador tenía además de Pro —LIMITES no tiene entrada de fundador, así que
# Fundador ES Pro sin fecha— y un recolor no se vende. Un pago único de $890
# necesita algo que se vea, así que dejó de ser un color estirado por la app y
# pasó a ser un material. El lila vuelve a ser lo que era: la insignia.
AMBIENTES = [
 dict(id="casa", nombre="Noche de expedición", grado=0, abre="Desde el día uno",
  premisa="El punto cero. No se desbloquea porque es donde empiezas.",
  noche={}, dia={}),

 dict(id="tinta", nombre="Tinta", grado=3, abre="Desde el día uno · gratis siempre",
  premisa="Tinta china sobre papel: grafito frío en los oscuros y un blanco cálido de papel como acento. El amarillo y el coral siguen siendo los únicos con color, y ahí está toda la gracia — cuando lo demás no compite, lo que avisa se ve desde la otra punta del cuarto. No es un adorno: para quien no distingue bien los colores es la única manera de usar la app, y por eso cobrarla sería cobrar por entrar.",
  nota="No es negro puro a propósito. El negro absoluto solo se luce en OLED y en una pantalla normal se ve gris apagado y triste, así que la idea cambió de «apagar la pantalla» a «tinta sobre papel»: un monocromo elegido, no la ausencia de color.",
  noche={"--bg":"#16181b","--bg2":"#1c1f23","--card":"#23272c","--card2":"#2a2f35",
   "--line":"#3b4149","--carril":"#3b4149","--text":"#eceff2","--muted":"#98a1aa","--faint":"#6b737c",
   "--mint":"#f0ece2","--mint-macizo":"#f0ece2","--aro-alto":"#f0ece2"},
  dia={"--bg":"#e7e9ee","--bg2":"#f0f1f5","--card":"#f7f9fc","--card2":"#ffffff",
   "--line":"#b0b3ba","--carril":"#c6c9d0","--text":"#16181b","--muted":"#54575c","--faint":"#797d84",
   "--mint":"#16181b","--mint-macizo":"#16181b","--aro-alto":"#16181b",
   "--sobre-macizo":"#f7f9fc"}),

 dict(id="musgo", nombre="Musgo", grado=1, abre="Nivel 3 · con el rango Brote",
  premisa="Verde hondo de bosque cerrado de noche, y luz entre hojas de día. El primero que se gana, y llega pronto a propósito: la gracia de desbloquear algo es descubrir que se desbloquean cosas.",
  nota="El verde de día se corrigió una vez: estaba demasiado oscuro y saturado para ser papel, y a ese nivel deja de leerse como una hoja y se lee como una pared pintada. Se le subió la luz y se le bajó la saturación sin cambiar el matiz. La noche no se tocó.",
  noche={"--bg":"#05180f","--bg2":"#0b2115","--card":"#042815","--card2":"#0e301b",
   "--line":"#233c2a","--carril":"#233c2a","--text":"#e8f1e9","--muted":"#87998c","--faint":"#5c6b60"},
  dia={"--bg":"#e8ebe6","--bg2":"#eef1ec","--card":"#f4f7f3","--card2":"#fcfdfb",
   "--line":"#c2c9c0","--carril":"#ccd4cb","--text":"#16211a","--muted":"#57655b","--faint":"#78877c"}),

 dict(id="adobe", nombre="Adobe", grado=1, abre="Nivel 7 · con el rango Refugio",
  premisa="Barro cocido, no arena dorada. Terracota apagada con cal encima — el color de una pared vieja, que es cálido sin ser oro. La cálida amable, y la más fácil de querer.",
  noche={"--bg":"#170802","--bg2":"#210e05","--card":"#301105","--card2":"#3a1a0c",
   "--line":"#462a20","--carril":"#462a20","--text":"#f4ebe4","--muted":"#ab958a","--faint":"#7c6a60"},
  dia={"--bg":"#e3d4ca","--bg2":"#ece0d8","--card":"#f4ebe4","--card2":"#faf5f0",
   "--line":"#c2ad9f","--carril":"#d0bdaf","--text":"#241a14","--muted":"#6b5a50","--faint":"#8c7a70"}),

 dict(id="duna", nombre="Duna", grado=1, abre="Nivel 20 · con el rango Norte",
  premisa="El desierto después de que se mete el sol: el cielo se va a violeta y la arena se pone lavanda. Lo único que sigue caliente es la roca — y en la app, los acentos. El más raro de los ocho y el que menos se parece a nada que ya tengas.",
  nota="La primera versión era café oscuro con crema, que es la paleta cálida por defecto —la que sale sola al pensar «desierto» sin mirar ninguno—. El error de fondo resultó más útil que el descarte: el desierto solo es café en las fotos de la hora dorada; de noche es violeta y frío. De ahí salieron Duna y Adobe, que son ambientes distintos.",
  noche={"--bg":"#1d1220","--bg2":"#251829","--card":"#36203a","--card2":"#402944",
   "--line":"#553a5c","--carril":"#553a5c","--text":"#f6e9f4","--muted":"#b48fae","--faint":"#836781"},
  dia={"--bg":"#e0cbdb","--bg2":"#ebdde8","--card":"#f4ecf2","--card2":"#faf6f9",
   "--line":"#c0a5b8","--carril":"#cdb4c6","--text":"#251728","--muted":"#6a5468","--faint":"#8b7488"}),

 dict(id="escarcha", nombre="Escarcha", grado=2, abre="Nivel 12 · con el rango Cima · Pro",
  premisa="La menta se vuelve celeste y la app pasa de festejar a acompañar. El primero que cambia el acento, y ahí es donde se nota que un recolor puede cambiar el carácter y no solo el fondo.",
  noche={"--bg":"#071421","--bg2":"#0b1b2a","--card":"#0a223a","--card2":"#0c2a41",
   "--line":"#1f3448","--carril":"#1f3448","--text":"#e7f0f5","--muted":"#8496a3","--faint":"#5a6b78",
   "--mint":"#8ecdf5","--mint-macizo":"#8ecdf5","--aro-alto":"#8ecdf5"},
  dia={"--mint":"#0f688f","--mint-macizo":"#3ab0e0","--aro-alto":"#1a8cbe"}),

 dict(id="marea", nombre="Marea", grado=2, abre="Nivel 5 · Pro",
  premisa="Verdiazul de agua honda, con la menta de la casa vista bajo el agua. El más lejano de la casa de los ocho, y por eso el más tarde: se disfruta más cuando ya te sabes de memoria cómo se veía antes.",
  nota="La primera versión era la casa con otro azul, y con razón: el clásico ya es un carbón azulado, así que ponerle más azul no lo aleja, lo confirma. Se arregló en dos movimientos — la tarjeta dejó de ser gris azulado y se volvió verdiazul de verdad, y el acento se corrió hacia el agua. Eso lo subió a grado 2.",
  noche={"--bg":"#01161d","--bg2":"#042029","--card":"#002d3c","--card2":"#043746",
   "--line":"#1a4553","--carril":"#1a4553","--text":"#dff2f5","--muted":"#79a3ae","--faint":"#4f7784",
   "--mint":"#4fe0d0","--mint-macizo":"#4fe0d0","--aro-alto":"#4fe0d0"},
  dia={"--bg":"#d3e4e6","--bg2":"#e2eeef","--card":"#ebf4f4","--card2":"#f5fafa",
   "--line":"#a5bfc3","--carril":"#b9d2d4","--text":"#06232a","--muted":"#4f717a","--faint":"#6d8b93",
   "--mint":"#006b62","--mint-macizo":"#00d4bd","--aro-alto":"#009083"}),

]

# Cara de día, que es la que aprieta. Umbral 4,5 para escribir y 3 para trazar.
CONTRASTES = {
 "casa":     (8.67, 5.46, 3.17, 2.22),
 "musgo":    (8.06, 6.30, 3.74, 2.67),
 "marea":    (9.81, 5.73, 3.53, 2.49),
 "duna":     (7.92, 5.87, 3.49, 2.24),
 "adobe":    (7.90, 5.78, 3.44, 2.23),
 "escarcha": (7.48, 5.48, 3.36, 2.35),
 "tinta":    (16.89, 16.89, 16.89, 2.06),
}
COLUMNAS_CONTRASTE = ("Tinta sobre relleno", "Escribir", "Trazar", "Trazo vs carril")

# Los trazos son los que se aprobaron en la lámina del teléfono, recuperados
# tal cual: viewBox 0 0 24 24, trazo 1,7 y remates redondos, que es el formato
# de ICONS en js/01-base.js.
#
# Desde el reparto nuevo, un rango NO viene solo: trae su ambiente y toma su
# color. Eso convierte la escalera en cinco capítulos en vez de en doce
# premios sueltos, y de paso le da al aro del avatar un color que significa
# algo. Los dos tonos de cada rango están CALCULADOS, no elegidos: de noche el
# más saturado que ya está cómodo sobre la tarjeta (6 sobre 1) y de día el que
# apenas llega a 4,5 hundiéndose lo mínimo, que es lo que conserva el matiz.
# Usar el tono de una cara en la otra da 2,10-3,27 — por eso son dos y no uno.
RANGOS = [
 dict(nivel=1,  nombre="Semilla", ambiente="tinta",    color=("#b6a370", "#837143"),
  trazo='<path d="M12 3.4c4 3.4 6.3 7 6.3 10.6 0 3.8-2.8 6.8-6.3 6.8s-6.3-3-6.3-6.8c0-3.6 2.3-7.2 6.3-10.6z"/><path d="M12 9.4v8.4"/>',
  cuando="El primer día", que="Una gota cerrada. Cae la semilla y aparece la barra: antes del primer nivel no hay nada que enseñar."),
 dict(nivel=3,  nombre="Brote",   ambiente="musgo",    color=("#23b37e", "#19805a"),
  trazo='<path d="M12 20.6v-8"/><path d="M12 15.4c-3.6 0-6-2.3-6-5.8 3.9-.4 6 2.2 6 5.8z"/><path d="M12 13.2c0-3.7 2.4-6.2 6.2-5.9 0 3.6-2.5 5.9-6.2 5.9z"/><path d="M6 20.6h12"/>',
  cuando="Dos días", que="La misma planta después: un tallo con dos hojas. Llega pronto a propósito — la gracia de desbloquear algo es descubrir que se desbloquean cosas."),
 dict(nivel=7,  nombre="Refugio", ambiente="adobe",    color=("#dc925d", "#a15923"),
  trazo='<path d="M12 4.6L2.8 19.6h18.4z"/><path d="M12 4.6L8.4 19.6 12 15.2l3.6 4.4z"/>',
  cuando="Tres semanas", que="Se acampa. Y el barro de Adobe es exactamente de lo que está hecho un refugio."),
 dict(nivel=12, nombre="Cima",    ambiente="escarcha", color=("#37a6ed", "#1073b2"), plan="Pro",
  cuando="Dos meses y medio", que="Se llega arriba, y arriba hace frío: la escarcha es la de la cima. De las tres montañas que había sobrevive una, la que dice más.",
  trazo='<path d="M3 19.2l7-11.2 4 5.7 2.2-2.9 5.8 8.4z"/><path d="M10 8V3.4"/><path d="M10 3.9l4.4 1.5L10 7z"/>'),
 dict(nivel=20, nombre="Norte",   ambiente="duna",     color=("#c194e4", "#9345d1"),
  trazo='<path d="M12 2.6l2.5 6.9 6.9 2.5-6.9 2.5-2.5 6.9-2.5-6.9L2.6 12l6.9-2.5z"/>',
  cuando="Ocho meses", que="Arriba ya solo queda la estrella que orienta, y el cielo violeta de Duna es donde se ve. El último: quien llega, se queda ahí."),
]

PUNTOS = [
 ("Los dos primeros días de la semana", 40, "Con que aparezcas cuenta, y da igual qué dos días sean. Es lo que más paga de todo."),
 ("Cada día más de esa semana", 5, "El quinto día seguido no vale lo que el primero: de ahí en adelante suma lo que haces, no que abras la app."),
 ("Misión cumplida", 2, "Hasta cinco al día. Doce misiones diarias no valen seis veces más que dos."),
 ("Etapa hecha", 5, "De un talento o de un encargo."),
 ("Hito conseguido", 20, "Los mini-talentos, que se cierran en sí mismos."),
 ("Hito de racha", 25, "3, 7, 14, 30, 50, 100… los que la app ya festeja."),
 ("Una habilidad sube de nivel", 30, "Cuenta el nivel más alto que tuvo. El decaimiento no te quita el punto: lo aprendido pasó."),
 ("Talento logrado", 50, "Meta cumplida o compra asegurada."),
 ("Encargo terminado", 50, "Con todas sus etapas cerradas."),
 ("Estreno", 15, "La primera habilidad, la primera misión, el primer talento, el primer encargo. Una vez cada uno."),
]

# Perfiles simulados día por día sobre cinco años
CURVA = [("Ligero",2,3,6,13,18,25,41), ("Normal",2,4,8,17,25,35,55), ("Intenso",2,5,10,22,31,44,69)]
CURVA_COLS = ("Perfil","Día 1","Semana","Mes","6 meses","1 año","2 años","5 años")

ESCALERA = [
 ("dia1", "Tinta, con el rango Semilla", "ambiente", ""),
 ("dia1", "Los catorce mundos", "ambiente", "Pro"),
 (1,  "Rango Semilla, y aparece la barra", "rango", ""),
 (2,  "Destello propio al cumplir una misión", "celebracion", ""),
 (3,  "Rango Brote, y con él el ambiente Musgo", "rango+ambiente", ""),
 (5,  "Ambiente Marea", "ambiente", "Pro"),
 (7,  "Rango Refugio, y con él el ambiente Adobe", "rango+ambiente", ""),
 (9,  "Escena nueva de racha", "celebracion", ""),
 (12, "Rango Cima, y con él el ambiente Escarcha", "rango+ambiente", "Pro"),
 (14, "Escena grande de racha", "celebracion", ""),
 (16, "Celebración de pantalla completa", "celebracion", "Pro"),
 (20, "Rango Norte, y con él el ambiente Duna", "rango+ambiente", ""),
 ("20+", "Ahí cuelgan los mundos y los ambientes que entren después", "ambiente", ""),
]

# Se guardan las descartadas porque el motivo del descarte vale más que el
# dibujo: es lo que impide volver a proponerlas dentro de tres meses.
CAIDAS = [
 ("Sendero", "le cede el sitio a Brote", '<path d="M7.4 18.6l4-2.6-3.2-2.2 4.4-2.9-2.4-2.1 4.6-2.9"/><circle cx="5.6" cy="19.6" r="1.5"/><circle cx="17.6" cy="5.2" r="1.5"/>'),
 ("Puente", "no se entiende a 24 px: un puente necesita ver los dos lados que une", '<path d="M3 14.4c2.6-5.6 15.4-5.6 18 0"/><path d="M3 14.4h18"/><path d="M8.4 14.4v-2.6M15.6 14.4v-2.6"/><path d="M3.4 19.6c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0"/>'),
 ("Colina", "otra montaña", '<path d="M2.6 18.8c1.8-6.2 4-9.3 6.6-9.3s4.8 3.1 6.6 9.3"/><path d="M11.8 18.8c1.3-4 3-6 4.8-6s3.5 2 4.8 6"/><path d="M2.6 18.8h18.8"/>'),
 ("Cordillera", "otra montaña", '<path d="M2.4 18.8l6.2-9.6 3.9 5.5 3.1-4.3 6 8.4z"/><path d="M6.2 13l2.4 1.4 2.2-1.5"/>'),
 ("Constelación", "le cede el sitio a Norte", '<circle cx="5.4" cy="16.2" r="1.7"/><circle cx="9.8" cy="9.2" r="1.5"/><circle cx="15" cy="12.4" r="1.5"/><circle cx="19" cy="5.6" r="1.7"/><path d="M6.5 14.9l2.2-3.6M11.1 10l2.7 1.7M16.1 11.2l1.9-3.3"/>'),
]

# La casa, para que un especimen que no declara algo caiga en el color de siempre
CASA_NOCHE = {"--bg":"#10151d","--bg2":"#151b25","--card":"#1d2530","--card2":"#222c39",
 "--line":"#2a3441","--carril":"#2a3441","--text":"#eaf1ef","--muted":"#8b99a5","--faint":"#5d6b77",
 "--mint":"#5fe0b0","--mint-macizo":"#5fe0b0","--aro-alto":"#5fe0b0",
 "--fire":"#f5d76e","--coral":"#ff8a70","--sobre-macizo":"#10151d"}
CASA_DIA = {"--bg":"#dcdef0","--bg2":"#e7e9f4","--card":"#f2f0f9","--card2":"#f7f8fa",
 "--line":"#b4b8c9","--carril":"#9aa0b6","--text":"#16202b","--muted":"#4f5b67","--faint":"#606d7b",
 "--mint":"#007046","--mint-macizo":"#00cc7f","--aro-alto":"#009e62",
 "--fire":"#755c05","--coral":"#bd2200","--sobre-macizo":"#10151d"}
