/* ================= La racha de cada mundo (0.7.143) =================
   El objeto de la racha de Catedral, Averno, Blueprint y Reliquia, sus fichas
   de «Semanas de antes», su marca en el calendario y el suelo de su escena.
   Lo eligió Eduardo en ocho vueltas de boceto con la app dentro
   (https://claude.ai/artifact/CwegthWZ2BwqVNc354zHWk, y las fichas en
   https://claude.ai/artifact/UAmxkGbBue3wLvyzfdwCyj):

   | Mundo     | Objeto                   | Ficha de una semana de antes     |
   | --------- | ------------------------ | -------------------------------- |
   | Catedral  | el candelabro de pie     | la vela (encendida si contó)     |
   | Averno    | el sello de siete rombos | el rombo de doble filete         |
   | Blueprint | la torre                 | la de siempre                    |
   | Reliquia  | el astrolabio            | el orbe que se llena             |

   La casa, sus ambientes y Arcade no cambian: siguen en js/05c-racha.js. Este
   archivo solo AÑADE a sus tablas (`VOZ_RACHA`, `HEROES_RACHA`, y las tres de
   abajo que 05c consulta al pintar), así que se carga justo después de él.

   Dos reglas que salieron de los bocetos y no se tocan sin volver a hablarlo:

   - **Lo que se anima tiene que estar dibujado sin la animación.** Un tramo
     del astrolabio que nace invisible y espera a que su animación termine se
     queda a medias el día que el navegador la frena o la reinicia al
     redibujar (y la tarjeta se redibuja a menudo). Todo aquí se ve completo
     de base; la animación solo lo traza encima.
   - **Lo que se mueve, se mueve siempre.** La araña del astrolabio solo
     giraba con la semana encendida, y como la semana empieza en domingo, de
     domingo a martes estaba quieta para todos. Ahora gira siempre y con la
     semana encendida va más deprisa. */

const VOZ_MUNDOS = {
  catedral: { una: "semana encendida", varias: "semanas encendidas", hecho: "encendida", hechas: "encendidas", obj: "el candelabro", aObj: "al candelabro", hacer: "encenderla" },
  averno:   { una: "semana sellada", varias: "semanas selladas", hecho: "sellada", hechas: "selladas", obj: "el sello", aObj: "al sello", hacer: "sellarla" },
  plano:    { una: "semana trazada", varias: "semanas trazadas", hecho: "trazada", hechas: "trazadas", obj: "la torre", aObj: "a la torre", hacer: "trazarla" },
  reliquia: { una: "semana dorada", varias: "semanas doradas", hecho: "dorada", hechas: "doradas", obj: "el astrolabio", aObj: "al astrolabio", hacer: "dorarla" }
};
Object.assign(VOZ_RACHA, VOZ_MUNDOS);

/* ---------- Píxel: Catedral y Averno se dibujan en una rejilla ----------
   Un «píxel» del dibujo son `p` píxeles de pantalla, así que el objeto crece
   con la tarjeta sin volverse borroso: los bordes son siempre escalones. */
const pxRacha = (p, x0, y0) => (x, y, w, h, cls) => `<rect class="${cls}" x="${r1(x0 + x * p)}" y="${r1(y0 + y * p)}" width="${r1((w || 1) * p)}" height="${r1((h || 1) * p)}"/>`;
function rejillaRacha(x, y, w, h, porAncho, porAlto) {
  const p = Math.max(3, Math.floor(Math.min(w / porAncho, (h - 24) / porAlto)));
  const cols = Math.floor(w / p), filas = Math.floor((h - 34) / p);
  const x0 = x + (w - cols * p) / 2, y0 = y + Math.max(0, (h - 34 - filas * p) / 2);
  return { p, cols, filas, x0, y0, P: pxRacha(p, x0, y0), c: Math.floor(cols / 2) };
}
const rotuloDia = (x, y, d, i) => `<text class="rt-rot centro${d.hoy ? " fuerte" : ""}" x="${r1(x)}" y="${r1(y)}">${letrasDeSemana()[i]}</text>`;
// El rombo de píxel: el remate del idioma de Averno (círculo, rombo y 45°)
const romboPx = (P, rx, ry, cls, grande) => grande
  ? P(rx, ry - 2, 1, 1, cls) + P(rx - 1, ry - 1, 3, 1, cls) + P(rx - 2, ry, 5, 1, cls) + P(rx - 1, ry + 1, 3, 1, cls) + P(rx, ry + 2, 1, 1, cls)
  : P(rx, ry - 1, 1, 1, cls) + P(rx - 1, ry, 3, 1, cls) + P(rx, ry + 1, 1, 1, cls);

