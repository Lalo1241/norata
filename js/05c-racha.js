/* La racha: semanas encendidas (0.7.135)

   ---- Por qué cuenta semanas y no días ----
   La tarjeta de la racha era un mes en casillas. Tenía tres problemas que no
   se arreglaban acomodándolo: se vaciaba cada día 1 (el día 2 eran 28 casillas
   apagadas), cambiaba de alto con el mes y en los de seis semanas se cortaba,
   y un día sin nada se leía como un hueco. Se probaron once versiones con
   Eduardo en un borrador con la app dentro
   (https://claude.ai/artifact/TLxT4kqJXbbrZUUjesAfBU) y eligió esta.

   La regla: **una semana se enciende con tres días con algo**, y la tarjeta
   cuenta semanas encendidas seguidas. Un martes malo ya no rompe nada. Es la
   misma idea con la que Nike Run Club cuenta semanas: una racha de días
   castiga a quien tiene una vida con días malos, que es todo el mundo.

   **La racha de DÍAS sigue viva por debajo**: los hitos (3, 7, 14…) y su
   celebración siguen contando días seguidos, igual que antes. Pasarlos a
   semanas es una decisión pendiente de Eduardo.

   ---- Un objeto por mundo ----
   La regla es la misma en todos; lo que cambia es con qué se dibuja y cómo
   se dice. En la casa y sus ambientes, una fogata con un leño por día. En
   Blueprint, un plano que se traza. En Reliquia, una vitrina que se llena.
   En Arcade, la fogata en píxeles. **Averno usa la fogata de la casa a
   propósito**: el mundo se está rediseñando entero (gótico, píxel, vitral) y
   el suyo se hace con ese diseño y no con el que se va a tirar.

   ---- El calendario de siempre ----
   Semanas encendidas se lee rápido cuando ya sabes qué es. Quien acaba de
   llegar necesita además un mes normal, con sus números. Vive al TOCAR la
   tarjeta («Tu racha»), y la pieza que une las dos cosas es que en un
   calendario cada fila ya es una semana: la semana encendida es un hilo que
   une sus días, y lleva la marca del mundo al final de su fila. */

const UMBRAL_SEMANA = 3;

/* Qué objeto le toca. Averno cae en la casa: ver arriba. */
function temaRacha() {
  if (typeof arcadePuesto === "function" && arcadePuesto()) return "arcade";
  const a = typeof apariencia === "function" ? apariencia() : "casa";
  return a === "plano" || a === "reliquia" ? a : "casa";
}

/* Las palabras de cada mundo. La regla no cambia; cambia qué se hace con los
   días. Cada frase pasa por el diccionario al usarse.

   `aObj` va aparte y no se arma con «a» + `obj`: el español contrae «a el»
   en «al», y la 0.7.135 salió diciendo «Hoy ya sumó a el plano». */
const VOZ_RACHA = {
  casa:     { una: "semana encendida", varias: "semanas encendidas", hecho: "encendida", hechas: "encendidas", obj: "la fogata", aObj: "a la fogata", hacer: "encenderla" },
  plano:    { una: "semana trazada", varias: "semanas trazadas", hecho: "trazada", hechas: "trazadas", obj: "el plano", aObj: "al plano", hacer: "trazarla" },
  reliquia: { una: "semana en vitrina", varias: "semanas en vitrina", hecho: "en vitrina", hechas: "en vitrina", obj: "la vitrina", aObj: "a la vitrina", hacer: "ponerla en la vitrina" },
  arcade:   { una: "semana superada", varias: "semanas superadas", hecho: "superada", hechas: "superadas", obj: "la fogata", aObj: "a la fogata", hacer: "superarla" }
};

const actividadEn = (m, k) => (m.get(k) || 0) > 0;
const r1 = n => Math.round(n * 10) / 10;

/* La semana en curso, las de antes y cuántas encendidas seguidas. La semana
   empieza en domingo, como la dibuja el resto de la app (`letrasDeSemana`). */
function semanasDeRacha(m, hoy) {
  const ini = addDaysKey(hoy, -weekdayOfKey(hoy));
  const lista = [];
  for (let w = 0; w < 12; w++) {
    const i0 = addDaysKey(ini, -7 * w);
    let n = 0;
    for (let d = 0; d < 7; d++) if (actividadEn(m, addDaysKey(i0, d))) n++;
    lista.push({ ini: i0, n, ok: n >= UMBRAL_SEMANA });
  }
  let seguidas = lista[0].ok ? 1 : 0;
  for (let w = 1; w < lista.length; w++) { if (lista[w].ok) seguidas++; else break; }
  const dias = [];
  for (let d = 0; d < 7; d++) {
    const k = addDaysKey(ini, d);
    dias.push({ k, estado: k > hoy ? "futuro" : actividadEn(m, k) ? "si" : "no", hoy: k === hoy });
  }
  return { lista, seguidas, n: lista[0].n, ok: lista[0].ok, dias };
}

