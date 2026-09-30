# Las cuatro paletas de AVERNO (hueso y sangre, 0.7.141), en sus dos caras.
# Fuente única: de aquí salen el CSS del mundo (`averno.py`) y las muestras de
# Mi apariencia (`python mundos/averno/averno.py` las imprime).
#
# Son propias y NO repiten las de Catedral, y eso fue un encargo: en el boceto
# Averno llevaba las cuatro de Catedral repintadas y Eduardo lo paró —«están
# duplicadas»—. La distancia de cada segundo tono al más parecido de Catedral
# es de 20 o más en dE2000 (Sangre 20 con Alabastro, Lamento 20 con Espectro,
# Plaga 23 con Bronce, Tormento 24 con Vitral); por debajo de 20 el ojo las
# confunde. Todas pasan 4,5 para escribir en las dos caras.
#
# Mismo reparto que Catedral (rojo = acento, oro = aviso, brasa naranja =
# peligro, segundo tono en el sitio del celeste) pero base NEGRA NEUTRA, rojo más
# sangre y segundos tonos que Catedral no usa. Mismas llaves que
# mundos/catedral/paletas.py para reutilizar su `vars_cara`, más `brasa` (la luz de
# abajo) de noche.
PALETAS = {
  # Se llamó Sangre hasta la 0.7.147. El Tormento de antes (magenta y, en la
  # prueba, violeta) se apagó y su nombre pasó aquí: lo pidió Eduardo. El id
  # sigue siendo `sangre`, que es lo que cada dispositivo guardó.
  "sangre": dict(
    nombre="Tormento", segundo_nombre="plata",
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
    nombre="Lamento", segundo_nombre="azul hielo",
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
    nombre="Plaga", segundo_nombre="verde veneno",
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
             piedra="#cbd3c8", hierro="#82907e", hondo="#e8ece6"))
}

# Las dos nuevas (0.7.147), de dos paletas de Lospec que trajo Eduardo
# («busca otra cosa que se diferencie mucho más»): las únicas de Averno que
# no son «rojo + otro tono».
PALETAS["ruina"] = dict(
    nombre="Ruina", ref="ochreruin", segundo_nombre="malva de ruina",
    idea="Una ruina en la niebla: noche azul, piedra verdosa, niebla salvia de acento y el malva de lo que queda.",
    noche=dict(bg="#0e161f", bg2="#131c27", card="#1b2230", card2="#212a39", line="#33404a", carril="#2f3b45",
               text="#eee4cc", muted="#a9a393", faint="#767264", acento="#8fb3a4", acentoM="#8fb3a4", segundo="#b89598",
               segundoM="#b89598", aviso="#f2c94c", avisoM="#f2c94c", peligro="#ff8a3d", peligroM="#ff8a3d", sobre="#0e161f",
               piedra="#2c3a40", hierro="#34424a", hondo="#121a24", brasa="#1d3a36"),
    dia=dict(bg="#e2e4df", bg2="#e9ebe6", card="#f5f6f2", card2="#fafbf8", line="#b9c0b8", carril="#dfe3dd",
             text="#161d22", muted="#4c5452", faint="#5d6562", acento="#2f6558", acentoM="#8fb3a4", segundo="#7a4f55",
             segundoM="#b89598", aviso="#6d5500", avisoM="#f2c94c", peligro="#a13a00", peligroM="#ff8a3d", sobre="#161d22",
             piedra="#cfd5cf", hierro="#8b948f", hondo="#edf0ec"))

# Estigia: el id es `cienaga` porque así se llamó en la prueba. Es la
# quinta, la del rango.
PALETAS["cienaga"] = dict(
    nombre="Estigia", ref="la de ocho colores", segundo_nombre="oliva de pantano",
    idea="La laguna Estigia, el pantano del quinto círculo: azul marino, agua verde mar de acento, el oliva del lodo y la luz crema de un fuego fatuo.",
    noche=dict(bg="#0d1030", bg2="#121638", card="#1f2540", card2="#252c4a", line="#37415c", carril="#333c56",
               text="#efe3c4", muted="#aeb1a8", faint="#7a7e7c", acento="#6fae8a", acentoM="#6fae8a", segundo="#a19a58",
               segundoM="#a19a58", aviso="#f2c94c", avisoM="#f2c94c", peligro="#ff8a3d", peligroM="#ff8a3d", sobre="#0d1030",
               piedra="#2a3350", hierro="#2f3a58", hondo="#10143a", brasa="#16324a"),
    dia=dict(bg="#dfe0ea", bg2="#e7e8f0", card="#f4f4f9", card2="#f9f9fc", line="#b6b9cc", carril="#dddfea",
             text="#131634", muted="#474b66", faint="#585c78", acento="#2c6b48", acentoM="#6fae8a", segundo="#5f5a1e",
             segundoM="#a19a58", aviso="#6d5500", avisoM="#f2c94c", peligro="#a13a00", peligroM="#ff8a3d", sobre="#131634",
             piedra="#c9ccdc", hierro="#858aa4", hondo="#eceef4"))