// La llama de una vela: dos cuadros, el segundo es el espejo del primero
const LLAMA_PX = [".1.", ".1.", "121", "121", "232", "121", ".1."];
function llamaPx(P, cx, top) {
  let s = "";
  [0, 1].forEach(fr => {
    let g = "";
    LLAMA_PX.forEach((fila, r) => {
      const f = fr ? fila.split("").reverse().join("") : fila;
      const lado = fr && r < 2 ? (r ? -1 : 1) : 0;      // la punta se mece entre cuadros
      for (let c = 0; c < 3; c++) if (f[c] !== ".") g += P(cx - 1 + c + lado, top + r, 1, 1, "avr-f f" + f[c]);
    });
    s += `<g class="ar-cuadro f${fr}">${g}</g>`;
  });
  return s;
}
const claseVela = d => d.estado === "futuro" ? "avr-cera futuro" : d.estado === "si" ? "avr-cera" : "avr-cera apagada";

/* ---------- Catedral · el candelabro de pie ----------
   Siete velas en un brazo de hierro, una por día; la del día que tuvo algo se
   enciende. Con la semana encendida, el nudo del fuste se dora y la luz cae
   al suelo. Nació en el Averno viejo y Eduardo lo quiso para Catedral, con
   sus colores: hierro, cera y fuego. */
function heroCandelabro(x, y, w, h, Z) {
  const { P, cols, filas, c, x0, y0, p } = rejillaRacha(x, y, w, h, 62, 38);
  let s = "";
  const fe = "avr-hierro", brazoY = Math.round(filas * .3), paso = Math.min(8, Math.floor((cols - 6) / 7)), ancho = paso * 6;
  const xs = [...Array(7)].map((_, i) => c - ancho / 2 + i * paso), pie = filas - 3;
  /* El brazo va de dos píxeles antes de la primera vela a dos después de la
     última, y cada vela mide dos: son `ancho + 6`. Era `+ 5`, y el rombo de la
     derecha se quedaba flotando a un píxel del brazo (Eduardo, 0.7.143.3). */
  s += P(xs[0] - 2, brazoY + 6, ancho + 6, 1, fe) + romboPx(P, xs[0] - 4, brazoY + 6, fe) + romboPx(P, xs[6] + 5, brazoY + 6, fe);
  const nudo = Math.round((brazoY + pie) / 2);
  s += P(c, brazoY + 7, 1, pie - brazoY - 9, fe) + romboPx(P, c, brazoY + 9, fe) + romboPx(P, c, nudo, Z.ok ? "avr-nudo oro" : fe);
  s += P(c - 1, pie - 2, 3, 1, fe) + P(c - 3, pie - 1, 7, 1, fe) + P(c - 5, pie, 11, 1, fe);
  if (Z.ok) s += P(c - 8, pie + 1, 17, 1, "avr-charco luz");
  Z.dias.forEach((d, i) => {
    const cx = xs[i];
    s += P(cx - 1, brazoY + 5, 4, 1, fe) + P(cx, brazoY, 2, 5, claseVela(d));
    if (d.estado === "si") s += P(cx - 2, brazoY - 9, 6, 8, "avr-halo") + llamaPx(P, cx + .5, brazoY - 8);
    else s += P(cx + .5, brazoY - 1, 1, 1, "avr-mecha");
    /* La letra, con su propia clase: a 11 px y en la letra de las cifras «no
       se leían, sobre todo la que choca con el soporte» (la vela de en medio
       cae justo encima del fuste). Ver `.cand-dia` en css/estilos.css. */
    s += rotuloDia(x0 + (cx + 1) * p, y0 + (brazoY + 7) * p + 16, d, i).replace('class="rt-rot', 'class="rt-rot cand-dia');
  });
  return s;
}

/* ---------- Averno · el sello ----------
   Un círculo de invocación con siete rombos en sus vértices. Cada día llena
   un rombo de sangre y traza su punta de la estrella; con tres, la estrella
   de siete puntas se traza entera y el rombo del centro se enciende.

   El diseño y el tamaño son los de la 0.7.143 —un aro fino, otro más fino por
   dentro y rombos chicos—, que es el que Eduardo quiere. Lo que cambió en la
   0.7.143.2 es solo la NITIDEZ: se mide todo en píxeles de pantalla a partir
   de aquella rejilla y se dibuja en una el doble de fina, así que los bordes
   bajan en escalones pequeños en vez de en bloques. La 0.7.143.1 engordó el
   aro y los rombos y agrandó el sello, y perdió el encanto; eso se deshizo. */