/* ---- Lo que dice la tarjeta ----
   Arriba a la derecha y en dos renglones: el estado y lo que significa. Y con
   color, porque no es lo mismo ir sobrado que ir justo o que ya no llegar:

     bien    menta       la semana ya cuenta
     neutro  texto       falta, y hay días de sobra
     alerta  luciérnaga  quedan exactamente los días que hacen falta
     pausa   coral       esta semana ya no llega

   El coral no regaña: dice lo que pasa y da la salida, como todo aviso de
   Norata. Lo que se lleva no se pierde. Los pidió Eduardo así, con colores. */
function mensajeRacha(Z, t) {
  const V = VOZ_RACHA[t];
  const hoyCuenta = Z.dias.some(d => d.hoy && d.estado === "si");
  const quedan = Z.dias.filter(d => d.estado === "futuro").length + (hoyCuenta ? 0 : 1);
  const falta = Math.max(0, UMBRAL_SEMANA - Z.n);
  const corte = Z.lista.slice(1).findIndex(w => !w.ok);
  const previas = corte < 0 ? Z.lista.length - 1 : corte;
  if (!falta) {
    const seguidas = previas + 1;
    let l2;
    if (Z.n === 7) l2 = seguidas > 1 ? T`Los siete días. Van ${seguidas} semanas seguidas.` : tx("Los siete días, completa.");
    else if (hoyCuenta) l2 = seguidas > 1 ? T`Hoy ya sumó. Van ${seguidas} semanas seguidas.` : T`Hoy ya sumó ${tx(V.aObj)}.`;
    else l2 = T`Si hoy haces algo, ${tx(V.obj)} crece.`;
    return { tono: "bien", l1: T`Semana ${tx(V.hecho)}`, l2 };
  }
  if (quedan < falta) {
    return { tono: "pausa", l1: tx("Esta semana ya no llega"),
      l2: previas > 1 ? T`Tus ${previas} semanas se quedan. El domingo empieza otra.`
        : previas === 1 ? tx("La de la semana pasada se queda. El domingo empieza otra.")
          : tx("El domingo empieza otra, desde cero y sin deudas.") };
  }
  if (quedan === falta) {
    return { tono: "alerta", l1: falta === 1 ? tx("Hoy es el último día") : tx("Justo a tiempo"),
      l2: falta === 1 ? T`Un registro hoy y queda ${tx(V.hecho)}.` : T`Quedan ${quedan} días y hacen falta los ${falta}, empezando hoy.` };
  }
  return { tono: "neutro", l1: falta === 1 ? tx("Falta 1 día") : T`Faltan ${falta} días`,
    l2: T`Te quedan ${quedan} días esta semana para ${tx(V.hacer)}.` };
}

/* «13–19 sep»: la semana escrita entera. «13/9» obligaba a adivinar que era
   el domingo con que empieza. */
function rangoDeSemana(ini) {
  const fin = addDaysKey(ini, 6);
  const mes = k => nombreDeMes(Number(k.slice(5, 7)), false).replace(".", "");
  const d1 = Number(ini.slice(8)), d2 = Number(fin.slice(8));
  return ini.slice(5, 7) === fin.slice(5, 7) ? `${d1}–${d2} ${mes(fin)}` : `${d1} ${mes(ini)}–${d2} ${mes(fin)}`;
}

/* =================== El dibujo ===================
   Todo recibe la caja donde cabe (x, y, w, h) y dibuja con las variables de
   la escena, así que un ambiente le cambia el color sin tocar nada. Se dibuja
   al tamaño REAL del hueco (`pintarArteRacha`): un dibujo fijo encogido para
   caber dejaba franjas vacías, y lo paró Eduardo. */

/* Una llama de tres capas, y cada capa tiembla a su ritmo (CSS). Es eso lo
   que la hace parecer fuego y no un dibujo de fuego. */
function llamaRacha(cx, base, alto, clase) {
  const w = alto * 0.62;
  const lengua = (a, h, dx) => `M${r1(dx)} 0C${r1(dx - a * .62)} ${r1(-h * .22)} ${r1(dx - a * .5)} ${r1(-h * .62)} ${r1(dx - a * .08)} ${r1(-h)}C${r1(dx + a * .1)} ${r1(-h * .72)} ${r1(dx + a * .34)} ${r1(-h * .66)} ${r1(dx + a * .36)} ${r1(-h * .46)}C${r1(dx + a * .46)} ${r1(-h * .6)} ${r1(dx + a * .44)} ${r1(-h * .74)} ${r1(dx + a * .4)} ${r1(-h * .84)}C${r1(dx + a * .72)} ${r1(-h * .5)} ${r1(dx + a * .66)} ${r1(-h * .18)} ${r1(dx)} 0Z`;
  return `<g class="fx ${clase || ""}" transform="translate(${r1(cx)} ${r1(base)})">
    <ellipse class="fx-halo" cx="0" cy="${r1(-alto * .35)}" rx="${r1(w * 1.5)}" ry="${r1(alto * .8)}"/>
    <path class="fx-lengua izq" d="${lengua(w * .5, alto * .55, -w * .34)}"/>
    <path class="fx-lengua der" d="${lengua(w * .45, alto * .6, w * .32)}"/>
    <path class="fx-c1" d="${lengua(w, alto, 0)}"/>
    <path class="fx-c2" d="${lengua(w * .68, alto * .72, w * .02)}"/>
    <path class="fx-c3" d="${lengua(w * .36, alto * .4, w * .03)}"/>
  </g>`;
}

