# -*- coding: utf-8 -*-
"""La lámina del conjunto: los ocho ambientes, los catorce mundos, el motor,
la pantalla de Apariencia, la tiendita, el nivel de expedición y los rangos,
todo en una página. Sale de `datos.py` y de `../mundos/datos.py`, así que no
puede decir algo distinto de lo que hay escrito en el repositorio."""
import datos, os, sys, html
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, "..", "mundos"))
import importlib.util
_e = importlib.util.spec_from_file_location("mdatos", os.path.join(AQUI, "..", "mundos", "datos.py"))
mdatos = importlib.util.module_from_spec(_e); _e.loader.exec_module(mdatos)

def esc(t): return html.escape(str(t))

def vars_de(m, dia):
    base = dict(datos.CASA_DIA if dia else datos.CASA_NOCHE)
    base.update(m["dia"] if dia else m["noche"])
    return ";".join(f"{k}:{v}" for k, v in base.items())

def mini(m, dia, texto="Regar las plantas", pie="Constancia · nivel 4"):
    """La misma pieza siempre: aro, icono, título, barra, tres pastillas y una
       cifra. Se comparan ambientes, no maquetas distintas."""
    return f'''<div class="mini" style="{vars_de(m, dia)}">
  <div class="mini-cab"><span class="mini-luz">{"Día" if dia else "Noche"}</span></div>
  <div class="mini-ficha">
    <span class="mini-aro"></span>
    <span class="mini-ic"></span>
    <span class="mini-med">
      <span class="mini-nom">{esc(texto)}</span>
      <span class="mini-barra"><i></i></span>
      <span class="mini-pie">{esc(pie)}</span>
    </span>
  </div>
  <div class="mini-tira">
    <span class="mini-chip ok">Hecho</span>
    <span class="mini-chip av">Vence hoy</span>
    <span class="mini-chip no">Perdida</span>
    <span class="mini-xp">1 840<em>XP</em></span>
  </div>
</div>'''

GRADO = {0: "de casa", 1: "grado 1 · solo el suelo", 2: "grado 2 · suelo y acento",
         3: "grado 3 · además invierte algo"}

def ficha_ambiente(m):
    nota = f'<p class="nota"><b>Lo que costó llegar aquí.</b> {esc(m["nota"])}</p>' if m.get("nota") else ""
    c = datos.CONTRASTES.get(m["id"])
    med = (f'<span class="dato">escribir <b>{str(c[1]).replace(".",",")}</b></span>'
           f'<span class="dato">trazar <b>{str(c[2]).replace(".",",")}</b></span>') if c else ""
    pago = ' <span class="etiq pro">Pro</span>' if "Pro" in m["abre"] else (
           ' <span class="etiq fund">Fundador</span>' if "Fundador" in m["abre"] else '')
    return f'''<article class="amb" id="amb-{m["id"]}">
  <div class="amb-txt">
    <h3>{esc(m["nombre"])}{pago}</h3>
    <p class="amb-meta"><span class="llave">{esc(m["abre"])}</span> <span class="gr">{GRADO[m["grado"]]}</span></p>
    <p>{esc(m["premisa"])}</p>
    {nota}
    <p class="medidas">{med}</p>
  </div>
  <div class="amb-par">{mini(m, False)}{mini(m, True)}</div>
</article>'''

def rango_svg(d, tam=40):
    return (f'<svg class="rg" width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')

