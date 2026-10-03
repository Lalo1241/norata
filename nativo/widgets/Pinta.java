// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.graphics.Paint;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/* Cómo se pinta cada widget que no es Hoy. Cada uno es una función que llena
   su molde con lo que trae la foto (`Widgets.foto`), y su clase —`SigueWidget`,
   `RachaWidget`…— solo existe para que Android tenga a quién llamar.

   Las reglas son las de todos: la página decide y esto pinta; un marco, Outfit
   y los tonos del mundo; lo cumplido en el verde de Norata y lo que está en
   curso en su amarillo, nunca en el acento; cada widget con su icono y ninguno
   con el logo.

   Ninguno de estos escribe en la cuenta. Los botones que cambian algo —marcar
   una misión— pasan por la cola (`Widgets.marcar`); los demás abren la app en
   su sitio, y es la página la que hace el resto (`ir`, js/13c-widgets.js). */
final class Pinta {
    private Pinta() {}

    private static RemoteViews molde(Context c, String nombre) {
        int id = Widgets.recurso(c, "layout", nombre);
        return id == 0 ? null : new RemoteViews(c.getPackageName(), id);
    }

    private static void tenir(Context c, RemoteViews v, String vista, int color) {
        int id = Widgets.id(c, vista);
        if (id != 0) v.setInt(id, "setColorFilter", color);
    }

    private static void texto(Context c, RemoteViews v, String vista, String t, int color) {
        int id = Widgets.id(c, vista);
        if (id == 0) return;
        v.setTextViewText(id, t == null ? "" : t);
        v.setTextColor(id, color);
    }

    private static void ver(Context c, RemoteViews v, String vista, boolean si) {
        int id = Widgets.id(c, vista);
        if (id != 0) v.setViewVisibility(id, si ? View.VISIBLE : View.GONE);
    }

    /* El marco y la cabecera, que son iguales en todos. */
    private static void marco(Context c, RemoteViews v, JSONObject f, String titulo, boolean tenirIcono) {
        tenir(c, v, "wh_borde", Widgets.color(f, "borde", "#2f5a52"));
        tenir(c, v, "wh_fondo", Widgets.color(f, "fondo", "#1b222c"));
        if (tenirIcono) tenir(c, v, "w_ic", Widgets.color(f, "marca", "#5fe0b0"));
        if (titulo != null) texto(c, v, "w_titulo", titulo, Widgets.color(f, "texto", "#eef3f1"));
    }

    /* Cuánto mide el widget, en dp: lo que Android dice del lanzador. En
       vertical el ancho es el mínimo y el alto el máximo. Sin dato, lo del molde. */
    static int[] medida(AppWidgetManager m, int widget, int ancho, int alto) {
        Bundle op = m.getAppWidgetOptions(widget);
        int w = op == null ? 0 : op.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int h = op == null ? 0 : op.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        return new int[] { w > 0 ? w : ancho, h > 0 ? h : alto };
    }

    private static String con(String t, String hueco, Object valor) { return t.replace(hueco, String.valueOf(valor)); }

    private static int tocar(Context c, RemoteViews v, String vista, String ir) {
        int id = Widgets.id(c, vista);
        // El código sale del destino: Android compara dos PendingIntent SIN mirar sus extras.
        if (id != 0) v.setOnClickPendingIntent(id, Widgets.abrir(c, ir, 7300 + (ir.hashCode() & 0x3ff)));
        return id;
    }