function chispasRacha(cx, base, ancho, alto, n) {
  const r = mulberry32(7);
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - .5) * ancho, dx = (r() - .5) * 40;
    s += `<circle class="fx-chispa" cx="${r1(x)}" cy="${r1(base)}" r="${r1(1 + r() * 1.6)}" style="--dx:${r1(dx)}px;--sube:${r1(-alto * (.6 + r() * .4))}px;animation-delay:-${r1(r() * 3)}s;animation-duration:${r1(2 + r() * 1.6)}s"/>`;
  }
  return s;
}

/* Los siete días de esta semana, con su letra. La forma de la pieza es la
   del mundo: un leño, una casilla con palomita o un bloque de píxel. */
function filaDeDias(Z, x, y, w, forma) {
  const L = letrasDeSemana(), paso = w / 7;
  let s = "";
  Z.dias.forEach((d, i) => {
    const cx = x + paso * (i + .5), a = Math.min(paso * .72, 34);
    if (forma === "leno") s += `<rect class="fd-leno ${d.estado}" x="${r1(cx - a / 2)}" y="${r1(y)}" width="${r1(a)}" height="12" rx="6"/>`;
    else if (forma === "pixel") s += `<rect class="fd-pixel ${d.estado}" x="${r1(cx - 8)}" y="${r1(y - 2)}" width="16" height="16"/>`;
    else s += `<rect class="fd-caja ${d.estado}" x="${r1(cx - 9)}" y="${r1(y - 3)}" width="18" height="18" rx="3"/>${d.estado === "si" ? `<path class="fd-palomita" d="M${r1(cx - 4.5)} ${r1(y + 6)}l3 3 6.5-7"/>` : ""}`;
    s += `<text class="rt-rot centro${d.hoy ? " fuerte" : ""}" x="${r1(cx)}" y="${r1(y + 30)}">${L[i]}</text>`;
  });
  return s;
}

/* La fogata. Del tamaño de una fogata y no de un incendio: con la semana
   entera llega a media altura del dibujo, y con un día es una llamita. Y
   centrada en su hueco con su fila de leños: con el fuego pegado abajo
   quedaba medio dibujo de cielo vacío. Las dos cosas las paró Eduardo. */
function heroFogata(x, y, w, h, Z) {
  const maximo = Math.min(h * .46, w * .4, 150);
  const cx = x + w / 2, base = y + Math.max(0, (h - maximo - 70) / 2) + maximo + 6;
  const alto = Z.n ? maximo * (.4 + Z.n * .085) : 0;
  let s = `<ellipse class="fx-suelo" cx="${r1(cx)}" cy="${r1(base + 6)}" rx="${r1(Math.min(w * .42, 150))}" ry="16"/>`;
  s += `<g class="fx-base"><rect x="${r1(cx - 46)}" y="${r1(base - 8)}" width="92" height="13" rx="6.5" transform="rotate(-10 ${r1(cx)} ${r1(base)})"/><rect x="${r1(cx - 46)}" y="${r1(base - 8)}" width="92" height="13" rx="6.5" transform="rotate(10 ${r1(cx)} ${r1(base)})"/></g>`;
  for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8); s += `<ellipse class="fx-piedra" cx="${r1(cx - Math.cos(a) * 64)}" cy="${r1(base + 6 + Math.sin(a) * 4)}" rx="9" ry="6"/>`; }
  if (Z.n) {
    s += `<ellipse class="fx-brasas" cx="${r1(cx)}" cy="${r1(base - 2)}" rx="34" ry="7"/>`;
    s += llamaRacha(cx, base - 2, alto, Z.ok ? "viva" : "");
    // Las chispas no pasan del borde de arriba: encima está el número
    s += chispasRacha(cx, base - alto * .5, 40, Math.min(alto * .9, base - alto * .5 - y - 6), Z.ok ? 9 : 4);
  } else {
    s += `<ellipse class="fx-apagada" cx="${r1(cx)}" cy="${r1(base - 3)}" rx="28" ry="6"/><path class="fx-humo" d="M${r1(cx)} ${r1(base - 8)}c-8-14 8-22 0-38"/>`;
  }
  return s + filaDeDias(Z, x + 10, base + 26, w - 20, "leno");
}

/* Blueprint: una casa en siete trazos, un día por trazo. Con tres cae el
   sello. La cota de abajo es lo que lo hace plano y no dibujo. */
