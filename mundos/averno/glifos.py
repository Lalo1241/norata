# Los cinco rangos de Averno, redibujados en píxel sobre rejilla de 16 y de
# RELLENO. Se escriben a mano, fila a fila, y este guion comprueba que cada
# fila mida 16 y que el dibujo sea simétrico donde tiene que serlo.
import json, sys

G = {
  # Ceniza: el caput mortuum, la calavera. Los huecos (ojos, nariz, dientes)
  # son lo que la hace calavera: un hueco a 16 px es una presencia.
  "ceniza": [
    "................",
    ".....######.....",
    "...##########...",
    "..############..",
    ".##############.",
    ".##############.",
    ".##...####...##.",
    ".##...####...##.",
    ".##...####...##.",
    ".###.######.###.",
    "..#####..#####..",
    "...##########...",
    "....########....",
    "....##.##.##....",
    "....##.##.##....",
    "................"],
  # Sello: el aro y el triángulo con la punta abajo, y el punto dentro. Es el
  # mismo dibujo de hoy, que Eduardo pidió no tocar: solo cambia de línea a
  # píxel.
  "sello": [
    ".....######.....",
    "...##......##...",
    "..#..........#..",
    ".#............#.",
    ".#.##########.#.",
    "#...########...#",
    "#...########...#",
    "#....##..##....#",
    "#....##..##....#",
    "#.....####.....#",
    ".#....####....#.",
    ".#.....##.....#.",
    "..#..........#..",
    "...##......##...",
    ".....######.....",
    "................"],
  # Leviatán: la cruz de doble travesaño sobre la lemniscata.
  "leviatan": [
    ".......##.......",
    ".......##.......",
    "...##########...",
    "...##########...",
    ".......##.......",
    ".....######.....",
    ".....######.....",
    ".......##.......",
    ".......##.......",
    ".......##.......",
    "..####.##.####..",
    ".#....####....#.",
    "#.....####.....#",
    ".#....####....#.",
    "..####....####..",
    "................"],
  # Legión: la misma figura tres veces, la de en medio delante y más grande,
  # con el hueco de la cara relleno de sombra (aquí, vacío).
  "legion": [
    "................",
    "................",
    "......####......",
    ".....######.....",
    "....###..###....",
    ".##.##....##.##.",
    "####.#....#.####",
    "#..#.##..##.#..#",
    "#..#.######.#..#",
    "####.######.####",
    "####.######.####",
    "####.######.####",
    "####.######.####",
    "####.######.####",
    "####.######.####",
    "................"],
  # Abadón: el pentagrama invertido en su círculo.
  "abadon": [
    ".....######.....",
    "...##......##...",
    "..#..........#..",
    ".#.#........#.#.",
    ".#.###....###.#.",
    "#...#.####.#...#",
    "#...#.####.#...#",
    "#...##....##...#",
    "#.##.#....#.##.#",
    "################",
    "#.....#..#.....#",
    ".#....#..#....#.",
    "..#...#..#...#..",
    "...##..##..##...",
    ".....######.....",
    "................"],
}

def comprobar():
    for k, filas in G.items():
        assert len(filas) == 16, (k, len(filas))
        for i, f in enumerate(filas):
            assert len(f) == 16, (k, i, len(f), f)
            if f != f[::-1]: print("asimétrica", k, i, f)

def rects(filas):
    r = ""
    for y, f in enumerate(filas):
        x = 0
        while x < len(f):
            if f[x] != "#": x += 1; continue
            w = 1
            while x + w < len(f) and f[x + w] == "#": w += 1
            r += '<rect x="%d" y="%d" width="%d" height="1"/>' % (x, y, w); x += w
    return r

if __name__ == "__main__":
    comprobar()
    for k, filas in G.items():
        print(k); print("\n".join(f.replace(".", " ").replace("#", "█") for f in filas))
    json.dump({k: rects(v) for k, v in G.items()}, open("glifos.json", "w"))