    /* ---------- Lo que sigue ---------- */
    static RemoteViews sigue(Context c, AppWidgetManager m, int widget) {
        RemoteViews v = molde(c, "widget_sigue");
        if (v == null) return null;
        JSONObject f = Widgets.foto(c);
        marco(c, v, f, null, false);
        Widgets.Plan p = Widgets.plan(f);
        int texto = Widgets.color(f, "texto", "#eef3f1"), suave = Widgets.color(f, "suave", "#93a0ab"),
                hecho = Widgets.color(f, "hecho", "#5fe0b0"), carril = Widgets.color(f, "carril", "#2c3744"), sobre = Widgets.color(f, "sobre", "#10151d");
        JSONObject sig = null;
        int quedan = 0;
        for (JSONObject o : p.filas) {
            if (!o.has("id") || Widgets.cumplida(o)) continue;
            if (sig == null) sig = o;
            quedan++;
        }
        float parte = p.total > 0 ? p.hechas / (float) p.total : 0;
        String rot = Widgets.tx(f, "sigue_rot", "Lo que sigue");
        int marca = Widgets.id(c, "ws_marca");
        if (sig != null) {
            v.setImageViewBitmap(marca, Dibujos.marcaConAro(c, parte, Widgets.tono(sig.optString("c", null), "#93a0ab"), false, hecho, carril, sobre));
            String de = sig.optString("de", "");
            texto(c, v, "ws_r1", de.isEmpty() ? rot : rot + " · " + de, suave);
            texto(c, v, "ws_r2", sig.optString("n", ""), texto);
            texto(c, v, "ws_r3", quedan == 1 ? Widgets.tx(f, "ultima", "Es la última de hoy") : con(Widgets.tx(f, "quedan", "Quedan {n} hoy"), "{n}", quedan), suave);
            v.setOnClickPendingIntent(marca, Widgets.alMarcar(c, sig.optString("id")));
        } else {
            v.setImageViewBitmap(marca, Dibujos.marcaConAro(c, parte, suave, p.total > 0, hecho, carril, sobre));
            texto(c, v, "ws_r1", rot, suave);
            texto(c, v, "ws_r2", !p.hayDia ? Widgets.tx(f, "abre", "Abre Norata para ver tu día.")
                    : p.total > 0 ? Widgets.tx(f, "nada", "Nada pendiente. Hoy ya quedó.") : Widgets.tx(f, "sin", "Sin misiones para hoy"), texto);
            v.setOnClickPendingIntent(marca, Widgets.abrir(c, "missions", 7101));
        }
        ver(c, v, "ws_r3", sig != null);
        ver(c, v, "ws_flecha", sig != null);
        tenir(c, v, "ws_flecha", suave);
        tocar(c, v, "w_cuerpo", "missions");
        return v;
    }

    /* ---------- Luciérnagas ---------- */
    static RemoteViews luciernagas(Context c, AppWidgetManager m, int widget) {
        RemoteViews v = molde(c, "widget_luc");
        if (v == null) return null;
        JSONObject f = Widgets.foto(c);
        Widgets.Plan p = Widgets.plan(f);
        int[] md = medida(m, widget, 150, 200);
        v.setImageViewBitmap(Widgets.id(c, "wl_escena"), Dibujos.escena(c, Math.min(md[0], 360), Math.min(md[1], 420), p.total, p.hechas));
        texto(c, v, "w_titulo", Widgets.tx(f, "luc", "Luciérnagas"), 0xFFEEF3F1);
        texto(c, v, "wl_num", p.total > 0 ? String.valueOf(p.hechas) : "", 0xFFEEF3F1);
        texto(c, v, "wl_de", p.total > 0 ? con(Widgets.tx(f, "de_n", "de {n}"), "{n}", p.total) : "", 0xFFA9B7C9);
        texto(c, v, "wl_sub", p.total > 0 ? Widgets.tx(f, "enc", "encendidas hoy") : Widgets.tx(f, "descansan", "Hoy descansan"), 0xFFA9B7C9);
        tocar(c, v, "w_cuerpo", "summary");
        return v;
    }

