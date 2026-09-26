# Las cuatro paletas de Averno, en sus dos caras (0.7.136). Las eligió Eduardo
# las cuatro, con Vitral de partida: con Averno puesto sustituyen a los
# ambientes en Mi apariencia. Fuente única: de aquí salen el CSS del mundo
# (`averno.py`), las muestras de Mi apariencia y las medidas (`medir.py`).
#
# `ref` nombra la paleta de Lospec de la que salió la DIRECCIÓN de color. Las
# capturas son de otros artistas y no están en el repositorio a propósito: no
# se copió ningún dibujo, solo el reparto de tonos.
#
# Todo medido con la fórmula WCAG: 4,5 para escribir y 3 para trazar, en las
# dos caras, y un barrido de 7 pantallas × 2 modos contra la casa sin un solo
# fallo que la casa no tenga ya. Si se toca un tono, se vuelve a medir.
#
# Reparto de significados, IGUAL en las cuatro (la regla de MUNDOS.md:
# avisar sigue siendo avisar):
#   acento  = el rojo protagonista (--mint*)       lo que celebras y marcas
#   segundo = el tono que NO es rojo (--celeste*)  el de cada paleta
#   aviso   = oro (--fire*)                        «mira esto»
#   peligro = brasa naranja (--coral*)             destruye / no tiene vuelta
# El peligro deja de ser coral-rosa porque en un mundo rojo el coral se
# confunde con el acento; la brasa es fuego, y el fuego quema.

PALETAS = {
  "vitral": dict(
    nombre="Vitral", ref="lookofhorror · red · redbloodpain", segundo_nombre="índigo de vitral",
    idea="Una nave de catedral de noche: piedra azul-negra y la luz que entra por los vitrales, roja y azul.",
    noche=dict(bg="#07080f", bg2="#10111f", card="#191a2c", card2="#1f2035", line="#303252", carril="#2c2e48",
               text="#ece6f0", muted="#a09bbc", faint="#6f6a8c",
               acento="#ff3d4f", acentoM="#ff3d4f", segundo="#8c86ff", segundoM="#8c86ff",
               aviso="#f2c94c", avisoM="#f2c94c", peligro="#ff8a3d", peligroM="#ff8a3d", sobre="#07080f",
               piedra="#3b3d63", hierro="#4a4d78", hondo="#0e1020"),
    dia=dict(bg="#dfdde9", bg2="#e7e5ef", card="#f4f2f8", card2="#f9f8fc", line="#b9b6cc", carril="#e1dfea",
             text="#15142a", muted="#4c4868", faint="#5e5a7a",
             acento="#b3001b", acentoM="#ff3d4f", segundo="#3d33c4", segundoM="#8c86ff",
             aviso="#6f5600", avisoM="#f2c94c", peligro="#a33a00", peligroM="#ff8a3d", sobre="#15142a",
             piedra="#c9c6da", hierro="#8e8aab", hondo="#e9e7f2")),
  "hueso": dict(
    nombre="Hueso", ref="bloodflame", segundo_nombre="hueso",
    idea="Una cripta: vino casi negro, sangre y el marfil de lo que queda. El fuego se guarda para el peligro.",
    noche=dict(bg="#0b0507", bg2="#160b0f", card="#221318", card2="#28171d", line="#3c242b", carril="#3a2229",
               text="#efeaea", muted="#b39b95", faint="#83665c",
               acento="#ff3b45", acentoM="#ff3b45", segundo="#e8d2b8", segundoM="#e8d2b8",
               aviso="#ffd23c", avisoM="#ffd23c", peligro="#ff8636", peligroM="#ff8636", sobre="#0b0507",
               piedra="#4a2c33", hierro="#5e3a41", hondo="#170c10"),
    dia=dict(bg="#e9e1da", bg2="#f0e9e3", card="#faf5f0", card2="#fdfaf6", line="#cbbdb4", carril="#ebe2dc",
             text="#241114", muted="#5c4040", faint="#6f5250",
             acento="#b0001c", acentoM="#ff3b45", segundo="#74502a", segundoM="#e8d2b8",
             aviso="#6d5500", avisoM="#ffd23c", peligro="#a13a00", peligroM="#ff8636", sobre="#241114",
             piedra="#d8cbc2", hierro="#9e8a82", hondo="#f2ece6")),
  "hierro": dict(
    nombre="Hierro", ref="triad25", segundo_nombre="verdín",
    idea="Una fundición abandonada: gris frío de hierro, óxido verde en las juntas y el rojo que todavía está al rojo.",
    noche=dict(bg="#090c0d", bg2="#111617", card="#1a2022", card2="#1f2628", line="#313b3d", carril="#2f383a",
               text="#e6ecea", muted="#98a8a4", faint="#687875",
               acento="#ff5563", acentoM="#ff5563", segundo="#5fc4ae", segundoM="#5fc4ae",
               aviso="#f4cc50", avisoM="#f4cc50", peligro="#ff8a3a", peligroM="#ff8a3a", sobre="#090c0d",
               piedra="#3c4749", hierro="#4d5a5c", hondo="#111618"),
    dia=dict(bg="#dde2e1", bg2="#e5e9e8", card="#f3f5f4", card2="#f8faf9", line="#b5bebc", carril="#dfe4e3",
             text="#121a1a", muted="#44524f", faint="#56635f",
             acento="#b0001a", acentoM="#ff5563", segundo="#006b58", segundoM="#5fc4ae",
             aviso="#6d5500", avisoM="#f4cc50", peligro="#a13a00", peligroM="#ff8a3a", sobre="#121a1a",
             piedra="#c6cecc", hierro="#86928f", hondo="#e8ecea")),
  "espectro": dict(
    nombre="Espectro", ref="ink-crimson", segundo_nombre="cian espectral",
    idea="Tinta carmesí sobre negro violáceo, y una luz fría que no debería estar ahí: el fantasma.",
    noche=dict(bg="#07030a", bg2="#110816", card="#1b0f20", card2="#211426", line="#37223d", carril="#35213b",
               text="#f2e6ef", muted="#b096ad", faint="#7d667b",
               acento="#ff2a5c", acentoM="#ff2a5c", segundo="#2fe3f0", segundoM="#2fe3f0",
               aviso="#f2cc4a", avisoM="#f2cc4a", peligro="#ff8a3a", peligroM="#ff8a3a", sobre="#07030a",
               piedra="#43284a", hierro="#56355e", hondo="#150a1a"),
    dia=dict(bg="#e6dfe6", bg2="#ede7ed", card="#f8f3f7", card2="#fcf9fb", line="#c6b8c4", carril="#e8e0e7",
             text="#1d0f1c", muted="#553f53", faint="#685166",
             acento="#b3003a", acentoM="#ff2a5c", segundo="#006877", segundoM="#2fe3f0",
             aviso="#6d5500", avisoM="#f2cc4a", peligro="#a13a00", peligroM="#ff8a3a", sobre="#1d0f1c",
             piedra="#d6c9d4", hierro="#9a8698", hondo="#f0ebf0")),
}