const romboDe = (P, rx, ry, n, cls) => {
  let s = "";
  for (let k = -n; k <= n; k++) { const a = n - Math.abs(k); s += P(rx - a, ry + k, 2 * a + 1, 1, cls); }
  return s;
};
function heroSello(x, y, w, h, Z) {
  // La rejilla de la 0.7.143, solo para medir: de ahí salen el tamaño y las distancias
  const pv = Math.max(3, Math.floor(Math.min(w / 60, (h - 24) / 36)));
  const colsV = Math.floor(w / pv), filasV = Math.floor((h - 34) / pv);
  const Rpx = Math.min(Math.floor(filasV / 2) - 1, Math.floor(colsV / 2) - 8, 20) * pv;
  // Y la rejilla fina, la mitad (o casi) de aquella
  const p = Math.max(2, Math.floor(pv / 2)), k = pv / p;
  const cols = Math.floor(w / p), x0 = x + (w - cols * p) / 2;
  /* Un poco más abajo que en la 0.7.143: la «D» tocaba el mensaje de la
     tarjeta. AIRE son los píxeles libres sobre la letra de arriba. */
  const AIRE = 24, ESPpx = Math.round(4 * pv) + 2;
  /* Y que quepa: bajarlo no puede meter las letras de abajo en la franja de
     las semanas. Si no cabe, el sello encoge lo justo. */
  const Rcabe = Math.min(Rpx, Math.floor((h - AIRE - 2 * ESPpx - 16) / 2));
  const R = Math.round(Rcabe / p), cx = Math.floor(cols / 2);
  const cy = Math.round((AIRE + ESPpx + Rcabe) / p), y0 = y;
  const P = pxRacha(p, x0, y0);
  const sx = v => r1(x0 + (cx + .5 + v) * p), sy = v => r1(y0 + (cy + .5 + v) * p);
  const rv = Math.max(2, Math.round(2 * k));        // el rombo de siempre, en celdas finas
  const hueco = k + .6;                            // el aire entre el aro y el fino
  let s = "";
  for (let j = -R - 2; j <= R + 2; j++) for (let i = -R - 2; i <= R + 2; i++) {
    const d = Math.hypot(i + .5, j + .5);
    if (d <= R + .5 && d > R - .9) s += P(cx + i, cy + j, 1, 1, Z.ok ? "avs-aro vivo" : "avs-aro");
    else if (d <= R - .9 - hueco && d > R - 1.9 - hueco) s += P(cx + i, cy + j, 1, 1, "avs-aro fino");
  }
  const V = [...Array(7)].map((_, q) => { const a = -Math.PI / 2 + q * 2 * Math.PI / 7; return [Math.cos(a) * (R - k), Math.sin(a) * (R - k)]; });
  /* La estrella {7/3}: un trazo por punta. El largo va medido y no con
     `pathLength`, y el trazo está dibujado de base (ver arriba). */
  V.forEach((v, q) => {
    const u = V[(q + 3) % 7], vivo = Z.ok || Z.dias[q].estado === "si";
    const lt = r1(Math.hypot((u[0] - v[0]) * p, (u[1] - v[1]) * p) + 1);
    s += `<path class="avs-linea${vivo ? " viva" : ""}${Z.ok ? " toda" : ""}" d="M${sx(v[0])} ${sy(v[1])}L${sx(u[0])} ${sy(u[1])}" style="--lt:${lt}px;animation-delay:${r1(q * .1)}s"/>`;
  });
  Z.dias.forEach((d, q) => {
    const [vx, vy] = V[q], rx = Math.round(cx + vx), ry = Math.round(cy + vy);
    s += romboDe(P, rx, ry, rv + 1, "avs-fondo") + romboDe(P, rx, ry, rv, "avs-rombo " + d.estado);
    const a = -Math.PI / 2 + q * 2 * Math.PI / 7, rl = R * p + ESPpx;
    s += `<text class="rt-rot centro sello-dia${d.hoy ? " fuerte" : ""}" x="${r1(x0 + (cx + .5) * p + Math.cos(a) * rl)}" y="${r1(y0 + (cy + .5) * p + Math.sin(a) * rl + 5)}">${letrasDeSemana()[q]}</text>`;
  });
  s += romboDe(P, cx, cy, rv, Z.ok ? "avs-centro vivo" : "avs-centro");
  return s;
}