    /* ---------- Racha ----------
       La página manda la semana tal como estaba al armar la foto. Dos cosas se
       ajustan aquí, porque pasan con la app cerrada: una misión marcada en un
       widget enciende hoy (es una de las tres cosas que encienden un día), y a
       partir del domingo la semana es otra y empieza apagada. */
    static RemoteViews racha(Context c, AppWidgetManager m, int widget) {
        RemoteViews v = molde(c, "widget_racha");
        if (v == null) return null;
        JSONObject f = Widgets.foto(c);
        marco(c, v, f, Widgets.tx(f, "racha", "Racha"), false);
        JSONObject r = f.optJSONObject("racha");
        if (r == null) r = new JSONObject();
        int texto = Widgets.color(f, "texto", "#eef3f1"), suave = Widgets.color(f, "suave", "#93a0ab");
        JSONArray claves = r.optJSONArray("claves"), dias = r.optJSONArray("dias");
        int umbral = Math.max(1, r.optInt("umbral", 3)), previas = r.optInt("previas");
        String hoy = Widgets.hoy(f);
        int[] on = new int[7];
        int idx = -1, antes = 0;
        for (int i = 0; i < 7; i++) {
            on[i] = dias == null ? 0 : dias.optInt(i);
            antes += on[i];
            if (claves != null && hoy.equals(claves.optString(i))) idx = i;
        }
        if (idx < 0) {
            // Otra semana: la anterior cuenta si se encendió y es justo la que acaba de terminar.
            Calendar k = Widgets.ahora(f);
            boolean seguida = claves != null && hoy.compareTo(claves.optString(6, "9999")) > 0 && hoy.compareTo(Widgets.sumar(claves.optString(6, ""), 7)) <= 0;
            previas = seguida && antes >= umbral ? previas + 1 : 0;
            on = new int[7];
            idx = k.get(Calendar.DAY_OF_WEEK) - 1;
        }
        Widgets.Plan p = Widgets.plan(f);
        boolean marcada = false;
        for (JSONObject o : p.filas) if (o.has("id") && o.optInt("k") > 0) marcada = true;
        if (marcada) on[idx] = 1;
        int n = 0;
        for (int x : on) n += x;
        boolean ok = n >= umbral;
        int semanas = previas + (ok ? 1 : 0);
        texto(c, v, "wr_num", String.valueOf(semanas), texto);
        texto(c, v, "wr_rot", semanas == 1 ? Widgets.tx(f, "semana_1", "semana\nencendida") : Widgets.tx(f, "semanas_n", "semanas\nencendidas"), suave);
        int[] md = medida(m, widget, 150, 200);
        v.setImageViewBitmap(Widgets.id(c, "wr_semana"), Dibujos.semana(c, Math.max(90, md[0] - 28), on, idx, r.optString("letras", "DLMMJVS"),
                Widgets.color(f, "hecho", "#5fe0b0"), Widgets.color(f, "carril", "#2c3744"), suave, texto, Widgets.color(f, "fondo", "#1b222c")));
        int falta = umbral - n;
        String nota = ok ? Widgets.tx(f, "semana_ok", "Semana encendida")
                : previas == 0 && n == 0 ? Widgets.tx(f, "semana_0", "Tu semana empieza con el primer día")
                : falta == 1 ? Widgets.tx(f, "falta_1", "Falta 1 día para encender esta semana")
                : con(Widgets.tx(f, "faltan_n", "Faltan {n} días para encender esta semana"), "{n}", falta);
        texto(c, v, "wr_nota", nota, ok ? Widgets.color(f, "hechoTinta", "#5fe0b0") : previas == 0 && n == 0 ? suave : Widgets.color(f, "cursoTinta", "#f5d76e"));
        tocar(c, v, "w_cuerpo", "racha");
        return v;
    }

