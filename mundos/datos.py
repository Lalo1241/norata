# -*- coding: utf-8 -*-
"""Los quince mundos, en un solo sitio. De aquí salen el borrador y el paquete
que se lleva al repositorio, así que no pueden decirse cosas distintas."""
import re, os

AQUI = os.path.dirname(os.path.abspath(__file__))

def svg(ruta):
    # Ruta relativa a ESTE archivo y no al directorio desde el que se llame:
    # importarlo desde la raíz del repositorio reventaba con FileNotFoundError.
    s = open(os.path.join(AQUI, "svg", ruta), encoding="utf-8").read()
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"\s+", " ", s).strip().replace('"', "'")
    for a, b in [("%","%25"),("#","%23"),("<","%3C"),(">","%3E"),("&","%26"),("?","%3F")]:
        s = s.replace(a, b)
    return "data:image/svg+xml," + s

# familia: de-aqui | de-pantalla | de-materia
MUNDOS = [
 dict(id="talavera", nombre="Talavera", familia="de-aqui", llave="Loza vidriada", color="#1e3f8f",
  premisa="Un plato de Talavera está compuesto, no estampado: la cenefa vive en el filo, el campo va de esmalte liso y sobre el liso es donde se escribe. Aquí la loza es blanca —no crema—, la greca geométrica cierra arriba y abajo, y el friso de azulejos con la flor a plena tinta va en la cabecera, detrás de la barra opaca, que es el único sitio de un teléfono donde un dibujo fuerte no le cae encima a nada. En el campo la misma flor sigue estando, grande y con todo su detalle, pero al peso de una filigrana en el esmalte. Sobre ella se lee igual que sobre papel liso.",
  letra="Alegreya Sans", ancho="−14%", escala="1", esquinas="14 px · suaves", peso="~95 KB", horas="Las dos",
  nota="Tercera vuelta, y la lección no es de dibujo sino de dónde cabe. En un teléfono el campo ES la página: cualquier dibujo con fuerza acaba debajo de una cifra o de un chip, porque la columna de contenido ocupa todo el ancho y no deja margen. Sólo hay dos sitios donde un dibujo puede ir a plena tinta —detrás de una barra opaca, y en lo que aparece una sola vez—; en todo lo demás tiene que ser filigrana. Medido con herramientas/debajo.js: antes las flores daban 1,76 debajo del XP y de los chips; ahora dan 1,05.",
  extra=""".talavera .lienzo{ padding-top:122px; }""",
  tokens={"--m-pagina":"#f4f1e8",
   # Cuatro capas y cada una en su sitio. Las dos grecas son geométricas y van
   # en el filo; el friso de flores va a plena tinta SÓLO en la cabecera, donde
   # no se escribe; y el campo lleva la misma flor de siempre, grande, pero de
   # filigrana. Lo que rompía el mundo no era la flor: era la flor a plena
   # tinta debajo de una cifra.
   "--m-grano":f'url("{svg("talavera-greca.svg")}") top left repeat-x, url("{svg("talavera-friso.svg")}") top 26px left 0 / 62px 62px repeat-x, url("{svg("talavera-greca.svg")}") top 88px left 0 repeat-x, url("{svg("talavera-greca.svg")}") bottom left repeat-x, url("{svg("azulejo.svg")}") center / 168px 168px repeat',
   "--m-grano-op":"1",
   "--m-tarjeta":"#fffefb","--m-borde":"1.5px","--m-borde-color":"#1e3f8f",
   "--m-sombra":"inset 0 0 0 3px #fffefb, inset 0 0 0 4.5px rgba(30,63,143,.55), 0 5px 16px rgba(30,63,143,.18)",
   "--m-r-tarjeta":"14px","--m-r-mini":"999px","--m-r-barra":"999px","--m-r-chip":"999px",
   "--m-tinta":"#0d2044","--m-tinta-2":"#465a76",
   "--m-acento":"#1e3f8f","--m-acento-velo":"rgba(30,63,143,.11)",
   "--m-aviso":"#7a5a00","--m-aviso-velo":"rgba(122,90,0,.13)",
   "--m-peligro":"#9e2f14","--m-peligro-velo":"rgba(158,47,20,.12)","--m-carril":"#d7ddea",
   "--m-icono":f'url("{svg("flor-icono.svg")}") center/contain no-repeat',
   "--m-titulo":'"Alegreya Sans",system-ui,sans-serif',"--m-titulo-px":"16px","--m-titulo-peso":"800",
   "--m-cifra":'"Alegreya Sans",system-ui,sans-serif',"--m-cifra-peso":"800","--m-cifra-esp":"-.02em",
   "--m-chip-fuente":'"Alegreya Sans",system-ui,sans-serif',"--m-chip-peso":"700",
   "--m-dur":".7s","--m-curva":"cubic-bezier(.25,.9,.35,1)"}),

 dict(id="grabado", nombre="Grabado", familia="de-aqui", llave="El de las calaveras", color="#a32615",
  premisa="Una tinta negra sobre papel de periódico y el rojo de la segunda pasada para lo que importa. La tarjeta es una plancha: borde negro grueso, sombra dura desplazada y cero difuminado — y al pasar el cursor se apoya, la sombra se cierra y el papel baja, como cuando bajas la plancha sobre la hoja. La letra de madera se fue: Outfit en negrita se lee de un vistazo y no compite con el rayado.",
  letra="Outfit", ancho="+0%", escala="1", esquinas="0 px · vivas", peso="~35 KB", horas="Día",
  tokens={"--m-pagina":"#e3ddcd",
   "--m-grano":"repeating-linear-gradient(52deg, rgba(24,20,16,.13) 0 1px, transparent 1px 5px), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23p)'/%3E%3C/svg%3E\")",
   "--m-grano-op":".22","--m-tarjeta":"#efe9da","--m-borde":"2px","--m-borde-color":"#181410",
   "--m-sombra":"7px 7px 0 #181410","--m-sombra-encima":"2px 2px 0 #181410","--m-empuje":"5px",
   "--m-r-tarjeta":"0","--m-r-mini":"0","--m-r-barra":"0","--m-r-chip":"0",
   "--m-tinta":"#181410","--m-tinta-2":"#5c5346",
   "--m-acento":"#a32615","--m-acento-velo":"rgba(163,38,21,.13)",
   "--m-aviso":"#6b5200","--m-aviso-velo":"rgba(107,82,0,.14)",
   "--m-peligro":"#181410","--m-peligro-velo":"rgba(24,20,16,.13)","--m-carril":"#cec5b0",
   "--m-icono":"repeating-linear-gradient(45deg,#181410 0 2px,#efe9da 2px 4px)",
   "--m-titulo":'"Outfit",system-ui,sans-serif',"--m-titulo-px":"16px","--m-titulo-peso":"700","--m-titulo-esp":"-.01em",
   "--m-cifra":'"Outfit",system-ui,sans-serif',"--m-cifra-peso":"700","--m-cifra-esp":"-.03em",
   "--m-chip-fuente":'"Outfit",system-ui,sans-serif',"--m-chip-peso":"700","--m-chip-esp":".06em","--m-chip-caja":"uppercase",
   "--m-dur":".16s","--m-curva":"cubic-bezier(.2,.8,.3,1)"}),

 dict(id="consola", nombre="Consola", familia="de-pantalla", llave="Gratis, siempre", color="#3bff9e",
  premisa="Fósforo sobre negro, todo en monoespaciada, cero adornos y el movimiento a saltos en vez de suave. Es el único que no necesita ni una imagen: la textura son dos líneas de CSS. Y de paso es la red de seguridad para quien no distingue bien los tonos.",
  letra="JetBrains Mono", ancho="+29%", escala="0.86", esquinas="0 px · vivas", peso="~28 KB", horas="Noche",
  tokens={"--m-pagina":"#000",
   "--m-grano":"repeating-linear-gradient(180deg, rgba(120,255,190,.16) 0 1px, transparent 1px 3px)",
   "--m-grano-op":"1","--m-tarjeta":"#050705","--m-borde":"1px","--m-borde-color":"#2f5f47",
   "--m-sombra":"none","--m-r-tarjeta":"0","--m-r-mini":"0","--m-r-barra":"0","--m-r-chip":"0",
   "--m-tinta":"#c9ffe4","--m-tinta-2":"#5f9a7d",
   "--m-acento":"#3bff9e","--m-acento-velo":"rgba(59,255,158,.12)",
   "--m-aviso":"#ffd447","--m-aviso-velo":"rgba(255,212,71,.12)",
   "--m-peligro":"#ff6b52","--m-peligro-velo":"rgba(255,107,82,.12)","--m-carril":"#10291d",
   "--m-icono":"#3bff9e",
   "--m-titulo":'"JetBrains Mono",ui-monospace,monospace',"--m-titulo-px":"13px","--m-titulo-peso":"700",
   "--m-cifra":'"JetBrains Mono",ui-monospace,monospace',"--m-cifra-peso":"700","--m-cifra-esp":"-.04em",
   "--m-chip-fuente":'"JetBrains Mono",ui-monospace,monospace',"--m-chip-esp":".06em","--m-chip-caja":"uppercase",
   "--m-dur":".12s","--m-curva":"steps(12, end)"}),

 dict(id="neon", nombre="Neón", familia="de-pantalla", llave="Todo redondo", color="#3febff",
  premisa="Un tubo de neón es vidrio DOBLADO, así que aquí todo es redondo — la tarjeta, la barra, las pastillas. Cian sobre asfalto mojado, con el resplandor por dentro y por fuera del trazo. El aviso pasa a ámbar y el peligro a rosa encendido: cambian de tono y siguen diciendo lo mismo.",
  letra="Baloo 2", ancho="−2%", escala="1", esquinas="Redondas del todo", peso="~60 KB", horas="Noche",
  tokens={"--m-pagina":"#08060f",
   "--m-grano":"radial-gradient(ellipse at 22% 12%, rgba(255,45,150,.2), transparent 55%), radial-gradient(ellipse at 82% 78%, rgba(60,235,255,.16), transparent 52%)",
   "--m-grano-op":"1","--m-tarjeta":"linear-gradient(170deg,#141024 0%,#0d0a18 100%)",
   "--m-borde":"2px","--m-borde-color":"#3febff",
   "--m-sombra":"0 0 0 1px rgba(63,235,255,.28), 0 0 18px rgba(63,235,255,.34), inset 0 0 16px rgba(63,235,255,.12)",
   "--m-halo":"0 0 10px rgba(63,235,255,.75)",
   "--m-r-tarjeta":"999px","--m-r-mini":"999px","--m-r-barra":"999px","--m-r-chip":"999px",
   "--m-tinta":"#eafcff","--m-tinta-2":"#8fb8c4","--m-titulo-sombra":"0 0 12px rgba(63,235,255,.6)",
   "--m-acento":"#3febff","--m-acento-tinta":"#7df3ff","--m-acento-velo":"rgba(63,235,255,.14)",
   "--m-aviso":"#ffc24d","--m-aviso-velo":"rgba(255,194,77,.15)",
   "--m-peligro":"#ff5f8f","--m-peligro-velo":"rgba(255,95,143,.15)","--m-carril":"#191430",
   "--m-icono":"radial-gradient(circle at 38% 34%, #ff8fc4, #ff2d96 62%, #7a0f47)",
   "--m-titulo":'"Baloo 2",system-ui,sans-serif',"--m-titulo-px":"15px","--m-titulo-peso":"700",
   "--m-cifra":'"Baloo 2",system-ui,sans-serif',"--m-cifra-peso":"700","--m-cifra-esp":"-.01em",
   "--m-chip-fuente":'"Baloo 2",system-ui,sans-serif',"--m-dur":".9s","--m-curva":"cubic-bezier(.18,.9,.3,1)"},
  extra=".neon .ficha{ padding:16px 22px; }"),

 dict(id="cyber", nombre="Cyberpunk", familia="de-pantalla", llave="Visor, no marco", color="#00f0ff",
  premisa="El visor, no el letrero: la tarjeta no lleva marco cerrado —lleva cuatro escuadras y una regla de marcas, como una mira—, la esquina de abajo va cortada en chaflán de verdad y el título sale desdoblado como una señal mal sincronizada. La paleta sí es la del género: amarillo ácido sobre negro con el cian de los datos. Un color no es de nadie; lo que sí sería de alguien es su nombre, su logotipo o su tipografía, y de eso no hay nada aquí.",
  letra="Chakra Petch", ancho="+4%", escala="1", esquinas="0 px + chaflán", peso="~70 KB", horas="Noche",
  nota="Los colores no se registran; lo que se registra es un nombre, un logotipo o una tipografía. Aquí no hay ninguno de los tres.",
  tokens={"--m-pagina":"#05070c",
   "--m-grano":"repeating-linear-gradient(180deg, rgba(252,238,10,.05) 0 1px, transparent 1px 4px), radial-gradient(ellipse at 78% 16%, rgba(0,229,255,.16), transparent 56%), radial-gradient(ellipse at 14% 84%, rgba(252,238,10,.12), transparent 52%)",
   "--m-grano-op":"1","--m-tarjeta":"linear-gradient(180deg,#12130a 0%,#080905 100%)",
   "--m-borde":"0","--m-borde-color":"transparent","--m-sombra":"none",
   "--m-r-tarjeta":"0","--m-r-mini":"0","--m-r-barra":"0","--m-r-chip":"0",
   "--m-tinta":"#f2f7d8","--m-tinta-2":"#93a06a",
   "--m-titulo-sombra":"1.5px 0 0 rgba(255,46,110,.8), -1.5px 0 0 rgba(0,229,255,.8)",
   "--m-acento":"#fcee0a","--m-acento-velo":"rgba(252,238,10,.13)",
   "--m-aviso":"#ff7a1a","--m-aviso-velo":"rgba(255,122,26,.15)",
   "--m-peligro":"#ff2e6e","--m-peligro-velo":"rgba(255,46,110,.15)","--m-carril":"#1a1a08",
   "--m-icono":f'url("{svg("hud-reticula.svg")}") center/contain no-repeat',
   "--m-titulo":'"Chakra Petch",system-ui,sans-serif',"--m-titulo-px":"15px","--m-titulo-peso":"700","--m-titulo-esp":".04em","--m-titulo-caja":"uppercase",
   "--m-cifra":'"Chakra Petch",system-ui,sans-serif',"--m-cifra-peso":"700","--m-cifra-esp":"0",
   "--m-chip-fuente":'"Chakra Petch",system-ui,sans-serif',"--m-chip-esp":".1em","--m-chip-caja":"uppercase",
   "--m-dur":".18s","--m-curva":"steps(9,end)"},
  # Antes era UN dibujo de 120 px estirado a 100%% del ancho: las escuadras
  # salían como rayas largas y la regla de marcas se quedaba flotando en
  # medio. Ahora son cuatro dibujos independientes, cada uno clavado a su
  # esquina y a tamaño fijo. El chaflán de abajo a la derecha se queda.
  extra=""".cyber .ficha{
    background-image:url("%s"), url("%s"), url("%s"), url("%s"),
      linear-gradient(180deg,#12130a 0%%,#080905 100%%);
    background-position:left top, right top, left bottom, right bottom, center;
    background-size:30px 26px, 30px 26px, 30px 26px, 30px 26px, auto;
    background-repeat:no-repeat;
    clip-path:polygon(0 0, 100%% 0, 100%% calc(100%% - 15px), calc(100%% - 15px) 100%%, 0 100%%);
    padding:18px 22px;
  }""" % (svg("hud-esq-tl.svg"), svg("hud-esq-tr.svg"), svg("hud-esq-bl.svg"), svg("hud-esq-br.svg"))),

 dict(id="plano", nombre="Blueprint", familia="de-pantalla", llave="Nada está terminado", color="#9fd0ff",
  premisa="El plano azul de toda la vida: retícula de dos pesos, cotas con puntas de flecha y marcas de sección. Aquí la tarjeta no es una tarjeta: es una PIEZA ACOTADA, con su línea de medida cruzando por encima y el hueco donde iría la cifra. Dice algo que ningún otro mundo dice — que lo tuyo todavía se está construyendo.",
  letra="Rajdhani", ancho="−10%", escala="1", esquinas="0 px · vivas", peso="~65 KB", horas="Noche",
  nota="La tarjeta era casi transparente y el texto se peleaba con la retícula del fondo. Ahora es un panel opaco: la retícula se ve alrededor, no por debajo de lo que hay que leer.",
  tokens={"--m-pagina":"#0d2b52",
   "--m-grano":f'url("{svg("plano-rejilla.svg")}")',# La retícula es el mundo, pero a plena tinta pasaba por DEBAJO del XP y de
   # los chips, que no tienen superficie propia: medido, 1,53-1,58 cuando el
   # resto de los mundos no pasa de 1,35. Se ve alrededor, no debajo.
   "--m-grano-op":".52",
   "--m-tarjeta":"rgba(6,26,52,.9)","--m-borde":"1px","--m-borde-color":"#6ea2d8",
   "--m-sombra":"inset 0 0 0 4px rgba(6,26,52,.95), inset 0 0 0 5px rgba(110,162,216,.5), 0 8px 22px rgba(0,0,0,.35)",
   "--m-r-tarjeta":"0","--m-r-mini":"0","--m-r-barra":"0","--m-r-chip":"0",
   "--m-cenefa-alto":"26px","--m-cenefa":f'url("{svg("plano-cota.svg")}") center/200px 26px no-repeat',
   "--m-tinta":"#eaf4ff","--m-tinta-2":"#8fb6db",
   "--m-acento":"#9fd0ff","--m-acento-velo":"rgba(159,208,255,.13)",
   "--m-aviso":"#ffd98a","--m-aviso-velo":"rgba(255,217,138,.14)",
   "--m-peligro":"#ff9c86","--m-peligro-velo":"rgba(255,156,134,.14)","--m-carril":"rgba(159,208,255,.16)",
   "--m-icono":f'url("{svg("plano-marca.svg")}") center/contain no-repeat',
   "--m-titulo":'"Rajdhani",system-ui,sans-serif',"--m-titulo-px":"17px","--m-titulo-peso":"700","--m-titulo-esp":".03em",
   "--m-cifra":'"Rajdhani",system-ui,sans-serif',"--m-cifra-peso":"700","--m-cifra-esp":"0",
   "--m-chip-fuente":'"Rajdhani",system-ui,sans-serif',"--m-chip-esp":".1em","--m-chip-caja":"uppercase",
   "--m-dur":".4s","--m-curva":"cubic-bezier(.4,0,.2,1)"},
  extra=".plano .ficha{ padding-top:36px; }"),

 dict(id="forja", nombre="Forja", familia="de-materia", llave="El buque insignia", color="#ff9d3d",
  premisa="Acero de taller: pasadas de pulido y huellas de martillo, cada una con su ceja clara arriba y su sombra abajo, que es lo que hace que el metal parezca golpeado y no dibujado. Arriba, banda remachada con los remaches a intervalos irregulares —uno cada 16 px exactos parece tornillería de mueble—. Sin adornos: a 40 px una voluta se lee como un número, no como hierro. Esquina viva en todo y la letra grabada en vez de escrita.",
  letra="Cinzel", ancho="+28%", escala="0.88", esquinas="0 px · vivas", peso="~180 KB", horas="Noche",
  tokens={"--m-pagina":"#16110c",
   "--m-grano":f'url("{svg("forja-acero.svg")}")',
   "--m-grano-op":".5","--m-tarjeta":"linear-gradient(163deg, #2a2016 0%, #1d1710 55%, #241b13 100%)",
   "--m-borde":"3px","--m-borde-color":"#6b5636",
   "--m-marco":"linear-gradient(150deg,#8a6f3f,#d8b978 18%,#3a2e1c 48%,#a08551 78%,#40331e) 1",
   "--m-sombra":"inset 0 1px 0 rgba(255,214,150,.13), 0 10px 24px rgba(0,0,0,.5)",
   "--m-r-tarjeta":"0","--m-r-mini":"0","--m-r-barra":"0","--m-r-chip":"0",
   "--m-cenefa-alto":"14px","--m-cenefa":f'url("{svg("forja-remaches.svg")}") repeat-x',
   "--m-tinta":"#f2e3ce","--m-tinta-2":"#a99372",
   "--m-acento":"#ff9d3d","--m-acento-velo":"rgba(255,157,61,.15)",
   "--m-aviso":"#f5d76e","--m-aviso-velo":"rgba(245,215,110,.15)",
   "--m-peligro":"#ff8a70","--m-peligro-velo":"rgba(255,138,112,.15)","--m-carril":"#3a2d1d",
   "--m-icono":"linear-gradient(150deg,#c98a3a,#8a5622)",
   "--m-titulo":'"Cinzel",Georgia,serif',"--m-titulo-px":"14px","--m-titulo-peso":"700","--m-titulo-esp":".04em",
   "--m-cifra":'"Cinzel",Georgia,serif',"--m-cifra-peso":"700","--m-cifra-esp":"0",
   "--m-chip-fuente":'"Cinzel",Georgia,serif',"--m-chip-esp":".07em",
   "--m-dur":"1.1s","--m-curva":"cubic-bezier(.16,.84,.28,1)"},
  # La voluta se fue. A 40 px una espiral deja de leerse como hierro forjado y
  # se lee como un número; ya bien colocada seguía sin funcionar, así que el
  # problema no era la posición sino la forma.
  extra=".forja .ficha{ padding-top:26px; }"),

 dict(id="postit", nombre="Post-it", familia="de-materia", llave="Podría sustituir a Papel picado", color="#c08a10",
  premisa="Una nota pegada en el escritorio. Lo que lo vende es la ESQUINA LEVANTADA, y el detalle está en que el pliegue no es una diagonal recta: el papel se enrolla, así que la línea del doblez va curva y lo que asoma es el revés de la hoja, más apagado, con su sombra cayendo encima de la propia nota. La tarjeta va un poco torcida —una nota nunca se pega derecha— y detrás hay más notas en el corcho. Letra escrita a mano, pero de las que se leen.",
  letra="Patrick Hand", ancho="−22%", escala="1", esquinas="2 px · papel", peso="~45 KB", horas="Día",
  tokens={"--m-pagina":"#e9e4d6",
   "--m-grano":f'url("{svg("postit-tablero.svg")}")',"--m-grano-op":"1",
   "--m-tarjeta":"linear-gradient(168deg,#fdf5a8 0%,#fbee92 100%)",
   "--m-borde":"0","--m-borde-color":"transparent",
   "--m-sombra":"0 7px 16px rgba(120,102,28,.3), 0 1px 2px rgba(0,0,0,.14)",
   "--m-sombra-encima":"0 12px 24px rgba(120,102,28,.34), 0 2px 4px rgba(0,0,0,.16)",
   "--m-giro":"-0.7deg",
   "--m-r-tarjeta":"2px","--m-r-mini":"2px","--m-r-barra":"3px","--m-r-chip":"3px",
   "--m-tinta":"#332c12","--m-tinta-2":"#6b5d2e",
   "--m-acento":"#1f5fa8","--m-acento-velo":"rgba(31,95,168,.13)",
   "--m-aviso":"#8a5500","--m-aviso-velo":"rgba(138,85,0,.14)",
   "--m-peligro":"#b3201b","--m-peligro-velo":"rgba(179,32,27,.12)","--m-carril":"#ecdf7c",
   "--m-icono":"linear-gradient(135deg,#f2a9be 0 68%,#cf7f96 68%)",
   "--m-titulo":'"Patrick Hand",cursive',"--m-titulo-px":"19px","--m-titulo-peso":"400",
   "--m-cifra":'"Patrick Hand",cursive',"--m-cifra-peso":"400","--m-cifra-esp":"0",
   "--m-chip-fuente":'"Patrick Hand",cursive',"--m-chip-esp":".02em",
   "--m-dur":".26s","--m-curva":"cubic-bezier(.3,.9,.35,1)"},
  extra=""".postit .ficha::after{
    content:""; position:absolute; left:auto; right:0; bottom:0; width:44px; height:44px;
    background:url("%s") right bottom/contain no-repeat; pointer-events:none;
  }""" % svg("postit-doblez.svg")),

 dict(id="arboleda", nombre="Arboleda", familia="de-materia", llave="Madera y hoja", color="#8fe36a",
  premisa="El bosque por dentro, con la luz cayendo desde arriba entre las hojas. El dosel es de un solo motivo —hoja— y la contraparte ordenada es la tarjeta: un plano de madera con la veta recta, que es lo que evita que todo sea curva encima de curva. El icono no es una hoja sino los ANILLOS de un tronco cortado: una hoja dice «planta», los anillos dicen un año, y otro, y otro, que es de lo que va la app. El verde vivo se guarda para lo que crece; el amarillo es sol entre las ramas y el rojo es fruto pasado.",
  letra="Amaranth", ancho="−4%", escala="1", esquinas="12 px · vivo pero sin filo", peso="~70 KB", horas="Noche",
  nota="El mundo verde que faltaba, y el que más fácil se vuelve una ensalada: en una arboleda TODO es orgánico. Se sostiene porque la única capa curva es el dosel; la veta de la tarjeta, la barra y los anillos son rectos o concéntricos. Es la misma regla que arregló Talavera, aplicada antes de romperla.",
  extra=""".arboleda .ficha{
    background-image:
      repeating-linear-gradient(0deg, rgba(214,240,204,.030) 0 1px, transparent 1px 7px),
      repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0 1px, transparent 1px 13px);
  }""",
  tokens={"--m-pagina":"radial-gradient(132% 76% at 50% -14%, #243c2c 0%, #16281c 32%, #0e1b13 62%, #08110c 100%)",
   "--m-grano":f'url("{svg("arboleda-dosel.svg")}") center / 210px 210px repeat',
   "--m-grano-op":".62",
   "--m-tarjeta":"#17251b","--m-borde":"1px","--m-borde-color":"#2e4633",
   "--m-sombra":"0 6px 18px rgba(0,0,0,.45), inset 0 1px 0 rgba(176,226,160,.10)",
   "--m-r-tarjeta":"12px","--m-r-mini":"999px","--m-r-barra":"999px","--m-r-chip":"999px",
   "--m-tinta":"#e9f3e3","--m-tinta-2":"#9bb5a1",
   "--m-acento":"#8fe36a","--m-acento-velo":"rgba(143,227,106,.13)",
   "--m-aviso":"#f2c14e","--m-aviso-velo":"rgba(242,193,78,.14)",
   "--m-peligro":"#f0705a","--m-peligro-velo":"rgba(240,112,90,.14)","--m-carril":"#26372b",
   "--m-halo":"0 0 10px rgba(143,227,106,.30)",
   "--m-icono":f'url("{svg("arboleda-anillos.svg")}") center/contain no-repeat',
   "--m-titulo":'"Amaranth",system-ui,sans-serif',"--m-titulo-px":"16px","--m-titulo-peso":"700",
   "--m-cifra":'"Amaranth",system-ui,sans-serif',"--m-cifra-peso":"700","--m-cifra-esp":"-.01em",
   "--m-chip-fuente":'"Amaranth",system-ui,sans-serif',"--m-chip-peso":"700",
   "--m-dur":".5s","--m-curva":"cubic-bezier(.22,.85,.3,1)"}),

 dict(id="obsidiana", nombre="Obsidiana", familia="de-materia", llave="El oscuro elegante", color="#3fd0c9",
  premisa="Grises y negros, y el color contado con los dedos. El fondo de ondas cansaba, así que ahora es una marca grabada en la piedra —un círculo, un rombo inscrito y cuatro hilos que salen— y casi todo lo demás está vacío: se ve cuando la buscas y desaparece cuando lees. El icono es una esquirla de tres planos con un solo filo brillante, y la iridiscencia son dos destellos, uno verde y uno violeta, nada más.",
  letra="Sora", ancho="+13%", escala="0.99", esquinas="0 px · vivas", peso="~80 KB", horas="Noche",
  tokens={"--m-pagina":"#07080a",
   "--m-grano":f'url("{svg("obsidiana-sigilo.svg")}") center/300px no-repeat',
   "--m-grano-op":".7","--m-tarjeta":"linear-gradient(124deg,#1a1e23 0 32%,#0a0c0f 32% 61%,#141820 61%)",
   "--m-borde":"1px","--m-borde-color":"#333c44",
   "--m-sombra":"inset 0 1px 0 rgba(215,228,235,.22), inset 0 -1px 0 rgba(0,0,0,.8), 0 16px 38px rgba(0,0,0,.72)",
   "--m-r-tarjeta":"0","--m-r-mini":"0","--m-r-barra":"0","--m-r-chip":"0",
   "--m-tinta":"#eef3f5","--m-tinta-2":"#8d979e",
   "--m-acento":"#c3ced5","--m-acento-velo":"rgba(195,206,213,.1)",
   "--m-aviso":"#d8c07a","--m-aviso-velo":"rgba(216,192,122,.12)",
   "--m-peligro":"#d98a7c","--m-peligro-velo":"rgba(217,138,124,.13)","--m-carril":"#191d22",
   "--m-icono":f'url("{svg("obsidiana-filo.svg")}") center/contain no-repeat',
   "--m-titulo":'"Sora",system-ui,sans-serif',"--m-titulo-px":"14px","--m-titulo-peso":"600","--m-titulo-esp":"-.01em",
   "--m-cifra":'"Sora",system-ui,sans-serif',"--m-cifra-peso":"600","--m-cifra-esp":"-.04em",
   "--m-chip-fuente":'"Sora",system-ui,sans-serif',"--m-chip-peso":"600","--m-chip-esp":".07em","--m-chip-caja":"uppercase",
   "--m-dur":"1.2s","--m-curva":"cubic-bezier(.2,.9,.25,1)"}),

 dict(id="cenit", nombre="Cénit", familia="de-materia", llave="Plomo y cielo", color="#f0dcb4",
  premisa="El plomo y el pan de oro se quedan —el marco de cuatro píxeles con el filo dorado, el vidrio añil— y el cielo entra por detrás, dicho en una sola frase: rayos que salen de un punto, largos y cortos alternados, y cuatro estrellas. La tracería anterior tenía circunferencias y lóbulos y había que descifrarla; esto se lee de un vistazo. El icono es la estrella de cuatro brazos con cintura, que se queda tal cual.",
  letra="Julius Sans One", ancho="+23%", escala="0.91", esquinas="3 px · casi vivas", peso="~85 KB", horas="Noche",
  nota="Tercer intento del fondo. Constelación con líneas: demasiado. Tracería de rosetón: no se entendía. Rayos desde un punto: se lee sin explicarlo. El marco de plomo y el icono no se tocaron en ninguno de los tres.",
  tokens={"--m-pagina":"#0c1030",
   "--m-grano":f'url("{svg("cenit-rayos.svg")}") center/330px no-repeat',
   "--m-grano-op":".9","--m-tarjeta":"linear-gradient(158deg, #191f4c 0%, #12163a 60%, #1c1f52 100%)",
   "--m-borde":"4px","--m-borde-color":"#3a3f6b",
   "--m-marco":"linear-gradient(140deg,#2a2e55,#8f97c8 20%,#1a1d3d 42%,#d8bd7e 58%,#6f77a8 78%,#20244a) 1",
   "--m-sombra":"inset 0 0 0 1px rgba(210,180,110,.34), 0 12px 30px rgba(0,0,0,.5)",
   "--m-r-tarjeta":"3px","--m-r-mini":"3px","--m-r-barra":"0","--m-r-chip":"3px",
   "--m-tinta":"#eeecff","--m-tinta-2":"#a0a3d2",
   "--m-acento":"#f0dcb4","--m-acento-velo":"rgba(240,220,180,.13)",
   "--m-aviso":"#ffd98a","--m-aviso-velo":"rgba(255,217,138,.14)",
   "--m-peligro":"#ff9db0","--m-peligro-velo":"rgba(255,157,176,.15)","--m-carril":"#262b58",
   "--m-icono":f'url("{svg("cenit-astro.svg")}") center/contain no-repeat',
   "--m-carril-2":"#262b58",
   "--m-titulo":'"Julius Sans One",system-ui,sans-serif',"--m-titulo-px":"15px","--m-titulo-peso":"400","--m-titulo-esp":".08em","--m-titulo-caja":"uppercase",
   "--m-cifra":'"Julius Sans One",system-ui,sans-serif',"--m-cifra-peso":"400","--m-cifra-esp":".01em",
   "--m-chip-fuente":'"Julius Sans One",system-ui,sans-serif',"--m-chip-esp":".13em","--m-chip-caja":"uppercase",
   "--m-dur":"1.4s","--m-curva":"cubic-bezier(.22,1,.36,1)"}),

 dict(id="reliquia", nombre="Reliquia", familia="de-materia", llave="El de Fundador", color="#b7a2ea",
  plan="Fundador",
  premisa="Una pieza guardada en su vitrina: forro de terciopelo, marco de latón y vidrio de museo por encima, con el polvo cogido por la luz. No es el mundo más caro de hacer ni el más vistoso, y es a propósito — el distintivo de Fundador tiene que ser distinto en especie, no superior en calidad, o el que paga cada mes se queda sin el mundo que mejor vende. El lila deja de ser un color estirado por la app y vuelve a ser lo que era: la luz que atraviesa la piedra.",
  letra="Syne", ancho="+18%", escala="0.95", esquinas="4 px · canto de vitrina", peso="~75 KB", horas="Noche",
  nota="Era un ambiente y se promovió a mundo. Un recolor no se vende —lo dijo Eduardo desde el primer día— y era lo único que Fundador tenía además de Pro: LIMITES no tiene entrada de fundador, así que Fundador ES Pro sin fecha. Un pago único de $890 necesita algo que se vea. El icono no se inventó: la app ya llama «piedra» a la insignia de Fundador en js/10d-plan.js, así que el mundo hereda ese dibujo.",
  extra=""".reliquia .ficha{
    background-image:linear-gradient(112deg, rgba(233,226,255,.09) 0%, rgba(233,226,255,0) 34%, rgba(233,226,255,0) 66%, rgba(233,226,255,.05) 100%);
  }""",
  tokens={"--m-pagina":"radial-gradient(126% 82% at 50% -6%, #241c38 0%, #1a1429 44%, #100c1a 100%)",
   "--m-grano":f'url("{svg("reliquia-terciopelo.svg")}") center / 150px 150px repeat',
   "--m-grano-op":".85",
   "--m-tarjeta":"#1e1930","--m-borde":"2px","--m-borde-color":"#8a6d2f",
   # El marco de latón necesita las DOS variables: con `--marco` puesto y el
   # borde en un píxel no se ve nada, porque un border-image solo se dibuja
   # sobre el ancho del borde.
   "--m-marco":"linear-gradient(158deg,#6b5326 0%,#c8a24e 24%,#8a6d2f 48%,#e0c072 64%,#7a5f2a 100%) 1",
   "--m-sombra":"inset 0 1px 0 rgba(233,226,255,.16), 0 8px 22px rgba(0,0,0,.5)",
   "--m-r-tarjeta":"4px","--m-r-mini":"999px","--m-r-barra":"999px","--m-r-chip":"3px",
   "--m-tinta":"#efeafb","--m-tinta-2":"#a99fc4",
   "--m-acento":"#b7a2ea","--m-acento-velo":"rgba(183,162,234,.14)",
   "--m-aviso":"#f5d76e","--m-aviso-velo":"rgba(245,215,110,.13)",
   "--m-peligro":"#ff8a70","--m-peligro-velo":"rgba(255,138,112,.13)","--m-carril":"#332b4a",
   "--m-halo":"0 0 12px rgba(183,162,234,.34)",
   "--m-icono":f'url("{svg("reliquia-piedra.svg")}") center/contain no-repeat',
   "--m-titulo":'"Syne",system-ui,sans-serif',"--m-titulo-px":"15px","--m-titulo-peso":"700",
   "--m-titulo-esp":".01em",
   "--m-cifra":'"Syne",system-ui,sans-serif',"--m-cifra-peso":"700",
   "--m-chip-fuente":'"Syne",system-ui,sans-serif',"--m-chip-peso":"600","--m-chip-esp":".08em",
   "--m-chip-caja":"uppercase",
   "--m-dur":".9s","--m-curva":"cubic-bezier(.2,.7,.25,1)"}),

 dict(id="averno", nombre="Averno", familia="de-relato", llave="El oscuro de verdad", color="#ff7a3d",
  premisa="Piedra quemada con la brasa debajo. Del poema se cita lo único que hay que citar —los círculos—: arcos concéntricos que se estrechan al bajar y solo el de dentro sigue ardiendo. Cae ceniza en el fondo, con tres motas que todavía no se han apagado, y el icono es un sol eclipsado: anillo encendido y centro muerto. Nada de cuernos ni pentagramas — el infierno de ese libro es un lugar, no un disfraz.",
  letra="Grenze Gotisch", ancho="−17%", escala="1", esquinas="2 px · piedra tallada", peso="~95 KB", horas="Noche",
  tokens={"--m-pagina":"radial-gradient(ellipse 115% 58% at 50% 120%, #5a2109 0%, #180b06 52%, #050302 100%)",
   "--m-grano":f'url("{svg("averno-ceniza.svg")}")',"--m-grano-op":".9",
   "--m-tarjeta":"linear-gradient(180deg,#1d0f0b 0%,#0a0605 100%)",
   "--m-borde":"1px","--m-borde-color":"#4a2418",
   "--m-sombra":"inset 0 1px 0 rgba(255,150,80,.16), 0 12px 30px rgba(0,0,0,.62)",
   "--m-r-tarjeta":"2px","--m-r-mini":"2px","--m-r-barra":"2px","--m-r-chip":"2px",
   "--m-tinta":"#f2ded1","--m-tinta-2":"#a68873",
   "--m-acento":"#ff7a3d","--m-acento-velo":"rgba(255,122,61,.14)",
   "--m-aviso":"#f0c24a","--m-aviso-velo":"rgba(240,194,74,.14)",
   "--m-peligro":"#ff3b6b","--m-peligro-velo":"rgba(255,59,107,.15)","--m-carril":"#1a0c08",
   "--m-icono":f'url("{svg("averno-sello.svg")}") center/contain no-repeat',
   "--m-titulo":'"Grenze Gotisch",Georgia,serif',"--m-titulo-px":"17px","--m-titulo-peso":"700","--m-titulo-esp":".01em",
   "--m-cifra":'"Grenze Gotisch",Georgia,serif',"--m-cifra-peso":"700","--m-cifra-esp":"0",
   "--m-chip-fuente":'"Grenze Gotisch",Georgia,serif',"--m-chip-esp":".05em",
   "--m-dur":"1.3s","--m-curva":"cubic-bezier(.15,.8,.25,1)"},
  # Los anillos iban en una caja de 120x120 anclada abajo a la derecha, y la
  # tarjeta mide 88 de alto: se recortaban y lo que quedaba a la vista era la
  # parte de arriba del dibujo, que cae hacia la IZQUIERDA. Por eso parecía
  # que se habían mudado de lado. Ahora la caja mide lo que mide la tarjeta y
  # el dibujo se ajusta dentro, pegado al borde derecho.
  extra=""".averno .ficha{ overflow:hidden; }
  .averno .ficha::after{
    content:""; position:absolute; left:auto; right:0; top:0; width:46%%; height:100%%;
    background:url("%s") right center/contain no-repeat; opacity:.8; pointer-events:none;
  }""" % svg("averno-anillos.svg")),

 dict(id="ventisca", nombre="Ventisca", familia="de-relato", llave="Frío con una hoguera", color="#8fd4ff",
  premisa="Chapa de hierro a la intemperie y el hielo ganándole terreno: dendritas de verdad creciendo desde las esquinas —tallo que avanza y ramas al mismo ángulo a los dos lados, que es lo que hace el hielo— y un filo de agujas colgando del borde de arriba. La interfaz es de hielo; el calor está detrás, en el resplandor ámbar que sube desde abajo de la pantalla. Esa tensión ES el mundo.",
  letra="Big Shoulders Display", ancho="−26%", escala="1", esquinas="3 px · chapa", peso="~90 KB", horas="Noche",
  tokens={"--m-pagina":"radial-gradient(ellipse 130% 55% at 50% 112%, #6b3a12 0%, #17222c 48%, #0d151d 100%)",
   "--m-grano":"radial-gradient(ellipse 90% 60% at 50% -10%, rgba(190,230,255,.14), transparent 60%)",
   "--m-grano-op":"1","--m-tarjeta":"linear-gradient(180deg,#1e2833 0%,#141c25 100%)",
   "--m-borde":"1px","--m-borde-color":"#354654",
   "--m-sombra":"inset 0 1px 0 rgba(190,230,255,.18), 0 10px 26px rgba(0,0,0,.5)",
   "--m-r-tarjeta":"3px","--m-r-mini":"3px","--m-r-barra":"999px","--m-r-chip":"3px",
   "--m-cenefa-alto":"18px","--m-cenefa":f'url("{svg("ventisca-cristales.svg")}") repeat-x',
   "--m-tinta":"#eaf5fc","--m-tinta-2":"#93aabc",
   "--m-acento":"#8fd4ff","--m-acento-velo":"rgba(143,212,255,.13)",
   "--m-aviso":"#ffc24a","--m-aviso-velo":"rgba(255,194,74,.14)",
   "--m-peligro":"#ff7a6b","--m-peligro-velo":"rgba(255,122,107,.14)","--m-carril":"#1c2733",
   "--m-icono":f'url("{svg("ventisca-copo.svg")}") center/contain no-repeat',
   "--m-titulo":'"Big Shoulders Display",Impact,sans-serif',"--m-titulo-px":"19px","--m-titulo-peso":"700","--m-titulo-esp":".02em",
   "--m-cifra":'"Big Shoulders Display",Impact,sans-serif',"--m-cifra-peso":"700","--m-cifra-esp":".01em",
   "--m-chip-fuente":'"Big Shoulders Display",Impact,sans-serif',"--m-chip-esp":".07em","--m-chip-caja":"uppercase",
   "--m-dur":".8s","--m-curva":"cubic-bezier(.25,.85,.3,1)"},
  extra=""".ventisca .ficha{
    overflow:hidden; padding-top:28px;
    background-image:url("%s"), linear-gradient(180deg,#1e2833 0%%,#141c25 100%%);
    background-position:center top, center; background-repeat:no-repeat, no-repeat;
    background-size:110px 70px, auto;
  }""" % svg("ventisca-escarcha.svg")),

 dict(id="bastion", nombre="Bastión", familia="de-relato", llave="Blindaje", color="#4db8ff",
  premisa="Placa blindada con bisel arriba y pernos remachados en las cuatro esquinas. La franja de galones de lado a lado cansaba a los diez segundos, así que ahora es una tira de identificación: la regla de marcas calla, hay una lectura en cian, y el peligro se concentra en UN galón a la izquierda. Un aviso que está en todas partes deja de ser un aviso. El icono es una placa hexagonal con su mira.",
  letra="Michroma", ancho="+9%", escala="0.81", esquinas="4 px · placa", peso="~105 KB", horas="Noche",
  tokens={"--m-pagina":"#0e1216",
   "--m-grano":"repeating-linear-gradient(90deg, rgba(120,160,190,.05) 0 1px, transparent 1px 58px), repeating-linear-gradient(0deg, rgba(120,160,190,.05) 0 1px, transparent 1px 58px)",
   "--m-grano-op":"1","--m-tarjeta":"linear-gradient(180deg,#222b34 0%,#161d24 58%,#1a222a 100%)",
   "--m-borde":"1px","--m-borde-color":"#3c4854",
   "--m-sombra":"inset 0 1.5px 0 rgba(160,200,225,.22), inset 0 -1.5px 0 rgba(0,0,0,.55), 0 10px 26px rgba(0,0,0,.5)",
   "--m-r-tarjeta":"4px","--m-r-mini":"4px","--m-r-barra":"2px","--m-r-chip":"2px",
   "--m-cenefa-alto":"14px","--m-cenefa":f'url("{svg("bastion-tira.svg")}") repeat-x',
   "--m-tinta":"#e6f0f7","--m-tinta-2":"#8fa2b1",
   "--m-acento":"#4db8ff","--m-acento-velo":"rgba(77,184,255,.13)",
   "--m-aviso":"#ffc233","--m-aviso-velo":"rgba(255,194,51,.14)",
   "--m-peligro":"#ff5a4d","--m-peligro-velo":"rgba(255,90,77,.14)","--m-carril":"#131a21",
   "--m-icono":f'url("{svg("bastion-placa.svg")}") center/contain no-repeat',
   "--m-titulo":'"Michroma",system-ui,sans-serif',"--m-titulo-px":"11.5px","--m-titulo-peso":"400","--m-titulo-esp":".02em",
   "--m-cifra":'"Michroma",system-ui,sans-serif',"--m-cifra-peso":"400","--m-cifra-esp":"-.02em",
   "--m-chip-fuente":'"Michroma",system-ui,sans-serif',"--m-chip-esp":".06em","--m-chip-caja":"uppercase",
   "--m-dur":".3s","--m-curva":"cubic-bezier(.2,.8,.2,1)"},
  extra=""".bastion .ficha{
    padding:30px 22px 18px;
    background-image:url("%s"), url("%s"), url("%s"), url("%s"),
      linear-gradient(180deg,#222b34 0%%,#161d24 58%%,#1a222a 100%%);
    background-position:7px 22px, right 7px top 22px, 7px bottom 7px, right 7px bottom 7px, center;
    background-repeat:no-repeat; background-size:11px 11px, 11px 11px, 11px 11px, 11px 11px, auto;
  }""" % (svg("bastion-perno.svg"), svg("bastion-perno.svg"), svg("bastion-perno.svg"), svg("bastion-perno.svg"))),
]

FAMILIAS = [
 ("de-relato","De relato","No salen de una materia sino de un género: cuentan algo antes de que hagas nada. Inspirados, nunca calcados — el nombre, el marco, la letra y los dibujos son de casa."),
 ("de-aqui","De aquí","Materiales que se pueden tocar en este país. Es el hilo que ningún paquete de temas genérico puede copiar."),
 ("de-pantalla","De pantalla","No imitan una materia: imitan un aparato. Son los más baratos de todos porque casi no llevan imagen."),
 ("de-materia","De materia","Piedra, metal, vidrio, papel y madera: lo que se puede tocar, y donde el material manda sobre el color."),
]