function heroPlano(x, y, w, h, Z) {
  const sx = x + 14, sy = y + 6, sw = w - 28, sh = h - 50;
  let s = `<rect class="pl-hoja" x="${r1(sx)}" y="${r1(sy)}" width="${r1(sw)}" height="${r1(sh)}" rx="4"/>`;
  for (let gx = sx + 16; gx < sx + sw; gx += 16) s += `<path class="pl-reticula" d="M${r1(gx)} ${r1(sy)}v${r1(sh)}"/>`;
  for (let gy = sy + 16; gy < sy + sh; gy += 16) s += `<path class="pl-reticula" d="M${r1(sx)} ${r1(gy)}h${r1(sw)}"/>`;
  const bw = Math.min(sw * .56, 220), bx = sx + (sw - bw) / 2, by = sy + sh - 22;
  const muro = Math.min(sh * .42, 110), techo = by - muro, cima = techo - Math.min(sh * .28, 70), cx = bx + bw / 2;
  const trazos = [
    `M${r1(bx - 10)} ${r1(by)}H${r1(bx + bw + 10)}`, `M${r1(bx)} ${r1(by)}V${r1(techo)}`, `M${r1(bx + bw)} ${r1(by)}V${r1(techo)}`,
    `M${r1(bx - 8)} ${r1(techo + 5)}L${r1(cx)} ${r1(cima)}`, `M${r1(cx)} ${r1(cima)}L${r1(bx + bw + 8)} ${r1(techo + 5)}`,
    `M${r1(cx - 14)} ${r1(by)}V${r1(by - muro * .55)}H${r1(cx + 14)}V${r1(by)}`,
    `M${r1(bx + bw * .14)} ${r1(techo + muro * .22)}h${r1(bw * .2)}v${r1(muro * .28)}h${r1(-bw * .2)}z`
  ];
  trazos.forEach((d, i) => { s += `<path class="pl-trazo ${Z.dias[i].estado}" pathLength="1" d="${d}" style="animation-delay:${i * .12}s"/>`; });
  s += `<path class="pl-cota" d="M${r1(bx)} ${r1(by + 12)}H${r1(bx + bw)}M${r1(bx)} ${r1(by + 8)}v8M${r1(bx + bw)} ${r1(by + 8)}v8"/><text class="rt-rot centro" x="${r1(cx)}" y="${r1(by + 22)}">${Z.n}/7</text>`;
  if (Z.ok) s += `<g class="pl-sello" transform="translate(${r1(sx + sw - 56)} ${r1(sy + 40)}) rotate(-14)"><rect x="-44" y="-15" width="88" height="30" rx="4"/><text x="0" y="5">${escapeHtml(tx("TRAZADA"))}</text></g>`;
  return s + filaDeDias(Z, x + 10, y + h - 34, w - 20, "caja");
}

/* Reliquia: una vitrina con siete peanas; cada día pone una pieza. Con tres
   se enciende su luz. */
function heroVitrina(x, y, w, h, Z) {
  const vw = Math.min(w - 20, 360), vx = x + (w - vw) / 2, vy = y + 10, vh = h - 30;
  const L = letrasDeSemana();
  let s = "";
  if (Z.ok) s += `<path class="rq-luz" d="M${r1(vx + vw * .3)} ${r1(vy + 18)}L${r1(vx + vw * .7)} ${r1(vy + 18)}L${r1(vx + vw - 10)} ${r1(vy + vh - 26)}L${r1(vx + 10)} ${r1(vy + vh - 26)}Z"/>`;
  s += `<path class="rq-vitrina" d="M${r1(vx)} ${r1(vy + vh - 20)}V${r1(vy + 30)}Q${r1(vx)} ${r1(vy)} ${r1(vx + 30)} ${r1(vy)}H${r1(vx + vw - 30)}Q${r1(vx + vw)} ${r1(vy)} ${r1(vx + vw)} ${r1(vy + 30)}V${r1(vy + vh - 20)}"/>`;
  s += `<rect class="rq-zocalo" x="${r1(vx - 8)}" y="${r1(vy + vh - 22)}" width="${r1(vw + 16)}" height="14" rx="3"/>`;
  s += `<path class="rq-reflejo" d="M${r1(vx + vw * .12)} ${r1(vy + 34)}l${r1(vw * .1)} -18M${r1(vx + vw * .16)} ${r1(vy + 44)}l${r1(vw * .06)} -11"/>`;
  const paso = (vw - 20) / 7, py = vy + vh - 22;
  Z.dias.forEach((d, i) => {
    const cx = vx + 10 + paso * (i + .5), ph = 22 + (i % 2) * 8, gy = py - ph - 12, r = Math.min(paso * .28, 11);
    const gema = `M${r1(cx)} ${r1(gy - r)}L${r1(cx + r)} ${r1(gy - r * .2)}L${r1(cx)} ${r1(gy + r)}L${r1(cx - r)} ${r1(gy - r * .2)}Z`;
    s += `<rect class="rq-peana" x="${r1(cx - paso * .32)}" y="${r1(py - ph)}" width="${r1(paso * .64)}" height="${r1(ph)}" rx="2"/>`;
    s += d.estado === "si"
      ? `<g class="rq-gema" style="animation-delay:-${i * .4}s"><path d="${gema}"/><path class="rq-faceta" d="M${r1(cx - r)} ${r1(gy - r * .2)}H${r1(cx + r)}M${r1(cx)} ${r1(gy - r)}V${r1(gy + r)}"/><circle class="rq-brillo" cx="${r1(cx + r * .45)}" cy="${r1(gy - r * .55)}" r="1.6"/></g>`
      : `<path class="rq-hueco ${d.estado}" d="${gema}"/>`;
    s += `<text class="rt-rot centro${d.hoy ? " fuerte" : ""}" x="${r1(cx)}" y="${r1(py + 26)}">${L[i]}</text>`;
  });
  return s;
}