    /* ---------- Expedición ---------- */
    static RemoteViews expedicion(Context c, AppWidgetManager m, int widget) {
        RemoteViews v = molde(c, "widget_exp");
        if (v == null) return null;
        JSONObject f = Widgets.foto(c);
        marco(c, v, f, Widgets.tx(f, "exp", "Expedición"), true);
        JSONObject e = f.optJSONObject("exp");
        if (e == null) e = new JSONObject();
        int texto = Widgets.color(f, "texto", "#eef3f1"), suave = Widgets.color(f, "suave", "#93a0ab");
        v.setImageViewBitmap(Widgets.id(c, "we_aro"), Dibujos.aro(c, 94, 8, (float) e.optDouble("pct", 0) / 100f,
                Widgets.color(f, "carril", "#2c3744"), Widgets.color(f, "acento", "#5fe0b0")));
        texto(c, v, "we_num", e.has("nivel") ? String.valueOf(e.optInt("nivel")) : "", texto);
        texto(c, v, "we_niv", Widgets.tx(f, "nivel", "nivel"), suave);
        texto(c, v, "we_linea", e.optString("linea", ""), suave);
        ver(c, v, "we_candado", e.optBoolean("candado"));
        tenir(c, v, "we_candado", suave);
        // Lo marcado fuera todavía no cuenta para el nivel: se dice cuántas esperan.
        int espera = Widgets.porCobrar(c);
        ver(c, v, "we_chip", espera > 0);
        if (espera > 0) {
            tenir(c, v, "we_chip_fondo", Widgets.color(f, "cursoVelo", "#3a3a2c"));
            texto(c, v, "we_chip_tx", con(Widgets.tx(f, "cobrar", "+{n} por cobrar"), "{n}", espera), Widgets.color(f, "cursoTinta", "#f5d76e"));
        }
        tocar(c, v, "w_cuerpo", "expedicion");
        return v;
    }

    /* ---------- Apuntar ---------- */
    static RemoteViews apuntar(Context c, AppWidgetManager m, int widget) {
        RemoteViews v = molde(c, "widget_apuntar");
        if (v == null) return null;
        JSONObject f = Widgets.foto(c);
        marco(c, v, f, Widgets.tx(f, "apuntar_t", "Apuntar"), true);
        int sobre = Widgets.color(f, "sobre", "#10151d"), tono = Widgets.color(f, "tono", "#263a38"), tinta = Widgets.color(f, "tonoTinta", "#5fe0b0");
        tenir(c, v, "wa_mision_fondo", Widgets.color(f, "boton", "#5fe0b0"));
        tenir(c, v, "wa_mision_ic", sobre);
        texto(c, v, "wa_mision_tx", Widgets.tx(f, "mision", "Misión"), sobre);
        tenir(c, v, "wa_hab_fondo", tono);
        tenir(c, v, "wa_hab_ic", tinta);
        texto(c, v, "wa_hab_tx", Widgets.tx(f, "habilidad", "Habilidad"), tinta);
        tenir(c, v, "wa_reloj_fondo", tono);
        tenir(c, v, "wa_reloj_ic", tinta);
        texto(c, v, "wa_reloj_tx", Widgets.tx(f, "reloj", "Reloj"), tinta);
        tocar(c, v, "wa_mision", "nueva");
        tocar(c, v, "wa_hab", "habilidad");
        tocar(c, v, "wa_reloj", "jornada");
        return v;
    }

