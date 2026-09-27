# Las cuatro paletas de AVERNO (hueso y sangre, 0.7.141), en sus dos caras.
# Fuente única: de aquí salen el CSS del mundo (`averno.py`) y las muestras de
# Mi apariencia (`python mundos/averno/averno.py` las imprime).
#
# Son propias y NO repiten las de Catedral, y eso fue un encargo: en el boceto
# Averno llevaba las cuatro de Catedral repintadas y Eduardo lo paró —«están
# duplicadas»—. La distancia de cada segundo tono al más parecido de Catedral
# es de 20 o más en dE2000 (Sangre 20 con Alabastro, Cocito 20 con Espectro,
# Ponzoña 23 con Bronce, Tormento 24 con Vitral); por debajo de 20 el ojo las
# confunde. Todas pasan 4,5 para escribir en las dos caras.
#
# Mismo reparto que Catedral (rojo = acento, oro = aviso, brasa naranja =
# peligro, segundo tono en el sitio del celeste) pero base NEGRA NEUTRA, rojo más
# sangre y segundos tonos que Catedral no usa. Mismas llaves que
# mundos/catedral/paletas.py para reutilizar su `vars_cara`, más `brasa` (la luz de
# abajo) de noche.
PALETAS = {
  "sangre": dict(
    nombre="Sangre", segundo_nombre="plata",
    idea="Negro puro, rojo sangre y plata fría: las cartas de píxel de la referencia.",
    noche=dict(bg="#060506", bg2="#0e0c0d", card="#171415", card2="#1d191a", line="#302a2c", carril="#2b2527",
               text="#efe9e3", muted="#a39a94", faint="#716a66",
               acento="#ff2d3f", acentoM="#ff2d3f", segundo="#b8bccb", segundoM="#b8bccb",
               aviso="#f2c94c", avisoM="#f2c94c", peligro="#ff8a3d", peligroM="#ff8a3d", sobre="#060506",
               piedra="#3d3537", hierro="#3a3336", hondo="#100d0e", brasa="#7a0f1c"),
    dia=dict(bg="#e2dfdd", bg2="#e9e6e4", card="#f6f4f2", card2="#faf9f8", line="#bcb5b2", carril="#e4e0dd",
             text="#1b1718", muted="#554e4b", faint="#645c59",
             acento="#b0001c", acentoM="#ff2d3f", segundo="#474c5e", segundoM="#b8bccb",
             aviso="#6d5500", avisoM="#f2c94c", peligro="#a13a00", peligroM="#ff8a3d", sobre="#1b1718",
             piedra="#cfc9c6", hierro="#8d8589", hondo="#ebe8e6")),
  "cocito": dict(
    nombre="Cocito", segundo_nombre="azul hielo",
    idea="El lago helado del noveno círculo de Dante: la sangre sobre hielo, en un negro azulado.",
    noche=dict(bg="#04060c", bg2="#0a0e18", card="#121827", card2="#171e30", line="#28334d", carril="#242e46",
               text="#e6ebf5", muted="#95a0b8", faint="#646e88",
               acento="#ff3548", acentoM="#ff3548", segundo="#6ec0ff", segundoM="#6ec0ff",
               aviso="#f2c94c", avisoM="#f2c94c", peligro="#ff8a3d", peligroM="#ff8a3d", sobre="#04060c",
               piedra="#2f3a58", hierro="#2c3654", hondo="#0b1019", brasa="#6e1224"),
    dia=dict(bg="#dde1ea", bg2="#e5e8ef", card="#f3f5f9", card2="#f8f9fb", line="#b3bbcc", carril="#dfe3ec",
             text="#121828", muted="#465069", faint="#56607a",
             acento="#b0001e", acentoM="#ff3548", segundo="#406f94", segundoM="#6ec0ff",
             aviso="#6d5500", avisoM="#f2c94c", peligro="#a13a00", peligroM="#ff8a3d", sobre="#121828",
             piedra="#c9cfdb", hierro="#7e889f", hondo="#e8ebf1")),
  "ponzona": dict(
    nombre="Ponzoña", segundo_nombre="verde veneno",
    idea="Sangre y veneno: el rojo de siempre y un verde ácido que no es natural.",
    noche=dict(bg="#050805", bg2="#0b100b", card="#131a13", card2="#182118", line="#283528", carril="#253125",
               text="#e6eee5", muted="#96a694", faint="#667464",
               acento="#ff3a3a", acentoM="#ff3a3a", segundo="#8ad550", segundoM="#8ad550",
               aviso="#f2c94c", avisoM="#f2c94c", peligro="#ff8a3d", peligroM="#ff8a3d", sobre="#050805",
               piedra="#2f3c2e", hierro="#2e3b2c", hondo="#0b110b", brasa="#6e1418"),
    dia=dict(bg="#dfe4dc", bg2="#e6eae3", card="#f4f7f2", card2="#f9fbf8", line="#b6c0b2", carril="#e0e5dd",
             text="#131a12", muted="#4a5747", faint="#5a6757",
             acento="#b0001a", acentoM="#ff3a3a", segundo="#2c700c", segundoM="#8ad550",
             aviso="#6d5500", avisoM="#f2c94c", peligro="#a13a00", peligroM="#ff8a3d", sobre="#131a12",
             piedra="#cbd3c8", hierro="#82907e", hondo="#e8ece6")),
  "tormento": dict(
    nombre="Tormento", segundo_nombre="magenta de espina",
    idea="El magenta encendido de las barras de espinas, sobre negro morado.",
    noche=dict(bg="#07040a", bg2="#0f0914", card="#19111f", card2="#1f1527", line="#352341", carril="#31203c",
               text="#f0e6f3", muted="#aa95b5", faint="#786585",
               acento="#ff3040", acentoM="#ff3040", segundo="#ff4fd8", segundoM="#ff4fd8",
               aviso="#f2c94c", avisoM="#f2c94c", peligro="#ff8a3d", peligroM="#ff8a3d", sobre="#07040a",
               piedra="#3c2a49", hierro="#3a2747", hondo="#120b19", brasa="#6e0e2a"),
    dia=dict(bg="#e4dde8", bg2="#eae4ee", card="#f7f2f9", card2="#fbf8fc", line="#c4b6cc", carril="#e6dfea",
             text="#1e1024", muted="#574461", faint="#685372",
             acento="#b0001c", acentoM="#ff3040", segundo="#b23797", segundoM="#ff4fd8",
             aviso="#6d5500", avisoM="#f2c94c", peligro="#a13a00", peligroM="#ff8a3d", sobre="#1e1024",
             piedra="#d6cadd", hierro="#9a86a4", hondo="#eee8f1")),
}