/* Arcade: un sprite de fuego dibujado a mano y su espejo como segundo
   cuadro. Alternar los dos es lo que mueve un fuego de 8 bits; crece con los
   días cambiando el tamaño del píxel, no el dibujo. */
const SPRITE_FUEGO = ["....1.......", "....11...1..", "...111...11.", "..1121..111.", "..11211.121.", ".1122111221.",
  ".11222112221", "112223222221", "112233322211", ".1122333221.", ".1122333221.", "..11223221..", "...112221...", "....1111...."];
function heroPixel(x, y, w, h, Z) {
  const px = Math.max(6, Math.floor(Math.min(w, h - 50) / 22));
  const maxSprite = 14 * Math.max(3, Math.round(Math.min(px, 9) * .82));
  const cx = x + w / 2, base = y + Math.max(0, (h - (maxSprite + px * 2 + 50)) / 2) + maxSprite + px + 4;
  let s = "";
  for (let i = -5; i <= 4; i++) s += `<rect class="ar-lena" x="${r1(cx + i * px)}" y="${r1(base - px)}" width="${px}" height="${px}"/>`;
  for (let i = -3; i <= 2; i++) s += `<rect class="ar-lena os" x="${r1(cx + i * px)}" y="${r1(base)}" width="${px}" height="${px}"/>`;
  if (Z.n) {
    const p = Math.max(3, Math.round(Math.min(px, 9) * (.4 + Z.n * .06)));
    [0, 1].forEach(fr => {
      let g = "";
      SPRITE_FUEGO.forEach((fila, r) => {
        const f = fr ? fila.split("").reverse().join("") : fila;
        for (let c = 0; c < f.length; c++) {
          if (f[c] === ".") continue;
          g += `<rect class="ar-f c${f[c]}" x="${r1(cx + (c - 6) * p)}" y="${r1(base - px - (SPRITE_FUEGO.length - r) * p)}" width="${p}" height="${p}"/>`;
        }
      });
      s += `<g class="ar-cuadro f${fr}">${g}</g>`;
    });
  }
  return s + filaDeDias(Z, x + 10, base + px + 20, w - 20, "pixel");
}

const HEROES_RACHA = { casa: heroFogata, plano: heroPlano, reliquia: heroVitrina, arcade: heroPixel };

/* La marca pequeña de una semana: una ficha con la forma del mundo. */
function fichaDeSemana(t, w, cx, cy, s) {
  const c = `rt-ficha${w.ok ? " si" : ""}`;
  if (t === "plano") return `<rect class="${c}" x="${r1(cx - s)}" y="${r1(cy - s * .8)}" width="${r1(s * 2)}" height="${r1(s * 1.6)}" rx="2"/>`;
  if (t === "reliquia") return `<path class="${c}" d="M${r1(cx)} ${r1(cy - s)}L${r1(cx + s)} ${r1(cy - s * .2)}L${r1(cx)} ${r1(cy + s)}L${r1(cx - s)} ${r1(cy - s * .2)}Z"/>`;
  if (t === "arcade") return `<rect class="${c} px" x="${r1(cx - s)}" y="${r1(cy - s)}" width="${r1(s * 2)}" height="${r1(s * 2)}"/>`;
  return `<circle class="${c}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(s)}"/>`;
}

/* El dibujo entero de la tarjeta: el objeto de la semana arriba y las cuatro
   semanas de antes en una fila abajo, en todas las pantallas. En la tarjeta
   ancha iban en una columna a la derecha y dejaban aire debajo del fuego; y
   eran ocho, dos meses, que en una tarjeta de hoy ya es historia. Lo paró
   Eduardo las dos veces. */
function dibujoDeRacha(W, H, Z, t) {
  const FILA = 78;
  let s = HEROES_RACHA[t](0, 0, W, H - FILA, Z);
  const prev = Z.lista.slice(1, 5).reverse();
  const y0 = H - FILA + 8, paso = Math.min(W / 4, 100), x0 = (W - paso * 4) / 2, r = Math.min(16, paso * .22);
  s += `<path class="rt-carril" d="M${r1(x0 + paso / 2)} ${r1(y0 + 24)}H${r1(x0 + paso * 3.5)}"/>`;
  s += `<text class="rt-rot centro" x="${r1(W / 2)}" y="${r1(y0 - 2)}">${escapeHtml(tx("Semanas de antes"))}</text>`;
  prev.forEach((w, i) => {
    const cx = x0 + paso * (i + .5), cy = y0 + 24;
    s += fichaDeSemana(t, w, cx, cy, r);
    s += `<text class="rt-rot centro${w.ok ? " oscuro" : ""}" x="${r1(cx)}" y="${r1(cy + 4)}">${w.n}</text>`;
    s += `<text class="rt-rot centro tenue" x="${r1(cx)}" y="${r1(cy + r + 14)}">${rangoDeSemana(w.ini)}</text>`;
  });
  return s;
}