    /* ---------- Por cuidar ----------
       La habilidad la elige la página. Aquí solo se mira una cosa que pasa con
       la app cerrada: si la misión que la mantiene ya se marcó hoy. */
    static RemoteViews habilidad(Context c, AppWidgetManager m, int widget) {
        RemoteViews v = molde(c, "widget_hab");
        if (v == null) return null;
        JSONObject f = Widgets.foto(c);
        marco(c, v, f, Widgets.tx(f, "cuidar", "Por cuidar"), true);
        JSONObject h = f.optJSONObject("hab");
        int texto = Widgets.color(f, "texto", "#eef3f1"), suave = Widgets.color(f, "suave", "#93a0ab"), acento = Widgets.color(f, "acento", "#5fe0b0");
        ver(c, v, "wc_vacio", h == null);
        ver(c, v, "wc_todo", h != null);
        if (h == null) {
            texto(c, v, "wc_vacio", Widgets.tx(f, "cuidar_vacio", "Tu primera habilidad aparecerá aquí cuando la practiques."), suave);
            tocar(c, v, "w_cuerpo", "home");
            return v;
        }
        tenir(c, v, "wc_caja", Widgets.color(f, "tonoA", "#263a38"));
        tenir(c, v, "wc_ic", acento);
        texto(c, v, "wc_nom", h.optString("n", ""), texto);
        texto(c, v, "wc_sub", h.optString("sub", ""), suave);
        int[] md = medida(m, widget, 150, 200);
        v.setImageViewBitmap(Widgets.id(c, "wc_barra"), Dibujos.barra(c, Math.max(80, md[0] - 28), (float) h.optDouble("pct", 0) / 100f,
                Widgets.color(f, "carril", "#2c3744"), acento));
        String mid = h.optString("mid", "");
        boolean bien = h.optBoolean("bien");
        Widgets.Plan p = Widgets.plan(f);
        for (JSONObject o : p.filas) if (!mid.isEmpty() && mid.equals(o.optString("id")) && Widgets.cumplida(o)) bien = true;
        tenir(c, v, "wc_punto", bien ? Widgets.color(f, "hecho", "#5fe0b0") : Widgets.color(f, "curso", "#f5d76e"));
        texto(c, v, "wc_a1", bien ? Widgets.tx(f, "aldia", "Al día") : h.optString("a1", ""), texto);
        texto(c, v, "wc_a2", bien ? Widgets.tx(f, "practicaste", "Hoy ya practicaste") : h.optString("a2", ""), suave);
        ver(c, v, "wc_b", !bien);
        if (!bien) {
            tenir(c, v, "wc_b_fondo", Widgets.color(f, "tono", "#263a38"));
            texto(c, v, "wc_b_tx", mid.isEmpty() ? Widgets.tx(f, "apuntar", "Apuntar una") : Widgets.tx(f, "practica", "Marcar práctica"), Widgets.color(f, "tonoTinta", "#5fe0b0"));
            int b = Widgets.id(c, "wc_b");
            if (mid.isEmpty()) tocar(c, v, "wc_b", "nueva");
            else v.setOnClickPendingIntent(b, Widgets.alMarcar(c, mid));
        }
        tocar(c, v, "w_cab", "home");
        return v;
    }

    /* ---------- Siguiente nodo ---------- */
    static RemoteViews nodo(Context c, AppWidgetManager m, int widget) {
        RemoteViews v = molde(c, "widget_nodo");
        if (v == null) return null;
        JSONObject f = Widgets.foto(c);
        marco(c, v, f, null, false);
        JSONObject n = f.optJSONObject("nodo");
        if (n == null) n = new JSONObject();
        int texto = Widgets.color(f, "texto", "#eef3f1"), suave = Widgets.color(f, "suave", "#93a0ab"), acento = Widgets.color(f, "acento", "#5fe0b0");
        boolean cerrado = n.optBoolean("cerrado") || !n.has("r2");
        v.setImageViewBitmap(Widgets.id(c, "wn_fig"), cerrado
                ? Dibujos.candado(c, suave, Widgets.color(f, "tonoA", "#263a38"))
                : Dibujos.figura(c, n.optString("tipo", "hito"), acento, Widgets.color(f, "tonoA", "#263a38")));
        texto(c, v, "wn_r1", n.optString("r1", Widgets.tx(f, "ramas", "Ramas")), suave);
        texto(c, v, "wn_r2", n.optString("r2", Widgets.tx(f, "abre", "Abre Norata para ver tu día.")), texto);
        int total = n.optInt("t");
        ver(c, v, "wn_avance", !cerrado && total > 0);
        if (!cerrado && total > 0) {
            int[] md = medida(m, widget, 300, 90);
            v.setImageViewBitmap(Widgets.id(c, "wn_barra"), Dibujos.barra(c, Math.max(80, md[0] - 150), n.optInt("h") / (float) total,
                    Widgets.color(f, "carril", "#2c3744"), acento));
            texto(c, v, "wn_cuenta", con(con(Widgets.tx(f, "de", "{a} de {b}"), "{a}", n.optInt("h")), "{b}", total), suave);
        }
        tocar(c, v, "w_cuerpo", "tree");
        return v;
    }