def pagina():
    ambientes = "\n".join(ficha_ambiente(m) for m in datos.AMBIENTES)

    filas_c = "\n".join(
        f'<tr><th scope="row">{esc(m["nombre"])}</th>' +
        "".join(f"<td>{str(v).replace('.', ',')}</td>" for v in datos.CONTRASTES[m["id"]]) + "</tr>"
        for m in datos.AMBIENTES if m["id"] in datos.CONTRASTES)

    mundos = "\n".join(
        f'<li class="mu"><span class="mu-p" style="background:{w["color"]}"></span>'
        f'<b>{esc(w["nombre"])}</b><span class="mu-l">{esc(w["llave"])}</span>'
        f'<span class="mu-k">{esc(w["peso"])}</span></li>' for w in mdatos.MUNDOS)

    ICO = {"rango":"◆", "ambiente":"●", "celebracion":"✦"}
    def peldano(n, que, tipo, nota):
        clases = " ".join("t-" + t for t in tipo.split("+"))
        marcas = "".join(f'<span class="pt m-{t}">{ICO[t]}</span>' for t in tipo.split("+"))
        pro = '<span class="etiq pro">Pro</span>' if nota == "Pro" else (
              f'<span class="pel-nota">{esc(nota)}</span>' if nota else "")
        dia1 = n == "dia1"
        etiqueta = "día 1" if dia1 else n
        return (f'<li class="pel {clases}"><span class="pel-n{" dia" if dia1 else ""}">{etiqueta}</span>'
                f'<span class="pel-m">{marcas}</span>'
                f'<span class="pel-q">{esc(que)} {pro}</span></li>')
    escalera = "\n".join(peldano(*p) for p in datos.ESCALERA)

    nom_amb = {m["id"]: m["nombre"] for m in datos.AMBIENTES}
    rangos = "\n".join(
        f'<li class="rango">'
        f'<span class="rango-ic" style="--n:{r["color"][0]};--d:{r["color"][1]}">{rango_svg(r["trazo"])}</span>'
        f'<span class="rango-n">Nivel {r["nivel"]}</span>'
        f'<b>{esc(r["nombre"])}</b>'
        f'<span class="rango-par">abre <b>{esc(nom_amb[r["ambiente"]])}</b>'
        + ('<span class="etiq pro">Pro</span>' if r.get("plan") == "Pro" else '') +
        f'<span class="par-t" style="background:{r["color"][0]}"></span>'
        f'<span class="par-t" style="background:{r["color"][1]}"></span></span>'
        f'<span class="rango-c">{esc(r["cuando"])}</span>'
        f'<span class="rango-q">{esc(r["que"])}</span></li>' for r in datos.RANGOS)

    caidas = "\n".join(
        f'<li class="caida">{rango_svg(d, 26)}<span><b>{esc(n)}</b> · {esc(por)}</span></li>'
        for n, por, d in datos.CAIDAS)

    puntos = "\n".join(
        f'<tr><th scope="row">{esc(a)}</th><td class="num">{b}</td><td>{esc(c)}</td></tr>'
        for a, b, c in datos.PUNTOS)

    curva = "\n".join(
        "<tr><th scope=\"row\">" + esc(f[0]) + "</th>" +
        "".join(f"<td class='num'>{v}</td>" for v in f[1:]) + "</tr>" for f in datos.CURVA)
    curva_cab = "".join(f"<th>{esc(c)}</th>" for c in datos.CURVA_COLS)

    return f"""<title>Apariencias de Norata</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
/* ============================================================
   El marco es a propósito CALLADO. Dentro van dieciséis
   especímenes de color, cada uno gritando lo suyo, y una página
   con carácter propio competiría con ellos. Todo lo que se ve
   del marco es gris con sesgo azul —el de Norata—; el color
   vive dentro de las muestras.
   ============================================================ */
:root{{
  color-scheme: light dark;
  --suelo:#ebedf4; --suelo-2:#e3e6ef; --sup:#f8f8fc; --sup-alta:#fefeff;
  --hilo:rgba(22,30,43,.13); --hilo-2:rgba(22,30,43,.26);
  --tinta:#141c28; --tinta-2:#4a5665; --tinta-3:#78828f;
  --marca:#007046; --marca-viva:#00cc7f; --aviso:#755c05; --alto:#bd2200;
  --lila:#5e46a8;
  --disp:"Archivo",-apple-system,"Segoe UI",system-ui,sans-serif;
  --sans:"Outfit",-apple-system,"Segoe UI",system-ui,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,monospace;
  --paso:clamp(2.4rem,5vw,4rem);
}}
@media (prefers-color-scheme: dark){{
  :root:not([data-theme="light"]){{
    --suelo:#0b0f16; --suelo-2:#080c11; --sup:#141a23; --sup-alta:#1b222d;
    --hilo:rgba(233,239,242,.11); --hilo-2:rgba(233,239,242,.24);
    --tinta:#e7edf1; --tinta-2:#9ba7b5; --tinta-3:#6c7786;
    --marca:#5fe0b0; --marca-viva:#5fe0b0; --aviso:#f5d76e; --alto:#ff8a70;
    --lila:#b7a2ea;
  }}
}}
:root[data-theme="dark"]{{
  --suelo:#0b0f16; --suelo-2:#080c11; --sup:#141a23; --sup-alta:#1b222d;
  --hilo:rgba(233,239,242,.11); --hilo-2:rgba(233,239,242,.24);
  --tinta:#e7edf1; --tinta-2:#9ba7b5; --tinta-3:#6c7786;
  --marca:#5fe0b0; --marca-viva:#5fe0b0; --aviso:#f5d76e; --alto:#ff8a70;
  --lila:#b7a2ea;
}}
*{{box-sizing:border-box}}
body{{
  margin:0; background:var(--suelo); color:var(--tinta);
  font-family:var(--sans); font-size:17px; line-height:1.62; font-weight:400;
  -webkit-font-smoothing:antialiased;
}}
.wrap{{max-width:1080px; margin:0 auto; padding:0 22px 120px}}
p{{margin:0; max-width:68ch}}
h1,h2,h3{{font-family:var(--disp); margin:0; text-wrap:balance; letter-spacing:-.02em}}
h1{{font-size:clamp(2.5rem,7vw,4.2rem); font-weight:800; line-height:.98; letter-spacing:-.038em}}
h2{{font-size:clamp(1.5rem,3.2vw,2.1rem); font-weight:700; line-height:1.1}}
h3{{font-size:1.12rem; font-weight:700; letter-spacing:-.01em}}
a{{color:var(--marca)}}
strong,b{{font-weight:600}}
code{{font-family:var(--mono); font-size:.86em; background:var(--sup-alta);
  border:1px solid var(--hilo); border-radius:5px; padding:1px 5px}}

/* --- portada --- */
header.tapa{{padding:clamp(4rem,11vw,7.5rem) 0 var(--paso); border-bottom:1px solid var(--hilo)}}
.ojo{{font-family:var(--mono); font-size:.68rem; letter-spacing:.2em; text-transform:uppercase;
  color:var(--tinta-3); margin-bottom:1.5rem}}
.entrada{{font-size:1.2rem; color:var(--tinta-2); font-weight:300; max-width:56ch; margin-top:1.5rem}}
.cifras{{display:flex; flex-wrap:wrap; gap:2.4rem; margin-top:2.6rem;
  border-top:1px solid var(--hilo); padding-top:1.6rem}}
.cifra b{{display:block; font-family:var(--disp); font-size:2.1rem; font-weight:800;
  line-height:1; letter-spacing:-.03em; font-variant-numeric:tabular-nums}}
.cifra span{{font-family:var(--mono); font-size:.68rem; letter-spacing:.14em;
  text-transform:uppercase; color:var(--tinta-3)}}

/* --- secciones --- */
section{{padding-top:var(--paso)}}
.rotulo{{font-family:var(--mono); font-size:.68rem; letter-spacing:.2em;
  text-transform:uppercase; color:var(--marca); margin-bottom:.7rem}}
.sub{{color:var(--tinta-2); margin-top:.9rem}}
.bloque{{margin-top:1.6rem}}

/* --- el índice --- */
.indice{{display:flex; flex-wrap:wrap; gap:.5rem; margin-top:2.2rem}}
.indice a{{font-family:var(--mono); font-size:.72rem; letter-spacing:.04em;
  text-decoration:none; color:var(--tinta-2); border:1px solid var(--hilo);
  border-radius:99px; padding:.34rem .8rem; background:var(--sup)}}
.indice a:hover,.indice a:focus-visible{{color:var(--marca); border-color:var(--marca)}}

/* --- especímenes --- */
.amb{{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.05fr); gap:2rem;
  padding:2rem 0; border-top:1px solid var(--hilo); align-items:start}}
@media (max-width:820px){{.amb{{grid-template-columns:1fr}}}}
.amb-meta{{display:flex; flex-wrap:wrap; gap:.5rem; margin:.55rem 0 .8rem}}
.llave,.gr{{font-family:var(--mono); font-size:.66rem; letter-spacing:.1em;
  text-transform:uppercase; padding:.2rem .55rem; border-radius:99px; border:1px solid var(--hilo-2)}}
.llave{{color:var(--tinta)}}
.gr{{color:var(--tinta-3)}}
.etiq{{font-family:var(--mono); font-size:.6rem; letter-spacing:.12em; text-transform:uppercase;
  padding:.15rem .45rem; border-radius:4px; vertical-align:middle; margin-left:.4rem}}
.etiq.pro{{background:var(--aviso); color:var(--suelo)}}
.etiq.fund{{background:var(--lila); color:var(--suelo)}}
.nota{{margin-top:.9rem; font-size:.95rem; color:var(--tinta-2);
  border-left:2px solid var(--hilo-2); padding-left:.9rem}}
.medidas{{display:flex; gap:1rem; margin-top:1rem}}
.dato{{font-family:var(--mono); font-size:.7rem; letter-spacing:.06em; color:var(--tinta-3)}}
.dato b{{color:var(--tinta); font-variant-numeric:tabular-nums}}
.amb-par{{display:grid; grid-template-columns:1fr 1fr; gap:.9rem}}
@media (max-width:460px){{.amb-par{{grid-template-columns:1fr}}}}

/* --- la pieza en pequeño: la misma siempre --- */
.mini{{background:var(--bg); border:1px solid var(--line); border-radius:12px;
  padding:11px 12px 12px; display:flex; flex-direction:column; gap:9px; overflow:hidden}}
.mini-luz{{font-family:var(--mono); font-size:.6rem; letter-spacing:.14em;
  text-transform:uppercase; color:var(--faint)}}
.mini-ficha{{background:var(--card); border:1px solid var(--line); border-radius:10px;
  padding:9px 10px; display:flex; align-items:center; gap:9px}}
.mini-aro{{width:26px; height:26px; border-radius:999px; flex:none;
  border:2px solid var(--aro-alto)}}
.mini-ic{{width:20px; height:20px; border-radius:6px; flex:none; background:var(--mint-macizo)}}
.mini-med{{flex:1; min-width:0; display:flex; flex-direction:column; gap:5px}}
.mini-nom{{font-size:12.5px; font-weight:600; color:var(--text); line-height:1.15;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis}}
.mini-barra{{height:5px; border-radius:99px; background:var(--carril); overflow:hidden}}
.mini-barra i{{display:block; height:100%; width:68%; border-radius:99px; background:var(--mint-macizo)}}
.mini-pie{{font-size:10px; color:var(--muted)}}
.mini-tira{{display:flex; align-items:center; gap:5px; flex-wrap:wrap}}
.mini-chip{{font-size:9.5px; font-weight:600; padding:2.5px 7px; border-radius:99px; line-height:1.3}}
.mini-chip.ok{{color:var(--mint); background:color-mix(in srgb, var(--mint) 14%, transparent)}}
.mini-chip.av{{color:var(--fire); background:color-mix(in srgb, var(--fire) 14%, transparent)}}
.mini-chip.no{{color:var(--coral); background:color-mix(in srgb, var(--coral) 14%, transparent)}}
.mini-xp{{margin-left:auto; font-size:13px; font-weight:700; color:var(--mint);
  font-variant-numeric:tabular-nums}}
.mini-xp em{{font-style:normal; font-size:8.5px; color:var(--faint); margin-left:3px;
  letter-spacing:.1em}}

/* --- tablas --- */
.tabla{{overflow-x:auto; margin-top:1.4rem; border:1px solid var(--hilo);
  border-radius:12px; background:var(--sup)}}
table{{border-collapse:collapse; width:100%; font-size:.9rem}}
th,td{{text-align:left; padding:.6rem .85rem; border-bottom:1px solid var(--hilo); white-space:nowrap}}
thead th{{font-family:var(--mono); font-size:.64rem; letter-spacing:.12em; text-transform:uppercase;
  color:var(--tinta-3); font-weight:500}}
tbody th{{font-weight:600}}
td.num{{font-variant-numeric:tabular-nums; text-align:right}}
tbody tr:last-child th,tbody tr:last-child td{{border-bottom:0}}
td:not(.num),th:not(.num){{font-variant-numeric:tabular-nums}}
table.ancha td:last-child{{white-space:normal; min-width:22rem; color:var(--tinta-2)}}

/* --- mundos --- */
.mundos{{list-style:none; padding:0; margin:1.4rem 0 0; display:grid;
  grid-template-columns:repeat(auto-fill,minmax(232px,1fr)); gap:.5rem}}
.mu{{display:flex; align-items:center; gap:.6rem; background:var(--sup);
  border:1px solid var(--hilo); border-radius:9px; padding:.5rem .7rem; font-size:.88rem}}
.mu-p{{width:11px; height:11px; border-radius:3px; flex:none}}
.mu-l{{color:var(--tinta-3); font-size:.76rem}}
.mu-k{{margin-left:auto; font-family:var(--mono); font-size:.68rem; color:var(--tinta-3)}}

/* --- escalera --- */
.escalera{{list-style:none; padding:0; margin:1.4rem 0 0; border-left:2px solid var(--hilo);
  display:flex; flex-direction:column}}
.pel{{display:flex; align-items:baseline; gap:.8rem; padding:.55rem 0 .55rem 1.2rem;
  position:relative}}
.pel-n{{font-family:var(--disp); font-weight:800; font-size:1.05rem; min-width:3.1rem;
  font-variant-numeric:tabular-nums; letter-spacing:-.02em}}
.pel-m{{display:flex; gap:.2rem; min-width:2.6rem}}
.pt{{font-size:.72rem; line-height:1.6}}
.pt.m-rango{{color:var(--tinta-2)}} .pt.m-ambiente{{color:var(--marca)}}
.pt.m-celebracion{{color:var(--aviso)}}
.pel-q{{color:var(--tinta-2); font-size:.95rem}}
.pel-q b{{color:var(--tinta)}}
.pel-nota{{font-size:.8rem; color:var(--tinta-3); font-style:italic}}
.pel-n.dia{{font-family:var(--mono); font-size:.68rem; font-weight:500; letter-spacing:.06em;
  color:var(--tinta-3); text-transform:uppercase}}
.corte{{display:flex; align-items:center; gap:.8rem; margin:.9rem 0 .3rem 1.2rem;
  font-family:var(--mono); font-size:.68rem; letter-spacing:.1em; text-transform:uppercase;
  color:var(--aviso)}}
.corte::after{{content:""; flex:1; height:1px; background:var(--hilo)}}

/* --- rangos --- */
.rangos{{list-style:none; padding:0; margin:1.4rem 0 0; display:flex;
  flex-direction:column; gap:.5rem}}
.rango{{display:grid; grid-template-columns:auto 5.2rem 6rem 13rem 8rem minmax(0,1fr);
  align-items:center; gap:1rem; background:var(--sup); border:1px solid var(--hilo);
  border-radius:11px; padding:.7rem 1rem}}
@media (max-width:760px){{.rango{{grid-template-columns:auto 1fr; gap:.4rem 1rem}}
  .rango-q{{grid-column:1/-1}} }}
.rango-ic{{color:var(--d); display:flex}}   /* dos caras, como todo lo demás:
   el tono de noche sobre papel da 2,35 y el de día sobre carbón 3,15. Por eso
   cada rango lleva su par y no un color único. */
@media (prefers-color-scheme: dark){{ :root:not([data-theme="light"]) .rango-ic{{color:var(--n)}} }}
:root[data-theme="dark"] .rango-ic{{color:var(--n)}}
.rango-n{{font-family:var(--mono); font-size:.72rem; color:var(--tinta-3);
  font-variant-numeric:tabular-nums}}
.rango b{{font-family:var(--disp); font-size:1.05rem; font-weight:700}}
.rango-c{{font-size:.82rem; color:var(--tinta-3)}}
.rango-par{{font-size:.82rem; color:var(--tinta-3); display:flex; align-items:center; gap:.3rem}}
.rango-par b{{font-family:var(--sans); font-size:.85rem; font-weight:600; color:var(--tinta-2)}}
.par-t{{width:11px; height:11px; border-radius:3px; border:1px solid var(--hilo-2)}}
.rango-q{{font-size:.88rem; color:var(--tinta-2)}}
.caidas{{list-style:none; padding:0; margin:1.2rem 0 0; display:flex;
  flex-wrap:wrap; gap:.5rem 1.6rem}}
.caida{{display:flex; align-items:center; gap:.55rem; font-size:.85rem; color:var(--tinta-3)}}
.caida svg{{color:var(--tinta-3); opacity:.65}}
.caida b{{color:var(--tinta-2)}}

/* --- aviso fuerte --- */
.choque{{margin-top:1.6rem; background:var(--sup); border:1px solid var(--aviso);
  border-left-width:4px; border-radius:12px; padding:1.3rem 1.5rem}}
.choque h3{{color:var(--aviso)}}
.choque .frente{{display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin:1.1rem 0}}
@media (max-width:620px){{.choque .frente{{grid-template-columns:1fr}}}}
.lado{{background:var(--sup-alta); border:1px solid var(--hilo); border-radius:9px; padding:.85rem 1rem}}
.lado .de{{font-family:var(--mono); font-size:.64rem; letter-spacing:.11em;
  text-transform:uppercase; color:var(--tinta-3); display:block; margin-bottom:.35rem}}
.lado p{{font-size:.9rem}}

/* --- maqueta de la pantalla --- */
.maqueta{{background:var(--sup); border:1px solid var(--hilo); border-radius:16px;
  padding:1.2rem; max-width:420px; margin-top:1.4rem}}
.mq-t{{font-family:var(--disp); font-weight:700; font-size:1.15rem; margin-bottom:.15rem}}
.mq-s{{font-size:.8rem; color:var(--tinta-3); margin-bottom:1rem}}
.mq-parte{{border-top:1px solid var(--hilo); padding:.85rem 0}}
.mq-parte:first-of-type{{border-top:0; padding-top:0}}
.mq-h{{font-family:var(--mono); font-size:.64rem; letter-spacing:.12em; text-transform:uppercase;
  color:var(--tinta-3); margin-bottom:.6rem}}
.mq-sol{{display:flex; gap:.4rem}}
.mq-sol span{{flex:1; text-align:center; font-size:.8rem; padding:.4rem; border-radius:7px;
  border:1px solid var(--hilo); background:var(--sup-alta)}}
.mq-sol span.on{{border-color:var(--marca); color:var(--marca); font-weight:600}}
.mq-rej{{display:grid; grid-template-columns:repeat(4,1fr); gap:.45rem}}
.mq-m{{border-radius:8px; border:1px solid var(--hilo); overflow:hidden; position:relative;
  aspect-ratio:1/1; display:flex; flex-direction:column}}
.mq-m i{{display:block; flex:1}}
.mq-m u{{display:block; height:34%; border-top:1px solid rgba(0,0,0,.14)}}
.mq-m.on{{outline:2px solid var(--marca); outline-offset:1px}}
.mq-m b{{position:absolute; inset:auto 0 0 0; font-family:var(--mono); font-size:.5rem;
  text-align:center; letter-spacing:.06em; background:rgba(0,0,0,.55); color:#fff;
  padding:1px 0; font-weight:500}}
.mq-m.cerrado i,.mq-m.cerrado u{{opacity:.4}}
.mq-pie{{font-size:.78rem; color:var(--tinta-3); margin-top:.6rem}}

/* --- listas --- */
ul.reglas{{margin:1.2rem 0 0; padding-left:1.15rem; max-width:68ch}}
ul.reglas li{{margin-bottom:.7rem}}
ul.reglas li::marker{{color:var(--tinta-3)}}
.cierre{{margin-top:var(--paso); padding-top:1.6rem; border-top:1px solid var(--hilo);
  color:var(--tinta-3); font-size:.88rem}}
:focus-visible{{outline:2px solid var(--marca); outline-offset:2px; border-radius:4px}}
@media (prefers-reduced-motion:reduce){{*{{animation:none!important; transition:none!important}}}}
</style>

<div class="wrap">

<header class="tapa">
  <p class="ojo">Norata · documento maestro · 30 de agosto de 2026</p>
  <h1>Apariencias</h1>
  <p class="entrada">Todo lo que se decidió sobre cómo se ve Norata, en un solo
    sitio. Estaba repartido entre dos conversaciones y seis láminas; aquí está
    junto, y con la contradicción que había entre dos de ellas resuelta.</p>
  <div class="cifras">
    <span class="cifra"><b>8</b><span>ambientes, medidos</span></span>
    <span class="cifra"><b>14</b><span>mundos, diseñados</span></span>
    <span class="cifra"><b>5</b><span>rangos</span></span>
    <span class="cifra"><b>0</b><span>de esto, construido</span></span>
  </div>
  <nav class="indice">
    <a href="#palabras">Las palabras</a>
    <a href="#ambientes">Los ocho ambientes</a>
    <a href="#mundos">Los catorce mundos</a>
    <a href="#motor">El motor</a>
    <a href="#pantalla">La pantalla</a>
    <a href="#tienda">La tiendita</a>
    <a href="#nivel">El nivel de expedición</a>
    <a href="#abre">Qué abre el nivel</a>
    <a href="#canta">Cómo se canta</a>
    <a href="#rangos">Los rangos</a>
    <a href="#choque">Lo que no cuadraba</a>
    <a href="#orden">El orden</a>
  </nav>
</header>

<section id="palabras">
  <p class="rotulo">Lo primero</p>
  <h2>Las palabras estaban chocando</h2>
  <p class="sub">Las dos conversaciones usaban <b>«mundo» para cosas distintas</b>,
    y eso solo termina en un bug. Queda así, y de aquí en adelante se dice así.</p>
  <div class="tabla"><table class="ancha">
    <thead><tr><th>Palabra</th><th>Qué es</th><th>Cuántos</th><th>Cómo se consigue</th></tr></thead>
    <tbody>
      <tr><th scope="row">Apariencia</th><td>El paraguas. Es la palabra que ya usa la app en <code>10d-plan.js</code></td><td>—</td><td>—</td></tr>
      <tr><th scope="row">Ambiente</th><td>Un <b>recolor</b>: reusa el material que ya hay y le cambia la luz</td><td>8</td><td>Se ganan con el nivel; dos piden Pro</td></tr>
      <tr><th scope="row">Mundo</th><td>Cambia el <b>material</b>: otra superficie, otro marco, otra letra, otro peso al moverse</td><td>14</td><td>De pago</td></tr>
    </tbody>
  </table></div>
  <p class="sub">Un ambiente y un mundo <b>son excluyentes</b>: un mundo declara sus
    propios colores, así que un ambiente por debajo no se vería. Se elige una
    apariencia, no dos. El modo claro sigue siendo un eje aparte y de todos.</p>
  <p class="sub">Y muere una palabra: <b>«grado 3» ya no se llama «mundo»</b>. Tinta
    es un ambiente de grado 3 y sigue siendo un recolor.</p>
</section>

<section id="ambientes">
  <p class="rotulo">Ocho, cerrados y medidos</p>
  <h2>Los ambientes</h2>
  <p class="sub">Un ambiente no construye un mundo: reusa el que ya hay y le cambia
    la luz. Por eso son los que pueden ser gratis y los que pueden salir de uno en
    uno sin volver a revisar la app entera. Debajo, cada uno con la misma pieza
    —aro, icono, título, barra, tres pastillas y una cifra— en sus dos caras.</p>
  {ambientes}
</section>

<section>
  <p class="rotulo">La prueba</p>
  <h2>Todo esto está medido</h2>
  <p class="sub">Ningún tono se eligió a ojo. Estos son los contrastes reales de la
    cara de día, que es la que aprieta: el umbral es 4,5 para escribir y 3 para
    trazar una línea. Los siete pasan, y Musgo pasa mejor que el clásico.</p>
  <div class="tabla"><table>
    <thead><tr><th>Ambiente</th>{"".join(f"<th>{esc(c)}</th>" for c in datos.COLUMNAS_CONTRASTE)}</tr></thead>
    <tbody>{filas_c}</tbody>
  </table></div>
  <p class="sub" style="margin-top:1.1rem">Tinta va por libre porque <b>su acento es
    la propia tinta</b>: por eso es la que se lee en el camión a mediodía. Y es la
    única de las ocho que invierte <code>--sobre-macizo</code> — su relleno de día
    es casi negro, y la tinta de la casa encima daría 1,03 sobre 1. Esa excepción
    es lo que la hace grado 3.</p>
  <p class="sub"><b>Niebla no existe, y murió midiendo.</b> Iba a ser el gris de
    bruma; su cara de día chocaba con cuatro de los otros. La razón es más útil que
    el descarte: gris es en lo que se convierte cualquier ambiente al bajarle la
    saturación, así que un ambiente gris no es un ambiente, es la versión desteñida
    de todos los demás.</p>
</section>

<section id="mundos">
  <p class="rotulo">La otra mitad</p>
  <h2>Los catorce mundos</h2>
  <p class="sub">Aquí solo la lista: viven en <code>mundos/MUNDOS.md</code>, con sus
    variables, sus vectores y su vista comparada. Son <b>de pago</b>, menos Consola,
    que es gratis por lo mismo que Tinta. Los cuatro autorizados, por orden:
    <b>Averno, Blueprint, Consola y Arboleda</b>.</p>
  <ul class="mundos">{mundos}</ul>
</section>

<section id="motor">
  <p class="rotulo">Lo que no existe</p>
  <h2>El motor</h2>
  <p class="sub">Comprobado el 30 de agosto sobre <code>origin/main</code> en
    0.7.39.1: no hay cargador, ni variables de mundo, ni CSS de apariencia servido,
    en ninguna rama ni en ningún commit. Lo que sí existe y se le parece son dos
    cosas distintas — <b>la capa de material</b> de 0.7.37, que es el camino, y
    <b>la llave <code>apariencia</code></b> de <code>10d-plan.js</code>, que es la
    caja registradora. Camino puesto y caja puesta; falta el coche.</p>
  <div class="bloque">
    <h3>Cómo se aplica</h3>
    <p class="sub"><code>&lt;html class="claro" data-apariencia="averno"&gt;</code>
      — un atributo y no una clase, porque son excluyentes y un atributo no puede
      llevar dos valores: el modelo se hace cumplir solo.</p>
  </div>
  <div class="tabla"><table class="ancha">
    <thead><tr><th>Qué</th><th>Dónde</th><th>Nota</th></tr></thead>
    <tbody>
      <tr><th scope="row">Aplicar antes de pintar</th><td><code>index.html</code>, script de arriba</td><td>Junto al modo claro. Si esperara al script principal, cada carga daría un fogonazo con la apariencia vieja</td></tr>
      <tr><th scope="row">El motor</th><td><code>js/10i-apariencia.js</code>, nuevo</td><td>Alta en <code>index.html</code> <b>y</b> en <code>ASSETS</code> de <code>sw.js</code></td></tr>
      <tr><th scope="row">Los ocho ambientes</th><td><code>css/ambientes.css</code>, nuevo</td><td>~6 KB, y va en <code>ASSETS</code>: es chico y cualquiera puede ganarse uno</td></tr>
      <tr><th scope="row">Cada mundo</th><td><code>css/mundos/&lt;id&gt;.css</code></td><td><b>NO van en <code>ASSETS</code>.</b> Se piden al encenderlos y se quedan cacheados por nombre</td></tr>
    </tbody>
  </table></div>
  <p class="sub" style="margin-top:1.2rem"><b>La trampa que va a morder si nadie lee
    esto:</b> una transición sobre una propiedad cuyo valor sale de una variable se
    queda congelada en Chrome, con el color clavado en el primero que vio. Ya pasó
    cuatro veces. Cambiar de apariencia cambia veinte variables de golpe, así que
    hay que apagar las transiciones un turno —<code>cambiando-modo</code>, forzar el
    recálculo, devolverlas con <code>setTimeout</code> y nunca con
    <code>requestAnimationFrame</code>, que en una pestaña de fondo no llega jamás—.</p>
  <p class="sub"><b>Se sube apagado</b>, detrás de <code>?apariencia=</code>, como
    pide <code>CLAUDE.md</code>. Y la prueba: la foto de los estilos calculados de
    las siete pantallas en los dos modos, antes y después. Encender el motor con la
    apariencia de casa puesta <b>tiene que cambiar cero</b>.</p>
</section>

<section id="pantalla">
  <p class="rotulo">Dónde se elige</p>
  <h2>La sección de personalización</h2>
  <p class="sub">Va <b>dentro de Ajustes</b>, no en una pantalla nueva y no en una
    pestaña de la barra. La app ya tiene el sitio natural: el interruptor de sol y
    luna vive ahí, y una apariencia es la misma familia de decisión.</p>
  <div class="maqueta">
    <div class="mq-t">Apariencia</div>
    <div class="mq-s">Ajustes · en singular</div>
    <div class="mq-parte">
      <div class="mq-h">Sol y luna</div>
      <div class="mq-sol"><span class="on">Noche</span><span>Día</span><span>Como el sistema</span></div>
    </div>
    <div class="mq-parte">
      <div class="mq-h">Ambientes</div>
      <div class="mq-rej">
        <span class="mq-m on"><i style="background:#151b25"></i><u style="background:#1d2530"></u></span>
        <span class="mq-m"><i style="background:#1c1f23"></i><u style="background:#23272c"></u></span>
        <span class="mq-m"><i style="background:#131f18"></i><u style="background:#18241c"></u></span>
        <span class="mq-m cerrado"><i style="background:#241c18"></i><u style="background:#30231e"></u><b>Nivel 8</b></span>
        <span class="mq-m cerrado"><i style="background:#251829"></i><u style="background:#36203a"></u><b>Nivel 10</b></span>
        <span class="mq-m cerrado"><i style="background:#121b24"></i><u style="background:#18222d"></u><b>Pro</b></span>
        <span class="mq-m cerrado"><i style="background:#072028"></i><u style="background:#0d2c37"></u><b>Pro</b></span>
        <span class="mq-m cerrado"><i style="background:#141322"></i><u style="background:#1a1826"></u><b>Fundador</b></span>
      </div>
      <p class="mq-pie">Cada muestra es la app en pequeño —fondo, tarjeta y acento—,
        no un círculo de color: un ambiente cambia tres cosas y un círculo enseña una.</p>
    </div>
    <div class="mq-parte">
      <div class="mq-h">Mundos</div>
      <p class="mq-pie">Debajo y separados por un título, porque son otra cosa y
        cuestan dinero. Cada uno con su nombre, su premisa de una línea y su peso.</p>
    </div>
  </div>
  <p class="sub" style="margin-top:1.4rem">Las que no tienes salen apagadas
    <b>con su nivel escrito al lado</b>: eso las convierte en una meta en vez de en
    una lista de lo que te falta. Y lo que esta pantalla nunca hace es <b>decidir por
    ti</b> — si tu apariencia deja de estar disponible, se queda puesta y la
    pantalla lo dice.</p>
</section>

<section id="tienda">
  <p class="rotulo">Dónde se compra</p>
  <h2>La tiendita no es una tienda</h2>
  <p class="sub">Y esa es la decisión. Norata no vende monedas ni cajas: lo único
    que se compra es Pro o Fundador, y eso ya está construido y cobrado con Stripe.
    «La tiendita» es el escaparate dentro de la sección de Apariencia.</p>
  <ul class="reglas">
    <li><b>Un mundo bloqueado se ve entero</b>, no en gris ni tapado. Se puede tocar
      y se pone de muestra un momento, con el rótulo de qué plan lo abre. Enseñar lo
      que se vende vende; esconderlo, no.</li>
    <li><b>El botón dice «Ver Pro»</b> y lleva a la pantalla de plan que ya existe.
      No hay un botón de comprar por mundo: la app no cobra nada, le pide a la
      función <code>pagar</code> una dirección de stripe.com y lleva allí.</li>
    <li><b>Un solo precio.</b> No se venden mundos sueltos. Catorce mundos sueltos
      son catorce productos en Stripe y una pregunta nueva cada vez que sale uno;
      con Pro hay una sola frase, <i>todas las apariencias</i>, que además es lo que
      la tabla de precios ya promete.</li>
    <li><b>Los ambientes no se venden nunca</b>, ni los de grado 2: se ganan con el
      nivel, y dos de ellos además piden Pro. Lo que se gana no se vende y lo que se
      vende no se gana — si se cruzan, el nivel deja de valer para quien pueda pagar.</li>
  </ul>
  <div class="bloque">
    <h3>Qué pasa al dejar de pagar</h3>
    <p class="sub">La regla de la casa es <b>congelar, nunca quitar</b>, y la app
      nunca elige qué se congela. Aquí: el mundo que tienes puesto <b>se queda
      puesto</b> —quitártelo sería que la app eligiera por ti, y encima el día que
      dejas de pagar—; no puedes cambiar a otro de pago; y los ambientes ganados no
      se tocan.</p>
  </div>
</section>

<section id="nivel">
  <p class="rotulo">De dónde cuelga todo</p>
  <h2>El nivel de expedición</h2>
  <p class="sub">Hoy no existe: la app da niveles por habilidad y nadie suma el
    total. Sin esa cifra, un ambiente que se gana no sabe cuándo se ganó. El nombre
    ya estaba puesto sin querer — la pantalla de bienvenida dice «Tu expedición
    empieza aquí».</p>
  <p class="sub" style="margin-top:1rem"><b>Los puntos no se guardan: se cuentan.</b>
    Es la regla que ya rige la sincronía, escrita en <code>10-fusion.js</code>: el XP
    se recalcula contando los movimientos, así una fusión no puede inflarlo. Un
    contador guardado se rompe justo ahí — dos aparatos que suman 100 cada uno se
    juntan y se quedan con 100. Salen tres cosas gratis por decidirlo así: es
    <b>retroactivo</b>, la sincronía <b>no lo puede inflar ni perder</b>, y
    <b>nunca se desalinea</b>.</p>
  <div class="tabla"><table class="ancha">
    <thead><tr><th>Lo que hiciste</th><th>Puntos</th><th>Detalle</th></tr></thead>
    <tbody>{puntos}</tbody>
  </table></div>
  <p class="sub" style="margin-top:1.2rem"><b>Por qué el día se parte en dos.</b> Con
    un valor fijo por día, quien entra dos veces por semana tardaba 4,4 años en
    llegar al último rango y quien entra cinco tardaba 1,7: el sistema medía
    frecuencia, no constancia. Pagando fuerte las dos primeras veces de cada semana
    esa distancia se cierra a 2,3 contra 1,3 años — y deja de tener sentido abrir la
    app diez segundos para no perder el punto del día.</p>
  <div class="bloque">
    <h3>La curva</h3>
    <p class="sub">Sin tope. Los tres primeros niveles van en rampa aparte —15, 35 y
      60 puntos— para que la primera tarde tenga premio; del cuarto en adelante,
      <b>30 × nivel + 15</b>. Es una recta y no una explosión: con la curva de las
      habilidades el nivel 40 pediría cuatro millones de puntos.</p>
    <div class="tabla"><table>
      <thead><tr>{curva_cab}</tr></thead><tbody>{curva}</tbody>
    </table></div>
  </div>
  <div class="bloque">
    <h3>La escalera</h3>
    <ul class="escalera">{escalera}</ul>
    <p class="sub" style="margin-top:1.2rem"><b>Los rangos nunca llevan candado</b>,
      y es la única regla nueva: un rango es la cara del nivel, y el nivel sube para
      todos. Y el número <b>nunca se topa</b> — una cuenta gratuita clavada en el 12
      mientras sigue cumpliendo misiones está diciendo «lo que haces ya no cuenta»,
      que es lo contrario de para qué existe la app. Lo que se topa son los premios.</p>
  </div>
  <div class="bloque">
    <h3>Dónde se ve</h3>
    <p class="sub">Tres sitios, y ninguno es una pantalla nueva. <b>El aro del
      avatar</b>, que la app ya sabe dibujar. <b>Una tarjeta en el Resumen</b>, con
      el próximo desbloqueo escrito antes de llegar — un premio sorpresa no mueve a
      nadie, uno que se ve venir sí. Y <b>la celebración al subir</b>, con el
      ambiente ya puesto.</p>
  </div>
</section>

<section id="abre">
  <p class="rotulo">La pregunta cara</p>
  <h2>Qué abre el nivel, y qué no</h2>
  <p class="sub">Preguntaste si subir de nivel debería desbloquear también
    funcionalidad, para no destapar la app entera el primer día. Son <b>dos cosas
    distintas</b> y separarlas es toda la respuesta: una es un problema real y la
    otra es una solución cara.</p>
  <p class="sub" style="margin-top:1rem"><b>El problema es real.</b> Norata enseña
    el primer día cuatro módulos, un árbol de talentos, rachas, informes y un panel
    de plan. Es mucho, y no todo sirve el primer día: un árbol de talentos con cero
    habilidades no es una promesa, es una pantalla vacía.</p>
  <p class="sub" style="margin-top:1rem"><b>Pero poner funciones detrás del nivel se
    paga en dos sitios.</b> Una función ganada por nivel <b>deja de poder
    venderse</b>, y ya hay un plan que vive exactamente de eso —<code>LIMITES</code>
    cobra por crear ramas, talentos e informes—. Y choca de frente con <b>congelar,
    nunca quitar</b>: un usuario al que la app le dice «esto lo tendrás en el nivel
    14» está siendo castigado por el tiempo, no premiado por el uso. Es la misma
    frase que se rechazó al decidir no topar el número.</p>
  <div class="bloque">
    <h3>Lo que sí resuelve el problema, sin pagar nada</h3>
    <p class="sub"><b>Revelar por estado, no por nivel.</b> La app ya sabe cuándo un
      módulo tiene sentido, y lo sabe mejor que el nivel.</p>
    <div class="tabla"><table class="ancha">
      <thead><tr><th>Se enseña</th><th>Cuando</th><th>Por qué el nivel no sirve</th></tr></thead>
      <tbody>
        <tr><th scope="row">El árbol de talentos</th><td>Hay una habilidad con historial</td><td>Con cero habilidades el árbol está vacío, tengas el nivel que tengas</td></tr>
        <tr><th scope="row">Los informes de semana</th><td>Hay siete días de datos</td><td>Un informe de dos días no es un informe</td></tr>
        <tr><th scope="row">La racha</th><td>Se cumple la primera misión dos días seguidos</td><td>Antes no hay racha que enseñar</td></tr>
        <tr><th scope="row">Los encargos</th><td>Hay un talento con etapas, o se pide a mano</td><td>Es el módulo que menos gente necesita el primer día</td></tr>
      </tbody>
    </table></div>
    <p class="sub" style="margin-top:1.2rem">La diferencia es la que importa:
      <b>revelar por nivel es revelar por tiempo; revelar por estado es revelar
      cuando de verdad sirve</b>. Y no le quita nada a nadie — todo sigue
      existiendo, funcionando y accesible desde el menú; lo que cambia es cuándo la
      app lo pone <b>delante</b>. Una cosa es no gritar el primer día y otra es
      cerrar la puerta.</p>
  </div>
  <p class="sub" style="margin-top:1.4rem"><b>Y hay un premio de nivel que sí es
    funcionalidad y no canibaliza nada:</b> las celebraciones. No cambian lo que
    puedes hacer, cambian cómo te lo cuenta la app, así que pueden regalarse y
    venderse sin tocar <code>LIMITES</code>. Ya están en la escalera, en los niveles
    2, 9, 14 y 16.</p>
  <p class="sub" style="margin-top:1rem">La regla para el día que aparezca una
    función candidata es una sola pregunta: <b>¿esto lo pondrías alguna vez en la
    tabla de precios?</b> Si la respuesta es sí, no puede ser un premio de nivel.</p>
</section>

<section id="canta">
  <p class="rotulo">Cuando sube</p>
  <h2>Cómo se canta un nivel</h2>
  <p class="sub">Hoy hay <b>un solo tamaño de fiesta</b>:
    <code>celebrate(title, sub, color, icono)</code>, siete llamadas, y el nivel de
    una habilidad usa exactamente la misma que un hito. Subir de expedición tiene
    que ser más que eso, y cuando además abre algo, tiene que decirlo ahí mismo.</p>
  <div class="tabla"><table class="ancha">
    <thead><tr><th>Cuándo</th><th>Qué</th><th>Se sale</th></tr></thead>
    <tbody>
      <tr><th scope="row">Sube una habilidad</th><td>Lo de hoy, sin tocar</td><td>Solo</td></tr>
      <tr><th scope="row">Sube la expedición</th><td>La misma escena, más grande y más lenta, con el número al centro y el aro del avatar llenándose</td><td>Solo, a los pocos segundos</td></tr>
      <tr><th scope="row">Sube y abre algo</th><td>Una ventana con lo que se abrió <b>ya puesto</b></td><td>Con un botón, y solo con el botón</td></tr>
    </tbody>
  </table></div>
  <div class="bloque">
    <h3>La ventana no se cierra por accidente</h3>
    <ul class="reglas">
      <li><b>No se cierra tocando fuera.</b> Es la forma número uno de saltarse sin
        querer lo único que la app te iba a enseñar en semanas.</li>
      <li><b>Un solo botón</b>, grande y explícito, que dice qué hace: «Ver cómo
        queda» si abrió un ambiente, «Seguir» si no.</li>
      <li><b>Escape sí cierra.</b> Parece contradecir lo anterior y no lo hace:
        tocar fuera es un gesto que se hace sin querer, y pulsar Escape es una
        decisión. Quitarlo dejaría atrapado a quien usa teclado.</li>
    </ul>
  </div>
  <p class="sub" style="margin-top:1.4rem"><b>Y lo que hace que la ventana valga la
    pena existir: el ambiente ya está puesto detrás.</b> No se enseña una muestra de
    lo que ganaste — se aplica, y la ventana aparece encima de la app ya
    recoloreada. Si lo que se abrió es un rango, detrás está el aro del avatar con
    su color nuevo. Un premio que hay que ir a buscar a Ajustes no es un premio, es
    una tarea.</p>
  <p class="sub" style="margin-top:1rem"><b>Antes que nada de esto:</b> sacar el
    verde de las cinco llamadas a <code>celebrate()</code>. El menta
    <code>#5fe0b0</code> está escrito a mano, y mientras siga ahí la fiesta que
    anuncia un ambiente saldría celebrándolo en el color del ambiente anterior.</p>
</section>

<section id="rangos">
  <p class="rotulo">La cara del número</p>
  <h2>Cinco rangos, no diez</h2>
  <p class="sub">No son una colección para presumir: son la cara y el nombre del
    nivel. Como colección no funcionarían —una vitrina con casillas en gris solo
    funciona cuando alguien más la ve—. Como nombre sí: «Nivel 12» no se recuerda,
    «Refugio» sí. Es la diferencia entre un contador y un capítulo, y por eso bajaron
    de diez a cinco.</p>
  <ul class="rangos">{rangos}</ul>
  <p class="sub" style="margin-top:1.4rem">Van de la tierra al cielo, que es lo que
    hace que cada dibujo se le ocurra solo al anterior. En
    <code>viewBox="0 0 24 24"</code>, trazo de 1,7 y remates redondos: el formato de
    <code>ICONS</code> en <code>01-base.js</code>.</p>
  <p class="sub" style="margin-top:1.2rem"><b>Las cinco que se cayeron</b>, con su
    motivo, que vale más que el dibujo: es lo que impide volver a proponerlas dentro
    de tres meses.</p>
  <ul class="caidas">{caidas}</ul>
</section>

<section id="choque">
  <p class="rotulo">Lo que la partición dejó roto</p>
  <h2>Había una contradicción de verdad</h2>
  <div class="choque">
    <h3>Dos láminas decían cosas distintas sobre lo mismo</h3>
    <div class="frente">
      <div class="lado"><span class="de">Recolores · 30 ago, 03:08</span>
        <p>Musgo 2, <b>Escarcha 4</b>, Adobe 6, Duna 8, <b>Marea 10</b>. Todas
          gratis.</p></div>
      <div class="lado"><span class="de">Nivel de expedición · 30 ago, 13:48</span>
        <p>Grado 1 en 2, 8 y 10. <b>Grado 2 en 12 y 22, y con Pro.</b></p></div>
    </div>
    <p>No es un detalle de reparto: en la primera lista <b>Escarcha y Marea son
      gratis</b> y en la segunda <b>piden Pro</b>. Es la diferencia entre regalar dos
      ambientes y venderlos.</p>
    <p style="margin-top:.9rem"><b>Se resuelve por la segunda</b>, por tres motivos:
      es la más reciente; es la única cuya curva está simulada día por día en vez de
      estimada; y es la que hace que «grado 2 = Pro» sea una regla y no una excepción
      por ambiente. Todo lo de arriba ya está escrito así. <b>Si prefieres la
      primera, es una línea.</b></p>
    <p style="margin-top:.9rem">Y arrastra un arreglo de texto:
      <code>10d-plan.js</code> dice hoy «Las paletas de color son de todos», y con
      este reparto deja de ser cierto.</p>
  </div>
</section>

<section id="orden">
  <p class="rotulo">Por dónde</p>
  <h2>El orden de la tanda</h2>
  <ul class="reglas">
    <li><b>El motor, con Consola.</b> No necesita ni una imagen, así que si algo del
      contrato está mal pensado sale aquí y sale barato.</li>
    <li><b><code>--tipo-titulo-escala</code></b>, que no existe. Sin ella Consola
      desborda el titular a 320 px: es un +29% de ancho.</li>
    <li><b>Los ocho ambientes</b>, que ya están escritos y medidos. Es pegar
      <code>ambientes.css</code> y darlos de alta.</li>
    <li><b>El nivel de expedición</b>, que es lo que los convierte en algo que se
      gana. Hasta entonces se pueden encender, pero no ganar.</li>
    <li><b>Averno y Blueprint</b>, que son los que contestan si esto se puede vender.</li>
    <li><b>Arboleda</b>, y de ahí en adelante uno por tanda.</li>
  </ul>
  <p class="sub" style="margin-top:1.4rem"><b>Sacar el verde de las celebraciones va
    antes que nada de lo visible.</b> El menta está escrito a mano en cinco llamadas
    a <code>celebrate()</code>, y mientras siga ahí ningún ambiente llega a la
    fiesta — y desbloquear un ambiente se celebra con el ambiente ya puesto.</p>
  <div class="bloque">
    <h3>Lo que solo puede decidir Eduardo</h3>
    <ul class="reglas">
      <li><b>El reparto en disputa.</b> ¿Escarcha y Marea gratis en 4 y 10, o de Pro
        en 12 y 22? Mi recomendación es la segunda y ya está escrita así.</li>
      <li><b>Los nombres de los rangos.</b> Semilla, Brote, Refugio, Cima y Norte son
        de relleno para que la escalera se lea. Son cinco: nombrarlos bien sale barato.</li>
      <li><b>¿El rango se dice siempre o solo el día que cambia?</b> Junto al nivel se
        vuelve identidad; solo cuando cambia se vuelve un acontecimiento. Con cinco en
        toda la vida de una cuenta, lo segundo se defiende.</li>
      <li><b>¿El rango es también un color?</b> Cinco aguantan cinco tonos sin volverse
        un arcoíris. Ojo con el lila, que es de Fundador, y con el amarillo y el coral,
        que significan aviso y peligro.</li>
    </ul>
  </div>
</section>

<p class="cierre">Este documento vive en el repositorio, en
  <code>apariencias/LEEME.md</code>, y los tonos en <code>apariencias/datos.py</code>.
  Si algo de apariencias se vuelve a trabajar en otro sitio, se trae aquí antes de
  construirlo — que es exactamente lo que costó esta vez.</p>

</div>"""

if __name__ == "__main__":
    salida = os.path.join(AQUI, "..", "..", "conjunto.html")
    salida = os.environ.get("SALIDA", os.path.join(AQUI, "conjunto.html"))
    txt = pagina()
    open(salida, "w", encoding="utf-8").write(txt)
    print("conjunto.html", len(txt.encode()), "bytes")