/* ---- La tarjeta del Resumen ----
   El cuerpo se escribe aquí y el dibujo se pinta DESPUÉS, en
   `pintarArteRacha`, porque se dibuja al tamaño del hueco y el hueco no
   existe hasta que la tarjeta está en la página. */
function cuerpoRacha() {
  const hoy = todayKey(), t = temaRacha();
  const Z = semanasDeRacha(activityDayCounts(), hoy), V = VOZ_RACHA[t], M = mensajeRacha(Z, t);
  const lbl = escapeHtml(tx(Z.seguidas === 1 ? V.una : V.varias)).replace(" ", "<br>");
  return `
    <div class="scene-card streak-card rt-card" role="button" tabindex="0"
      aria-label="${escapeAttr(T`${Z.seguidas} ${tx(Z.seguidas === 1 ? V.una : V.varias)}. ${M.l1}. Toca para ver tu calendario`)}"
      onclick="tocarTarjetaRacha(event)" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tocarTarjetaRacha(); }">
      ${scene(820, 230, 11)}
      <div class="scene-fade"></div>
      <div class="scene-body">
        <div class="rt t-${t}">
          <div class="rt-cab">
            <div class="rt-cifra">
              <span class="flame ic${Z.seguidas > 0 ? " viva" : ""}"><svg viewBox="0 0 24 24">${ICONS.flame}</svg></span>
              <span class="rt-num">${Z.seguidas}</span><span class="rt-lbl">${lbl}</span>
            </div>
            <div class="rt-msg ${M.tono}"><b>${escapeHtml(M.l1)}</b><span>${escapeHtml(M.l2)}</span></div>
          </div>
          <div class="rt-arte" data-tema="${t}"></div>
          <p class="rt-pie">${escapeHtml(tx("Toca la tarjeta para ver tu calendario"))}</p>
        </div>
      </div>
    </div>`;
}

function pintarArteRacha() {
  const arte = document.querySelector('#summary-content .widget[data-w="racha"] .rt-arte');
  if (!arte) return;
  const caja = arte.getBoundingClientRect();
  if (!caja.width) return;
  const W = Math.round(caja.width), H = Math.round(caja.height) || 270;
  const t = arte.dataset.tema || "casa";
  const Z = semanasDeRacha(activityDayCounts(), todayKey());
  arte.innerHTML = `<svg class="rt-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${dibujoDeRacha(W, H, Z, t)}</svg>`;
}
let _redimRacha = null;
window.addEventListener("resize", () => { clearTimeout(_redimRacha); _redimRacha = setTimeout(pintarArteRacha, 150); });

/* ---- Un toque, no un deslizamiento (0.7.135.1) ----
   La tarjeta ocupa media pantalla del teléfono, así que es justo donde cae el
   dedo al deslizar el Resumen. Un navegador suele cancelar el clic cuando el
   dedo se movió, pero no siempre, y un deslizamiento corto abría «Tu racha»
   sin querer. Lo pidió Eduardo: solo cuenta como toque si el dedo se movió
   menos de 10 px y se levantó en menos de 700 ms. Vale también para la tira
   de meses, que se desliza de lado, y para el velo que cierra la hoja.
   Un clic de teclado (`detail === 0`) no tiene dedo y siempre cuenta. */