    /* ---------- Pomodoro ----------
       Crece con el widget: chico es el reloj, ancho suma la rueda y lo que
       toca, y grande es la rueda entera del día. Los tres moldes usan los
       mismos nombres, así que se llenan igual y cada uno enseña lo que tiene.

       El botón NO arranca el reloj aquí: abre la app y es la página la que lo
       inicia, lo pausa o apunta el sueño (`ir`, js/13c-widgets.js). Un tramo
       que corre con la app cerrada necesita una alarma que avise al acabar, y
       esa es la de los avisos (`nativo/avisos/`); duplicarla aquí serían dos
       relojes que pueden no coincidir.

       Lo que cuenta va en tiempo real: la cuenta del tramo y la del sueño, por
       segundos, con el cronómetro del sistema, y la hora de la cabecera con su
       reloj. La aguja, la arena y el aro son una imagen y avanzan cuando el
       widget se repinta: cada minuto con un Pomodoro puesto, y cada veinte
       segundos con un tramo en marcha (`Widgets.armarTic`). */
    static RemoteViews pomodoro(Context c, AppWidgetManager m, int widget) {
        int[] md = medida(m, widget, 150, 200);
        boolean grande = md[0] >= 230 && md[1] >= 300, ancho = !grande && md[0] >= 230;
        RemoteViews v = molde(c, grande ? "widget_pomo_grande" : ancho ? "widget_pomo_ancho" : "widget_pomo_chico");
        if (v == null) return null;
        JSONObject f = Widgets.foto(c);
        marco(c, v, f, Widgets.tx(f, "pomo", "Pomodoro"), true);
        JSONObject pm = f.optJSONObject("pomo");
        if (pm == null) pm = new JSONObject();
        Widgets.Plan p = Widgets.plan(f);
        int minuto = Widgets.minuto(f);
        long ya = System.currentTimeMillis();
        int texto = Widgets.color(f, "texto", "#eef3f1"), suave = Widgets.color(f, "suave", "#93a0ab"), acento = Widgets.color(f, "acento", "#5fe0b0"),
                carril = Widgets.color(f, "carril", "#2c3744"), sobre = Widgets.color(f, "sobre", "#10151d"),
                curso = Widgets.color(f, "curso", "#f5d76e"), cursoTinta = Widgets.color(f, "cursoTinta", "#f5d76e"),
                tono = Widgets.color(f, "tono", "#263a38"), tonoTinta = Widgets.color(f, "tonoTinta", "#5fe0b0");

        boolean corre = pm.optBoolean("corre") && pm.optLong("fin") > ya, termino = pm.optBoolean("corre") && !corre, pausa = pm.optBoolean("pausa");
        long dur = Math.max(60000L, pm.optLong("dur", 25 * 60000L));
        long resto = corre ? pm.optLong("fin") - ya : pausa ? Math.max(0, pm.optLong("resto", dur)) : termino ? 0 : dur;
        boolean activo = corre || pausa || termino;
        JSONObject blo = p.enCurso ? p.tira : null;
        boolean sueno = blo != null && blo.optBoolean("luna") && !activo;
        String cerrado = pm.optString("cerrado", "");

        String t, rot, sub, largo, corto, ir;
        float prog;
        long hastaDespertar = 0;
        if (!cerrado.isEmpty()) {
            t = "--:--"; rot = cerrado; sub = ""; prog = 0;
            largo = corto = Widgets.tx(f, "abrir", "Abrir"); ir = "jornada";
        } else if (sueno) {
            int a = blo.optInt("a"), z = blo.optInt("b"), total = ((z - a + 1440) % 1440) == 0 ? 1440 : (z - a + 1440) % 1440, falta = (z - minuto + 1440) % 1440;
            boolean dormido = pm.optBoolean("dormido");
            t = String.format(Locale.US, "%d:%02d", falta / 60, falta % 60);
            hastaDespertar = Math.max(0, falta * 60000L - Widgets.ahora(f).get(Calendar.SECOND) * 1000L);
            rot = dormido ? Widgets.tx(f, "durmiendo", "Durmiendo") : Widgets.tx(f, "dormir_rot", "Hora de dormir");
            sub = con(Widgets.tx(f, "levantas", "Te levantas a las {h}"), "{h}", Widgets.hora(z));
            prog = 1 - falta / (float) total;
            largo = dormido ? Widgets.tx(f, "dias_b", "Buenos días, ya desperté") : Widgets.tx(f, "noches", "Buenas noches, a dormir");
            corto = dormido ? Widgets.tx(f, "dias_c", "Ya desperté") : Widgets.tx(f, "noches_c", "A dormir");
            ir = dormido ? "jornada:despertar" : "jornada:dormir";
        } else {
            long s = resto / 1000;
            t = String.format(Locale.US, "%02d:%02d", s / 60, s % 60);
            rot = termino ? Widgets.tx(f, "listo", "Tramo listo") : corre ? Widgets.tx(f, "enfoque", "Enfoque") : pausa ? Widgets.tx(f, "en_pausa", "En pausa")
                    : blo != null ? blo.optString("n", "") : Widgets.tx(f, "libre", "Tiempo libre");
            sub = activo ? con(con(Widgets.tx(f, "tramo", "Tramo {a} de {b}"), "{a}", pm.optInt("tramo", 1)), "{b}", pm.optInt("total", 4))
                    : blo != null ? con(Widgets.tx(f, "hasta_m", "Hasta las {h}"), "{h}", Widgets.hora(blo.optInt("b")))
                    : p.tira != null ? con(con(Widgets.tx(f, "sigue_b", "Sigue {n}, {h}"), "{n}", p.tira.optString("n", "")), "{h}", Widgets.hora(p.tira.optInt("a"))) : "";
            prog = (dur - resto) / (float) dur;
            largo = corre ? Widgets.tx(f, "pausar", "Pausar") : pausa ? Widgets.tx(f, "seguir", "Seguir") : Widgets.tx(f, "iniciar_l", "Iniciar enfoque");
            corto = corre ? largo : pausa ? largo : Widgets.tx(f, "iniciar", "Iniciar");
            ir = corre ? "jornada:pausar" : pausa ? "jornada:seguir" : "jornada:iniciar";
        }

        // La cabecera: en el chico, por dónde va; en los otros, la hora, que la
        // lleva un reloj del sistema (`TextClock`) en la zona del perfil: cambia
        // sola al minuto, sin esperar a que el widget se repinte.
        texto(c, v, "w_meta", sueno || !cerrado.isEmpty() ? "" : pm.optInt("tramo", 1) + "/" + pm.optInt("total", 4), suave);
        int ahora = Widgets.id(c, "wp_ahora");
        if (ahora != 0 && (grande || ancho)) {
            v.setTextColor(ahora, suave);
            String zona = f.optString("zona", "");
            if (!zona.isEmpty()) v.setString(ahora, "setTimeZone", zona);
        }

        // La cuenta corre SOLA, por segundos, con el cronómetro del sistema: lo que
        // falta del tramo si corre, y lo que falta para despertar en el bloque de
        // sueño. Solo queda quieta cuando no hay nada contando (en pausa, o antes
        // de iniciar), que es cuando un número quieto dice la verdad.
        int crono = Widgets.id(c, "wp_crono");
        boolean cuenta = cerrado.isEmpty() && (corre || (sueno && hastaDespertar > 0));
        ver(c, v, "wp_crono", cuenta);
        ver(c, v, "wp_t", !cuenta);
        if (cuenta) {
            v.setChronometer(crono, SystemClock.elapsedRealtime() + (corre ? resto : hastaDespertar), null, true);
            if (Build.VERSION.SDK_INT >= 24) v.setChronometerCountDown(crono, true);
            v.setTextColor(crono, texto);
            // Con horas («5:04:12») no cabe dentro del aro chico a su tamaño de siempre.
            if (!grande && !ancho) v.setTextViewTextSize(crono, TypedValue.COMPLEX_UNIT_DIP, sueno ? 16.5f : 22);
        } else {
            v.setChronometer(crono, SystemClock.elapsedRealtime(), null, false);
            texto(c, v, "wp_t", t, texto);
        }
        texto(c, v, "wp_rot", rot, sueno ? cursoTinta : texto);
        texto(c, v, "wp_sub", sub, suave);

        int tonoAro = sueno ? Widgets.tono(blo.optString("c", null), "#f0a5c0") : pausa ? curso : acento;
        if (!grande && !ancho) {
            v.setImageViewBitmap(Widgets.id(c, "wp_aro"), Dibujos.aro(c, 94, 6, prog, carril, tonoAro));
            ver(c, v, "wp_hora", sueno);
            if (sueno) texto(c, v, "wp_hora", Widgets.hora(blo.optInt("b")), suave);
        } else {
            List<JSONObject> bloques = new ArrayList<>();
            JSONObject dias = f.optJSONObject("dias"), d = dias == null ? null : dias.optJSONObject(Widgets.hoy(f));
            JSONArray bs = d == null ? null : d.optJSONArray("bloques");
            for (int i = 0; bs != null && i < bs.length(); i++) if (bs.optJSONObject(i) != null) bloques.add(bs.optJSONObject(i));
            // La grande ocupa lo que deje el resto del molde: cabecera, rótulos, botones y el enlace.
            float lado = grande ? Math.max(180, Math.min(md[0] - 28, md[1] - 24 - 24 - 36 - 54 - (sueno ? 26 : 0))) : 150;
            v.setImageViewBitmap(Widgets.id(c, "wp_rueda"), Dibujos.rueda(c, Math.min(lado, 340), grande, bloques, blo, minuto / 60f, carril, suave, texto, sobre));
            v.setImageViewBitmap(Widgets.id(c, "wp_arena"), Dibujos.arena(c, grande ? 46 : 22, prog, suave, curso));
        }
        ver(c, v, "wp_tramos", !sueno && cerrado.isEmpty());
        if (!sueno) v.setImageViewBitmap(Widgets.id(c, "wp_tramos"), Dibujos.tramos(c, pm.optInt("tramo", 1), pm.optInt("total", 4), Widgets.color(f, "hecho", "#5fe0b0"), acento, carril));

        // El botón del momento: relleno para iniciar o seguir, amarillo para pausar, tenue para el sueño.
        int tinta = sueno ? tonoTinta : sobre;
        tenir(c, v, "wp_b_fondo", sueno ? tono : corre ? curso : Widgets.color(f, "boton", "#5fe0b0"));
        int ic = Widgets.recurso(c, "drawable", sueno ? "widget_ic_luna" : corre ? "widget_ic_pausa" : "widget_ic_play");
        if (ic != 0) v.setImageViewResource(Widgets.id(c, "wp_b_ic"), ic);
        tenir(c, v, "wp_b_ic", tinta);
        texto(c, v, "wp_b_tx", grande ? largo : corto, tinta);
        tocar(c, v, "wp_b", ir);

        if (grande) {
            tenir(c, v, "wp_mas_fondo", tono);
            tenir(c, v, "wp_mas_ic", tonoTinta);
            tocar(c, v, "wp_mas", "jornada:bloque");
            ver(c, v, "wp_enlace", sueno);
            if (sueno) {
                texto(c, v, "wp_enlace", Widgets.tx(f, "enfocar", "Enfocar de todos modos"), suave);
                v.setInt(Widgets.id(c, "wp_enlace"), "setPaintFlags", Paint.ANTI_ALIAS_FLAG | Paint.UNDERLINE_TEXT_FLAG);
                tocar(c, v, "wp_enlace", "jornada:iniciar");
            }
        }
        tocar(c, v, "w_cab", "jornada");
        return v;
    }
}