/* ---------- Reliquia · el astrolabio ----------
   Un disco de latón. Cada día dora un tramo del anillo de fuera; la araña de
   dentro gira siempre, y con la semana encendida va más deprisa y su estrella
   se prende. El tramo de hoy late. Sin anilla de colgar: chocaba con la letra
   del primer día (Eduardo). */
function heroAstrolabio(x, y, w, h, Z) {
  const L = letrasDeSemana();
  /* Centrado en su hueco, a lo alto y a lo ancho, con aire para las letras:
     arriba del todo la «D» tocaba el mensaje de la tarjeta (0.7.143.3). */
  const R = Math.max(40, Math.min(h / 2 - 34, w * .3, 92)), cx = x + w / 2, cy = y + h / 2;
  const pt = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  let s = `<circle class="rq2-disco" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(R)}"/>`;
  /* Los gajos casi juntos (0.7.143.3): con el hueco de antes se leían como
     siete piezas sueltas y no como un anillo. Y un día que ya cuenta lleva
     debajo un resplandor dorado que respira, para que se vea de lejos. */
  const tramo = 2 * Math.PI / 7, ra = R - 7, hueco = .022;
  let brillo = "";
  Z.dias.forEach((d, i) => {
    const a0 = -Math.PI / 2 + i * tramo + hueco - tramo / 2, a1 = a0 + tramo - 2 * hueco;
    const [x1, y1] = pt(a0, ra), [x2, y2] = pt(a1, ra), lt = r1(ra * (a1 - a0) + 1);
    const arco = `M${r1(x1)} ${r1(y1)}A${r1(ra)} ${r1(ra)} 0 0 1 ${r1(x2)} ${r1(y2)}`;
    if (d.estado === "si") brillo += `<path class="rq2-aura" d="${arco}" style="animation-delay:-${r1(i * .35)}s"/>`;
    s += `<path class="rq2-tramo ${d.estado}${d.hoy ? " hoy" : ""}" d="${arco}" style="--lt:${lt}px;animation-delay:${r1(.2 + i * .16)}s"/>`;
    const [lx, ly] = pt(-Math.PI / 2 + i * tramo, R + 11);
    s += `<text class="rt-rot centro${d.hoy ? " fuerte" : ""}" x="${r1(lx)}" y="${r1(ly + 4)}">${L[i]}</text>`;
  });
  s = s.replace(`r="${r1(R)}"/>`, `r="${r1(R)}"/>${brillo}`);
  // Las graduaciones, finas, por dentro del anillo
  for (let k = 0; k < 56; k++) {
    const a = k * 2 * Math.PI / 56, [ax, ay] = pt(a, R - 14), [bx, by] = pt(a, R - (k % 4 ? 17 : 20));
    s += `<path class="rq2-grado" d="M${r1(ax)} ${r1(ay)}L${r1(bx)} ${r1(by)}"/>`;
  }
  const rr = R - 22;
  s += `<circle class="rq2-placa" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rr)}"/>`;
  // Los círculos del cielo: el trópico y el horizonte
  s += `<circle class="rq2-linea" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rr * .62)}"/>`;
  s += `<ellipse class="rq2-linea" cx="${r1(cx)}" cy="${r1(cy + rr * .18)}" rx="${r1(rr * .9)}" ry="${r1(rr * .5)}"/>`;
  // La araña: un anillo excéntrico y tres brazos con sus puntas de estrella
  let g = `<circle class="rq2-arana" cx="${r1(cx)}" cy="${r1(cy - rr * .22)}" r="${r1(rr * .6)}"/>`;
  [0, 2.1, 4.2].forEach((a, k) => {
    const [tx, ty] = pt(a - Math.PI / 2, rr * .88);
    g += `<path class="rq2-arana" d="M${r1(cx)} ${r1(cy)}L${r1(tx)} ${r1(ty)}"/>`;
    g += `<path class="rq2-estrella${k === 0 && Z.ok ? " viva" : ""}" d="M${r1(tx)} ${r1(ty - 5)}L${r1(tx + 2)} ${r1(ty)}L${r1(tx)} ${r1(ty + 5)}L${r1(tx - 2)} ${r1(ty)}Z"/>`;
  });
  s += `<g class="rq2-rete${Z.ok ? " viva" : ""}" style="transform-origin:${r1(cx)}px ${r1(cy)}px">${g}</g>`;
  s += `<circle class="rq2-perno" cx="${r1(cx)}" cy="${r1(cy)}" r="3.4"/>`;
  return s;
}