let _toqueRacha = null;
document.addEventListener("pointerdown", e => { _toqueRacha = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
function toqueLimpio(e) {
  if (!e || e.detail === 0 || !_toqueRacha) return true;
  return Math.hypot(e.clientX - _toqueRacha.x, e.clientY - _toqueRacha.y) < 10 && Date.now() - _toqueRacha.t < 700;
}

/* Mientras se acomoda el tablero, tocar una tarjeta es para moverla. */
function tocarTarjetaRacha(e) {
  if (typeof dashEditing !== "undefined" && dashEditing) return;
  if (!toqueLimpio(e)) return;
  abrirTuRacha();
}

/* =================== «Tu racha» ===================
   La forma sale de la casa, no de otra app —la primera versión calcaba el
   panel de racha de Duolingo y Eduardo lo paró—:

   1. **Arriba, una escena**: el objeto de la tarjeta con esta semana dentro
      y el número encima. Se reconoce como la misma cosa, más grande.
   2. **La semana encendida es un HILO** que une sus días con algo, como las
      estrellas de las constelaciones de los rangos, y lleva la marca del
      mundo al final de su fila, en su propia columna.
   3. **Los meses se recorren con una tira** de los últimos seis, cada uno con
      un punto por semana encendida; las flechas van hasta un año atrás.

   Dos columnas en la computadora; en el teléfono se apila y sube desde abajo,
   con la X en su propia barra y el fondo quieto: solo se desplaza la hoja. */
let rachaMesVisto = null;

function mejorRachaDeSemanas(m, hoy) {
  const ini = addDaysKey(hoy, -weekdayOfKey(hoy));
  let mejor = 0, run = 0, total = 0;
  for (let w = 52; w >= 0; w--) {
    const i0 = addDaysKey(ini, -7 * w);
    let n = 0;
    for (let d = 0; d < 7; d++) if (actividadEn(m, addDaysKey(i0, d))) n++;
    const ok = n >= UMBRAL_SEMANA;
    if (ok) total++;
    run = ok ? run + 1 : 0;
    mejor = Math.max(mejor, run);
  }
  return { mejor, total };
}

function marcaDelMundo(t) {
  return { plano: '<path d="M5 12.5l4 4 10-10"/>', reliquia: '<path d="M12 3l7 6-7 12-7-12z"/>' }[t] || ICONS.flame;
}

function semanasDelMes(m, hoy, anio, mes) {
  const mm = String(mes).padStart(2, "0");
  const primero = anio + "-" + mm + "-01";
  const total = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const ultimo = anio + "-" + mm + "-" + String(total).padStart(2, "0");
  const out = [];
  for (let k = addDaysKey(primero, -weekdayOfKey(primero)); k <= ultimo; k = addDaysKey(k, 7)) {
    const dias = [];
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDaysKey(k, i), on = d <= hoy && actividadEn(m, d);
      if (on) n++;
      dias.push({ d, on, dentro: d.slice(5, 7) === mm, futuro: d > hoy, hoy: d === hoy });
    }
    out.push({ ini: k, dias, n, ok: n >= UMBRAL_SEMANA, futura: k > hoy });
  }
  return out;
}

function nombreDeMesCapital(anio, mes, largo) {
  const s = new Date(Date.UTC(anio, mes - 1, 1)).toLocaleDateString(localeActual(), { month: largo ? "long" : "short", timeZone: "UTC" }).replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pintarMesRacha() {
  const caja = document.querySelector("#racha-hoja .rb-mes");
  if (!caja) return;
  const m = activityDayCounts(), hoy = todayKey(), t = temaRacha(), V = VOZ_RACHA[t];
  const [y, mo] = rachaMesVisto;
  const [hy, hm] = hoy.split("-").map(Number);
  const indice = (a, b) => a * 12 + b;
  const actual = indice(hy, hm), visto = indice(y, mo), limite = actual - 12;

  // La tira: seis meses que terminan en el de ahora, o un poco después del que se ve si es más viejo
  const fin = visto >= actual - 5 ? actual : visto + 2;
  let tira = "";
  for (let i = fin - 5; i <= fin; i++) {
    if (i < limite) continue;
    const a = Math.floor((i - 1) / 12), b = i - a * 12;
    const n = semanasDelMes(m, hoy, a, b).filter(s => s.ok && s.ini.slice(5, 7) === String(b).padStart(2, "0")).length;
    tira += `<button class="rb-chip${i === visto ? " on" : ""}" onclick="irAMesDeRacha(${a}, ${b}, event)" aria-pressed="${i === visto}">
      <b>${nombreDeMesCapital(a, b)}</b><span aria-hidden="true">${"<i></i>".repeat(n) || "<em>·</em>"}</span></button>`;
  }

  let dias = 0, encendidas = 0;
  const filas = semanasDelMes(m, hoy, y, mo).map(s => {
    if (s.ok) encendidas++;
    const activos = s.dias.map((x, i) => x.on && x.dentro ? i : -1).filter(i => i >= 0);
    const hilo = s.ok && activos.length > 1 ? `<span class="rb-hilo" style="--a:${activos[0]};--b:${activos[activos.length - 1]}"></span>` : "";
    const celdas = s.dias.map(x => {
      if (!x.dentro) return `<span class="rb-d fuera"></span>`;
      if (x.on) dias++;
      const cls = ["rb-d"];
      if (x.futuro) cls.push("futuro");
      if (x.on) cls.push(s.ok ? "si fuerte" : "si");
      if (x.hoy) cls.push("hoy");
      return `<span class="${cls.join(" ")}">${Number(x.d.slice(8))}</span>`;
    }).join("");
    const marca = s.futura ? `<span class="rb-marca"></span>`
      : s.ok ? `<span class="rb-marca si" title="${escapeAttr(T`Semana ${tx(V.hecho)}`)}"><svg viewBox="0 0 24 24">${marcaDelMundo(t)}</svg></span>`
        : `<span class="rb-marca" title="${escapeAttr(T`${s.n} de ${UMBRAL_SEMANA} días`)}">${s.n}/${UMBRAL_SEMANA}</span>`;
    return `<div class="rb-fila">${hilo}${celdas}${marca}</div>`;
  }).join("");

  caja.innerHTML = `
    <div class="rb-mes-cab">
      <div><span class="rb-rot">${y !== hy ? y : escapeHtml(tx("Este año"))}</span><b>${escapeHtml(nombreDeMesCapital(y, mo, true))}</b></div>
      <div class="rb-flechas">
        <button onclick="moverMesDeRacha(-1)" ${visto <= limite ? "disabled" : ""} aria-label="${escapeAttr(tx("Mes anterior"))}"><svg viewBox="0 0 24 24"><path d="M14.5 6l-6 6 6 6"/></svg></button>
        <button onclick="moverMesDeRacha(1)" ${visto >= actual ? "disabled" : ""} aria-label="${escapeAttr(tx("Mes siguiente"))}"><svg viewBox="0 0 24 24"><path d="M9.5 6l6 6-6 6"/></svg></button>
      </div>
    </div>
    <div class="rb-tira">${tira}</div>
    <div class="rb-rej">
      <div class="rb-fila rb-letras">${letrasDeSemana().map(l => `<span>${l}</span>`).join("")}<span></span></div>
      ${filas}
    </div>
    <p class="rb-pie"><b>${dias}</b> ${escapeHtml(dias === 1 ? tx("día con algo") : tx("días con algo"))} · <b>${encendidas}</b> ${escapeHtml(tx(encendidas === 1 ? V.una : V.varias))}</p>`;
}

function moverMesDeRacha(d) {
  let [y, mo] = rachaMesVisto;
  mo += d;
  if (mo < 1) { mo = 12; y--; }
  if (mo > 12) { mo = 1; y++; }
  rachaMesVisto = [y, mo];
  pintarMesRacha();
}
function irAMesDeRacha(y, mo, e) { if (!toqueLimpio(e)) return; rachaMesVisto = [y, mo]; pintarMesRacha(); }

function abrirTuRacha() {
  cerrarTuRacha();
  const m = activityDayCounts(), hoy = todayKey(), t = temaRacha();
  const Z = semanasDeRacha(m, hoy), V = VOZ_RACHA[t], M = mensajeRacha(Z, t);
  const L = mejorRachaDeSemanas(m, hoy);
  rachaMesVisto = hoy.split("-").slice(0, 2).map(Number);
  const accion = M.tono === "neutro" || M.tono === "alerta"
    ? ` <button class="rb-accion" onclick="cerrarTuRacha(); showView('missions')">${escapeHtml(tx("Ir a mis misiones"))} →</button>` : "";
  const capa = document.createElement("div");
  capa.id = "racha-hoja";
  capa.innerHTML = `
    <div class="rb t-${t}" role="dialog" aria-modal="true" aria-labelledby="rb-titulo">
      <div class="rb-barra">
        <b id="rb-titulo">${escapeHtml(tx("Tu racha"))}</b>
        <button class="rb-cerrar" onclick="cerrarTuRacha()" aria-label="${escapeAttr(tx("Cerrar"))}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <section class="rb-izq">
        <div class="scene-card rb-escena">
          ${scene(820, 360, 11)}
          <div class="scene-fade"></div>
          <div class="rb-escena-cab">
            <div class="rb-cifra"><b>${Z.seguidas}</b><span>${escapeHtml(tx(Z.seguidas === 1 ? V.una : V.varias)).replace(" ", "<br>")}</span></div>
          </div>
          <svg class="rb-escena-arte rt t-${t}" viewBox="0 0 360 190" aria-hidden="true">${HEROES_RACHA[t](0, 0, 360, 190, Z)}</svg>
        </div>
        <p class="rb-nota ${M.tono}"><b>${escapeHtml(M.l1)}.</b> ${escapeHtml(M.l2)}${accion}</p>
        <div class="rb-cifras">
          <div><b>${L.mejor}</b><span>${escapeHtml(tx("tu mejor racha"))}</span></div>
          <div><b>${L.total}</b><span>${escapeHtml(L.total === 1 ? tx("semana en el año") : tx("semanas en el año"))}</span></div>
          <div><b>${Z.n}<small>/7</small></b><span>${escapeHtml(tx("días esta semana"))}</span></div>
        </div>
      </section>
      <section class="rb-der">
        <div class="rb-mes"></div>
        <p class="rb-ley"><span class="rb-ley-hilo"></span>${escapeHtml(T`Semana ${tx(V.hecho)}: ${UMBRAL_SEMANA} días con algo o más`)}</p>
      </section>
    </div>`;
  capa.addEventListener("click", e => { if (e.target === capa && toqueLimpio(e)) cerrarTuRacha(); });
  document.body.appendChild(capa);
  pintarMesRacha();
  /* `.show` en el turno siguiente, para que la entrada se anime; y con ella
     entra en CAPAS_QUE_TAPAN y la página de detrás se queda quieta. */
  setTimeout(() => capa.classList.add("show"), 0);
  const cerrar = capa.querySelector(".rb-cerrar");
  if (cerrar) cerrar.focus({ preventScroll: true });
}

function cerrarTuRacha() {
  document.querySelectorAll("#racha-hoja").forEach(e => e.remove());
  if (typeof revisarFondoQuieto === "function") revisarFondoQuieto();
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.getElementById("racha-hoja")) { e.preventDefault(); cerrarTuRacha(); }
});