/* ---------- Blueprint · la torre ----------
   Un rascacielos escalonado con dos alas, del alto de toda la hoja. No es
   ningún edificio famoso a propósito: el dibujo es el mismo cada semana y no
   puede cansar. Cada día traza su parte con varias líneas, una detrás de
   otra, así que el edificio se ve construirse. */
function heroTorre(x, y, w, h, Z) {
  const sx = x + 10, sw = w - 20, top = y + 6, base = y + h - 44;
  const H = base - top, cx = sx + sw / 2;
  const tw = Math.min(sw * .2, 78), bw = Math.min(sw * .9, 430), aw = (bw - tw) / 2 - 6;
  const podio = H * .1, alaT = base - H * .42, fusteT = base - H * .64, esc1 = base - H * .76, esc2 = base - H * .85;
  const w1 = tw * .74, w2 = tw * .5, cimaT = base - H * .92, aguja = top;
  const L = [];
  // 1 · El suelo: la línea de tierra, el podio y la escalinata
  L.push([
    `M${r1(sx)} ${r1(base)}H${r1(sx + sw)}`,
    `M${r1(cx - bw / 2)} ${r1(base)}V${r1(base - podio)}H${r1(cx + bw / 2)}V${r1(base)}`,
    `M${r1(cx - bw / 2 - 4)} ${r1(base - podio)}H${r1(cx + bw / 2 + 4)}`,
    `M${r1(cx - 18)} ${r1(base)}v-3h36v3M${r1(cx - 14)} ${r1(base - 3)}v-3h28v3`
  ]);
  // 2 y 3 · Las dos alas: el volumen, la cornisa y dos filas de ventanas
  [-1, 1].forEach(lado => {
    const x1 = lado < 0 ? cx - tw / 2 - 6 - aw : cx + tw / 2 + 6, x2 = x1 + aw, g = [];
    g.push(`M${r1(x1)} ${r1(base - podio)}V${r1(alaT)}H${r1(x2)}V${r1(base - podio)}`);
    g.push(`M${r1(x1 - 3)} ${r1(alaT)}H${r1(x2 + 3)}M${r1(x1 - 3)} ${r1(alaT + 4)}H${r1(x2 + 3)}`);
    const n = Math.max(3, Math.floor(aw / 16)), vw = aw / n;
    [.3, .64].forEach(fy => {
      const yy = alaT + (base - podio - alaT) * fy;
      for (let k = 0; k < n; k++) g.push(`M${r1(x1 + vw * k + vw * .28)} ${r1(yy)}h${r1(vw * .44)}v9h${r1(-vw * .44)}z`);
    });
    L.push(g);
  });
  // 4 · El fuste: las dos aristas, los montantes, las bandas y la puerta en arco
  const f = [`M${r1(cx - tw / 2)} ${r1(base - podio)}V${r1(fusteT)}`, `M${r1(cx + tw / 2)} ${r1(base - podio)}V${r1(fusteT)}`];
  [-.25, 0, .25].forEach(k => f.push(`M${r1(cx + tw * k)} ${r1(base - podio - 20)}V${r1(fusteT + 4)}`));
  [.35, .7].forEach(k => f.push(`M${r1(cx - tw / 2)} ${r1(base - podio - (base - podio - fusteT) * k)}h${r1(tw)}`));
  f.push(`M${r1(cx - 9)} ${r1(base - podio)}V${r1(base - podio - 10)}A9 9 0 0 1 ${r1(cx + 9)} ${r1(base - podio - 10)}V${r1(base - podio)}`);
  L.push(f);
  // 5 · Los escalonamientos: dos retranqueos y sus montantes
  L.push([
    `M${r1(cx - tw / 2)} ${r1(fusteT)}H${r1(cx - w1 / 2)}V${r1(esc1)}H${r1(cx - w2 / 2)}V${r1(esc2)}`,
    `M${r1(cx + tw / 2)} ${r1(fusteT)}H${r1(cx + w1 / 2)}V${r1(esc1)}H${r1(cx + w2 / 2)}V${r1(esc2)}`,
    `M${r1(cx - w1 / 4)} ${r1(fusteT - 2)}V${r1(esc1 + 2)}M${r1(cx + w1 / 4)} ${r1(fusteT - 2)}V${r1(esc1 + 2)}`,
    `M${r1(cx)} ${r1(esc1 - 2)}V${r1(esc2 + 2)}`
  ]);
  // 6 · La corona: la cima escalonada, el reloj y las aletas
  const rr = Math.min(w2 * .3, 9), ry = (esc2 + cimaT) / 2 + 2;
  L.push([
    `M${r1(cx - w2 / 2)} ${r1(esc2)}V${r1(cimaT)}H${r1(cx + w2 / 2)}V${r1(esc2)}`,
    `M${r1(cx + rr)} ${r1(ry)}A${r1(rr)} ${r1(rr)} 0 1 1 ${r1(cx - rr)} ${r1(ry)}A${r1(rr)} ${r1(rr)} 0 1 1 ${r1(cx + rr)} ${r1(ry)}`,
    `M${r1(cx)} ${r1(ry)}v${r1(-rr * .7)}M${r1(cx)} ${r1(ry)}h${r1(rr * .5)}`,
    `M${r1(cx - w2 / 2)} ${r1(cimaT + 6)}l-6 8M${r1(cx + w2 / 2)} ${r1(cimaT + 6)}l6 8`
  ]);
  // 7 · La aguja, la antena con su bandera y las cotas
  const cX = Math.min(cx + bw / 2 + 12, sx + sw - 2);
  L.push([
    `M${r1(cx - w2 * .3)} ${r1(cimaT)}L${r1(cx)} ${r1(aguja + 16)}L${r1(cx + w2 * .3)} ${r1(cimaT)}`,
    `M${r1(cx)} ${r1(aguja + 16)}V${r1(aguja)}`,
    `M${r1(cx)} ${r1(aguja + 1)}l10 3.5l-10 3.5`,
    `M${r1(cX)} ${r1(base)}V${r1(aguja)}M${r1(cX - 4)} ${r1(base)}h8M${r1(cX - 4)} ${r1(aguja)}h8`
  ]);
  let s = "";
  L.forEach((g, i) => g.forEach((d, j) => {
    s += `<path class="pl-trazo torre ${Z.dias[i].estado}" pathLength="1" d="${d}" style="animation-delay:${r1(i * .18 + j * .09)}s"/>`;
  }));
  if (Z.ok) s += `<g class="pl-sello" transform="translate(${r1(sx + 52)} ${r1(top + 30)}) rotate(-12)"><rect x="-44" y="-15" width="88" height="30" rx="4"/><text x="0" y="5">${escapeHtml(tx("TRAZADA"))}</text></g>`;
  return s + filaDeDias(Z, x + 10, y + h - 34, w - 20, "caja");
}

Object.assign(HEROES_RACHA, { catedral: heroCandelabro, averno: heroSello, plano: heroTorre, reliquia: heroAstrolabio });

/* ---------- Las fichas de «Semanas de antes» ----------
   Cada ficha sale del mismo objeto que la racha. El número lo escribe
   `dibujoDeRacha` en el centro, así que cada ficha deja ese hueco. */
const arcoRacha = (cx, cy, r, a0, a1) => {
  const p0 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
  return `M${r1(p0[0])} ${r1(p0[1])}A${r1(r)} ${r1(r)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r1(p1[0])} ${r1(p1[1])}`;
};
let _orbeId = 0;
const FICHAS_RACHA = {
  // Averno: la casilla en rombo con doble filete, como --av-rombo
  averno(w, cx, cy, s) {
    const c = `rt-ficha px rombo${w.ok ? " si" : ""}`, R = s * 1.08, r2 = R - 4;
    return `<path class="${c}" d="M${r1(cx)} ${r1(cy - R)}L${r1(cx + R)} ${r1(cy)}L${r1(cx)} ${r1(cy + R)}L${r1(cx - R)} ${r1(cy)}Z"/><path class="rt-rombo-in" d="M${r1(cx)} ${r1(cy - r2)}L${r1(cx + r2)} ${r1(cy)}L${r1(cx)} ${r1(cy + r2)}L${r1(cx - r2)} ${r1(cy)}Z"/>`;
  },
  /* Reliquia: el orbe de vidrio. Se llena desde abajo con los días que tuvo
     esa semana (n de 7): dorado si contó, lila apagado si no. El líquido va
     recortado por el propio orbe —con un id único, porque la ficha sale en la
     tarjeta y en la hoja a la vez— y sube al abrirse, una semana detrás de
     otra. Lo eligió Eduardo frente al anillo de gajos. */
  reliquia(w, cx, cy, s) {
    const ok = w.ok ? " si" : "", ro = s * 1.07, f = Math.max(0, Math.min(1, w.n / 7));
    const id = "orbe-racha-" + (++_orbeId), yl = cy + ro - 2 * ro * f;
    let t = `<clipPath id="${id}"><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(ro)}"/></clipPath>`;
    t += `<circle class="fq-orbe-vidrio" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(ro)}"/>`;
    if (f > 0) {
      let liq = `<rect class="fq-orbe-liq${ok}" x="${r1(cx - ro)}" y="${r1(yl)}" width="${r1(2 * ro)}" height="${r1(2 * ro * f + 2)}"/>`;
      if (f < 1) liq += `<path class="fq-orbe-nivel${ok}" d="M${r1(cx - ro)} ${r1(yl)}H${r1(cx + ro)}"/>`;
      t += `<g clip-path="url(#${id})"><g class="fq-sube" style="--h:${r1(2 * ro * f + 2)}px;--d:${r1(.15 + (_orbeId % 4) * .18)}s"><g class="fq-mece">${liq}</g></g></g>`;
    }
    t += `<path class="fq-orbe-brillo" d="${arcoRacha(cx, cy, ro * .72, Math.PI * 1.08, Math.PI * 1.42)}"/>`;
    return t + `<circle class="fq-orbe-borde${ok}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(ro)}"/>`;
  },
  // Catedral: la vela, con el número en la cera; encendida si la semana contó
  catedral(w, cx, cy, s) {
    const ok = !!w.ok, q = Math.max(2, s / 8), oy = cy + 3;
    const P = (x, y, ww, hh, cls) => `<rect class="${cls}" x="${r1(cx + x * q)}" y="${r1(oy + y * q)}" width="${r1(ww * q)}" height="${r1(hh * q)}"/>`;
    /* Diez de ancho y no ocho: el número va escrito en la cera, y con dos
       cifras se salía por los lados; «demasiado compactadas» (Eduardo). */
    let t = P(-5, -5, 10, 11, ok ? "fc-cera si" : "fc-cera") + P(-6, 6, 12, 1, "fc-hierro") + P(-4, 7, 8, 1, "fc-hierro");
    t += ok ? P(0, -10, 1, 1, "fc-llama f1") + P(-1, -9, 3, 1, "fc-llama f1") + P(-1, -8, 3, 2, "fc-llama f2") + P(0, -8, 1, 1, "fc-llama f3")
      : P(0, -7, 1, 2, "fc-mecha");
    return t;
  }
};

/* La marca de cada mundo al final de la fila de una semana encendida, en
   «Tu racha». Iconos de 24, en línea, como el resto. */
const MARCAS_RACHA = {
  catedral: '<path d="M12 3c1.6 2 1.6 3.4 0 4.6-1.6-1.2-1.6-2.6 0-4.6z"/><path d="M10.5 9h3v9h-3z"/><path d="M7 18h10"/>',
  averno: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5l3 8.5-7.5-5h9L9 12z"/>',
  reliquia: '<circle cx="12" cy="13" r="8"/><circle cx="12" cy="13" r="2"/><path d="M12 3v2M12 13l4-5"/>'
};

/* ---------- El suelo de la escena ----------
   El paisaje —cielo, luna, colinas— es de Norata clásico. Un mundo trae su
   propio suelo detrás de la racha, y todo sale de las variables del mundo.
   Se pinta al tamaño real de la escena (`vestirFondoRacha`), para que los
   sillares y la rejilla no se estiren. */
function fondoRachaMundo(m, W, H) {
  const r = mulberry32(31);
  let s = "";
  if (m === "averno") {
    // Brasas que suben desde abajo y el marco de hueso con las esquinas a 45°
    for (let k = 0; k < 4; k++) s += `<rect class="fm-brasa" x="0" y="${r1(H - (k + 1) * 8)}" width="${W}" height="8" style="opacity:${r1(.22 - k * .05)}"/>`;
    for (let i = 0; i < 18; i++) {
      const bx = Math.floor(r() * W / 3) * 3, by = Math.floor((H * .72 + r() * H * .26) / 3) * 3;
      s += `<rect class="fm-chispa${r() > .6 ? " clara" : ""}" x="${bx}" y="${by}" width="3" height="3" style="animation-delay:-${r1(r() * 4)}s"/>`;
    }
    const m0 = 7, e = 12, pz = 3;
    const esc = (dx, dy) => { let t = ""; for (let k = 0; k < e / pz; k++) t += `l${dx * pz} 0l0 ${dy * pz}`; return t; };
    s += `<path class="fm-hueso" d="M${m0 + e} ${m0}H${W - m0 - e}${esc(1, 1)}V${H - m0 - e}${esc(-1, 1)}H${m0 + e}${esc(-1, -1)}V${m0 + e}${esc(1, -1)}Z"/>`;
    [[m0 + e / 2, m0 + e / 2], [W - m0 - e / 2, m0 + e / 2], [m0 + e / 2, H - m0 - e / 2], [W - m0 - e / 2, H - m0 - e / 2]].forEach(([x, y]) => {
      s += `<path class="fm-hueso-punto" d="M${x} ${y - 3}l3 3l-3 3l-3 -3z"/>`;
    });
  } else if (m === "catedral") {
    // Sillares a soga: cada hilada corre media pieza sobre la de abajo
    const alto = 22, largo = 46;
    for (let f = 0, y = 0; y < H * .8; f++, y += alto) {
      for (let x = -(f % 2) * largo / 2; x < W; x += largo) {
        s += `<rect class="fm-sillar" x="${r1(x + 1)}" y="${r1(y + 1)}" width="${largo - 2}" height="${alto - 2}" style="opacity:${r1(.55 + r() * .45)}"/>`;
        if (r() > .82) s += `<rect class="fm-grieta" x="${r1(x + 6 + r() * 24)}" y="${r1(y + 6)}" width="2" height="${r1(4 + r() * 8)}"/>`;
      }
    }
    const suelo = H * .8;
    for (let x = -20; x < W; x += 70) s += `<rect class="fm-losa" x="${x + 1}" y="${r1(suelo)}" width="68" height="${r1(H - suelo)}"/><rect class="fm-canto" x="${x + 1}" y="${r1(suelo)}" width="68" height="2"/>`;
    s += `<rect class="fm-sombra" x="0" y="0" width="${W}" height="${H}"/>`;
  } else if (m === "plano") {
    for (let x = 0; x < W; x += 12) s += `<path class="fm-linea${x % 60 ? "" : " mayor"}" d="M${x} 0V${H}"/>`;
    for (let y = 0; y < H; y += 12) s += `<path class="fm-linea${y % 60 ? "" : " mayor"}" d="M0 ${y}H${W}"/>`;
    s += `<rect class="fm-margen" x="10" y="10" width="${W - 20}" height="${H - 20}"/>`;
  } else if (m === "reliquia") {
    // El terciopelo capitoné, apagado: el astrolabio manda (Eduardo)
    const p = 34;
    for (let y = -p; y < H + p; y += p / 2) for (let x = ((y / (p / 2)) % 2 ? p / 2 : 0) - p; x < W + p; x += p) {
      s += `<path class="fm-pliegue" d="M${x} ${y}l${p / 2} ${p / 2}l${-p / 2} ${p / 2}l${-p / 2} ${-p / 2}z"/><circle class="fm-boton" cx="${x}" cy="${y}" r="1.6"/>`;
    }
    s += `<ellipse class="fm-foco" cx="${W / 2}" cy="-10" rx="${W * .45}" ry="${H * .8}"/>`;
    s += `<rect class="fm-sombra-rq" width="${W}" height="${H}"/>`;
  } else return null;
  return `<svg class="scene fm fm-${m}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect class="fm-suelo-base" width="${W}" height="${H}"/>${s}</svg>`;
}

/* Cambia el paisaje de la escena por el suelo del mundo, ya con la escena en
   la página y al tamaño que tiene. Con la casa, Arcade o un ambiente no hace
   nada: se queda el paisaje de siempre. */
function vestirFondoRacha(card) {
  if (!card) return;
  const t = temaRacha();
  const vieja = card.querySelector(":scope > svg.scene");
  if (!vieja || !VOZ_MUNDOS[t]) return;
  const b = card.getBoundingClientRect();
  const nuevo = fondoRachaMundo(t, Math.max(320, Math.round(b.width) || 520), Math.max(220, Math.round(b.height) || 456));
  if (!nuevo) return;
  vieja.outerHTML = nuevo;
  card.classList.add("con-fondo-mundo");
}
