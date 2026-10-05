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

   Las reglas son las de todos: la página decide y esto pinta; un marco, la letra
   del sistema y los tonos del mundo; lo cumplido en el verde de Norata y lo que está en
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

       **Dos pestañas, como en la app: Rutina diaria e Hiperfoco.** Son dos
       cosas distintas y no se mezclan: con un Hiperfoco en marcha el widget
       enseña SU pestaña, y no la rueda de la rutina (que era lo que salía, y
       Eduardo lo vio como un fallo). Se cambia tocando la pestaña: deslizar de
       lado dentro de un widget no existe en Android, porque ese gesto es del
       lanzador (pasa de una pantalla de inicio a otra).

       **Funciona sin abrir la app**, apoyado en los avisos (`nativo/avisos/`):
       iniciar, pausar, seguir y parar son los mismos toques que ya se hacían
       desde la cortina, y los lleva el mismo receptor, con su alarma del final
       y su cola para la página. El reloj de verdad es el de los avisos
       (`Widgets.relojAvisos`): lo escribe la página mientras está viva y el
       receptor cuando no, así que el widget y la cortina dicen siempre lo
       mismo. En un APK sin los avisos, o sin el arranque que manda la página,
       cada botón abre la app y lo hace ella, como antes.

       **El tiempo se escribe igual que en la app y en el aviso (0.7.214):**
       con una hora o más, en minutos («118 min», al minuto); por debajo corre
       por segundos («26:23»). Es `Widgets.cuenta`, y la regla está contada en
       `jCuenta` (js/09d-jornada.js). El sueño va en horas y minutos («07:05»),
       también como en la app.

       **El reloj de arena se mueve como el de la app (0.7.214).** Un widget
       es una imagen que se repinta cada veinte segundos, así que lo que tiene
       que moverse entre medias lo mueve Android por su cuenta:
         - **da la vuelta al empezar**, y al pasar del foco al descanso: cuando
           la arena sube de golpe, igual que `jPintarCentro`. El reloj vive en
           un `ViewFlipper` de dos caras iguales, y pasar de una a la otra es
           lo único que deja animar un widget: la que entra llega girando
           (`anim/widget_voltear`). Lo último que se vio se guarda por widget
           (`pm_arr_`), para no girar en cada repintado;
         - **el chorro cae** mientras corre: es una barra de progreso sin fin
           cuyo dibujo son cuatro cuadros (`drawable/widget_chorro`), que es
           la única animación que arranca sola en un widget. En pausa no cae.
       Parado, el Hiperfoco tiene la arena ABAJO, como en la app: por eso da
       la vuelta al tocar Iniciar. */
    private static JSONObject deLista(JSONObject hf, String k) {
        JSONArray l = hf == null ? null : hf.optJSONArray("lista");
        for (int i = 0; l != null && i < l.length(); i++) {
            JSONObject o = l.optJSONObject(i);
            if (o != null && k.equals(o.optString("k"))) return o;
        }
        return null;
    }

    /* La manera del Hiperfoco que se enseña: la que se eligió en el widget, o la de la app. */
    private static String modoHf(Context c, JSONObject pm) {
        JSONObject hf = pm.optJSONObject("hf");
        String m = Widgets.prefs(c).getString("hf_modo", "");
        if (!m.isEmpty() && deLista(hf, m) != null) return m;
        return hf == null ? "travesia" : hf.optString("modo", "travesia");
    }

    private static JSONObject arranque(JSONObject pm, String cual, String modo) {
        JSONObject ini = pm.optJSONObject("inicios");
        if (ini == null) return null;
        if ("rutina".equals(cual)) return ini.optJSONObject("rutina");
        JSONObject hf = ini.optJSONObject("hf");
        return hf == null ? null : hf.optJSONObject(modo);
    }

    /* El reloj quieto: ni corre ni está en pausa. Es lo que deja el final de una
       fase («Tramo 1 de 4 listo») o la espera entre dos tramos. */
    private static boolean quieto(JSONObject r) {
        return r != null && !r.optBoolean("pausado") && r.optLong("fin", 0) <= System.currentTimeMillis() && r.optLong("inicio", 0) <= 0;
    }

    /* Lo que se tocó en un widget del Pomodoro. Cambiar de pestaña o de manera
       es cosa del widget; lo demás se le pasa al receptor de los avisos, que es
       quien mueve el reloj, pone la alarma del final y se lo apunta a la página. */
    static void alTocarPomo(Context c, String que, int widget) {
        if (que == null) return;
        JSONObject pm = Widgets.foto(c).optJSONObject("pomo");
        if (pm == null) pm = new JSONObject();
        JSONObject r = Widgets.relojAvisos(c);
        switch (que) {
            case "tab-dia":
            case "tab-lite":
                Widgets.prefs(c).edit().putString("pm_pag_" + widget, "tab-lite".equals(que) ? "lite" : "dia").apply();
                break;
            case "modo": {
                JSONObject hf = pm.optJSONObject("hf");
                JSONArray l = hf == null ? null : hf.optJSONArray("lista");
                if (l == null || l.length() == 0) break;
                String ya = modoHf(c, pm);
                int i = 0;
                for (int k = 0; k < l.length(); k++) if (ya.equals(l.optJSONObject(k).optString("k"))) i = k;
                Widgets.prefs(c).edit().putString("hf_modo", l.optJSONObject((i + 1) % l.length()).optString("k")).apply();
                break;
            }
            case "pausa":
            case "seguir":
            case "parar":
                if (r != null) Widgets.aAvisos(c, que, null);
                break;
            case "iniciar-dia": {
                if (r != null && !quieto(r)) break;
                JSONObject ini = r != null && r.optJSONObject("siguiente") != null ? r.optJSONObject("siguiente") : arranque(pm, "rutina", "");
                if (ini != null) Widgets.aAvisos(c, "iniciar", ini);
                break;
            }
            case "iniciar-lite": {
                if (r != null && !quieto(r)) break;
                JSONObject ini = arranque(pm, "hf", modoHf(c, pm));
                if (ini != null) Widgets.aAvisos(c, "iniciar", ini);
                break;
            }
            default:
                break;
        }
    }

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

        // ---- En qué está el reloj: el de los avisos si lo hay; si no, lo que dijo la página. ----
        JSONObject r = Widgets.relojAvisos(c);
        boolean avisos = Widgets.hayAvisos(c);
        boolean corre, pausa, termino, sube = false, pausable = true;
        long dur = Math.max(60000L, pm.optLong("dur", 25 * 60000L)), resto;
        String lite, rTit = "", rTxt = "", fase = "foco";
        int tramo = pm.optInt("tramo", 1), total = pm.optInt("total", 4);
        JSONObject sig = null;
        if (r != null) {
            long fin = r.optLong("fin", 0), ini = r.optLong("inicio", 0);
            pausa = r.optBoolean("pausado");
            corre = !pausa && (fin > ya || ini > 0);
            termino = !pausa && !corre;
            sube = ini > 0 || (pausa && r.optLong("transcurrido", 0) > 0);
            resto = corre ? (fin > 0 ? fin - ya : ya - ini) : pausa ? (sube ? r.optLong("transcurrido") : r.optLong("restante")) : 0;
            if (r.optLong("dur", 0) > 0) dur = r.optLong("dur");
            lite = r.optString("lite", "");
            fase = r.optString("fase", "foco");
            tramo = r.optInt("tramo", tramo);
            total = r.optInt("total", total);
            pausable = r.optBoolean("pausable", true);
            rTit = r.optString("titulo", "").replace(Widgets.tx(f, "pomo", "Pomodoro") + " · ", "");
            rTxt = r.optString("texto", "");
            sig = r.optJSONObject("siguiente");
        } else {
            corre = pm.optBoolean("corre") && pm.optLong("fin") > ya;
            termino = pm.optBoolean("corre") && !corre;
            pausa = pm.optBoolean("pausa");
            resto = corre ? pm.optLong("fin") - ya : pausa ? Math.max(0, pm.optLong("resto", dur)) : termino ? 0 : dur;
            lite = pm.optString("modo", "");
        }
        boolean activo = corre || pausa || termino;
        String cerrado = pm.optString("cerrado", "");
        JSONObject hf = pm.optJSONObject("hf");

        // ---- La pestaña: la que toque lo que corre; si no corre nada, la que eligió la persona. ----
        boolean pLite = hf != null && cerrado.isEmpty()
                && (activo ? !lite.isEmpty() : "lite".equals(Widgets.prefs(c).getString("pm_pag_" + widget, "dia")));
        String modo = activo && !lite.isEmpty() ? lite : modoHf(c, pm);
        JSONObject manera = deLista(hf, modo);
        if (pLite && manera == null) pLite = false;

        JSONObject blo = p.enCurso ? p.tira : null;
        boolean sueno = !pLite && blo != null && blo.optBoolean("luna") && !activo && cerrado.isEmpty();

        // ---- Qué se dice y qué hace el botón ----
        String t, rot, sub, largo, corto, que, ir;   // `que`: el toque que se resuelve aquí; `ir`: adónde abrir la app si no se puede.
        String icono = "widget_ic_play";
        float prog;
        boolean tonal = false, amarillo = false, segundo = false;
        if (!cerrado.isEmpty()) {
            t = "--:--"; rot = cerrado; sub = ""; prog = 0;
            largo = corto = Widgets.tx(f, "abrir", "Abrir"); que = null; ir = "jornada"; tonal = true;
        } else if (sueno) {
            int a = blo.optInt("a"), z = blo.optInt("b"), largoB = ((z - a + 1440) % 1440) == 0 ? 1440 : (z - a + 1440) % 1440, falta = (z - minuto + 1440) % 1440;
            boolean dormido = pm.optBoolean("dormido");
            t = String.format(Locale.US, "%02d:%02d", falta / 60, falta % 60);   // horas y minutos: el sueño va aparte
            rot = dormido ? Widgets.tx(f, "durmiendo", "Durmiendo") : Widgets.tx(f, "dormir_rot", "Hora de dormir");
            sub = con(Widgets.tx(f, "levantas", "Te levantas a las {h}"), "{h}", Widgets.hora(z));
            prog = 1 - falta / (float) largoB;
            largo = dormido ? Widgets.tx(f, "dias_b", "Buenos días, ya desperté") : Widgets.tx(f, "noches", "Buenas noches, a dormir");
            corto = dormido ? Widgets.tx(f, "dias_c", "Ya desperté") : Widgets.tx(f, "noches_c", "A dormir");
            que = null; ir = dormido ? "jornada:despertar" : "jornada:dormir"; icono = "widget_ic_luna"; tonal = true;
        } else {
            long lleno = pLite && !activo ? manera.optLong("dur", dur) : termino && sig != null && sig.optLong("dur", 0) > 0 ? sig.optLong("dur") : dur;
            t = corre || pausa ? Widgets.cuenta(f, resto, sube) : termino && sig == null ? "00:00" : Widgets.cuenta(f, lleno, false);
            prog = corre || pausa ? (sube ? 0 : (dur - resto) / (float) dur) : termino && sig == null ? 1 : 0;
            String pausar = Widgets.tx(f, "pausar", "Pausar"), seguir = Widgets.tx(f, "seguir", "Seguir"), abrir = Widgets.tx(f, "abrir", "Abrir"),
                    parar = Widgets.tx(f, "parar", "Parar");
            if (pLite) {
                String nombre = manera.optString("n", "");
                rot = termino ? rTit : !activo ? nombre + "  ›" : pausa ? Widgets.tx(f, "en_pausa", "En pausa") : nombre;
                sub = activo ? (rTxt.isEmpty() ? manera.optString("r", "") : rTxt) : manera.optString("r", "");
                if (corre && pausable) { largo = corto = pausar; que = "pausa"; ir = "jornada:pausar"; icono = "widget_ic_pausa"; amarillo = true; segundo = true; }
                else if (corre) { largo = corto = parar; que = "parar"; ir = "jornada:lite-parar"; icono = "widget_ic_alto"; tonal = true; }
                else if (pausa) { largo = corto = seguir; que = "seguir"; ir = "jornada:seguir"; segundo = true; }
                else if (termino) { largo = corto = abrir; que = null; ir = "jornada:lite"; tonal = true; }
                else { largo = corto = manera.optString("v", Widgets.tx(f, "iniciar", "Iniciar")); que = "iniciar-lite"; ir = "jornada:lite-iniciar"; }
            } else {
                boolean descanso = "descanso".equals(fase) && activo;
                rot = termino ? (rTit.isEmpty() ? Widgets.tx(f, "listo", "Tramo listo") : rTit)
                        : corre ? (descanso ? Widgets.tx(f, "descanso", "Descanso") : Widgets.tx(f, "enfoque", "Enfoque"))
                        : pausa ? Widgets.tx(f, "en_pausa", "En pausa")
                        : blo != null ? blo.optString("n", "") : Widgets.tx(f, "libre", "Tiempo libre");
                sub = termino ? rTxt
                        : activo ? con(con(Widgets.tx(f, "tramo", "Tramo {a} de {b}"), "{a}", tramo), "{b}", total)
                        : blo != null ? con(Widgets.tx(f, "hasta_m", "Hasta las {h}"), "{h}", Widgets.hora(blo.optInt("b")))
                        : p.tira != null ? con(con(Widgets.tx(f, "sigue_b", "Sigue {n}, {h}"), "{n}", p.tira.optString("n", "")), "{h}", Widgets.hora(p.tira.optInt("a"))) : "";
                if (corre && pausable) { largo = corto = pausar; que = "pausa"; ir = "jornada:pausar"; icono = "widget_ic_pausa"; amarillo = true; }
                else if (corre) { largo = corto = abrir; que = null; ir = "jornada"; tonal = true; }
                else if (pausa) { largo = corto = seguir; que = "seguir"; ir = "jornada:seguir"; }
                else if (termino && sig == null) { largo = corto = abrir; que = null; ir = "jornada"; tonal = true; }
                else { largo = Widgets.tx(f, "iniciar_l", "Iniciar enfoque"); corto = Widgets.tx(f, "iniciar", "Iniciar"); que = "iniciar-dia"; ir = "jornada:iniciar"; }
            }
        }
        /* ¿Se puede hacer aquí, sin abrir la app? Hace falta el receptor de los
           avisos y, para arrancar, el arranque que escribió la página. */
        boolean aqui = que != null && avisos && (
                "iniciar-dia".equals(que) ? (sig != null || arranque(pm, "rutina", "") != null)
                : "iniciar-lite".equals(que) ? arranque(pm, "hf", modo) != null
                : r != null);

        // ---- Las pestañas ----
        ver(c, v, "wp_tabs", cerrado.isEmpty() && hf != null);
        if (cerrado.isEmpty() && hf != null) {
            ver(c, v, "wp_tab_dia_fondo", !pLite);
            ver(c, v, "wp_tab_lite_fondo", pLite);
            tenir(c, v, "wp_tab_dia_fondo", tono);
            tenir(c, v, "wp_tab_lite_fondo", tono);
            texto(c, v, "wp_tab_dia_tx", Widgets.tx(f, "tab_dia", "Rutina diaria"), pLite ? suave : tonoTinta);
            texto(c, v, "wp_tab_lite_tx", Widgets.tx(f, "tab_lite", "Hiperfoco"), pLite ? tonoTinta : suave);
            v.setOnClickPendingIntent(Widgets.id(c, "wp_tab_dia"), Widgets.alPomo(c, "tab-dia", widget));
            v.setOnClickPendingIntent(Widgets.id(c, "wp_tab_lite"), Widgets.alPomo(c, "tab-lite", widget));
        }

        // La cabecera: en el chico, por dónde va; en los otros, la hora, que la
        // lleva un reloj del sistema (`TextClock`) en la zona del perfil.
        boolean conPuntos = !sueno && cerrado.isEmpty() && total > 1 && (!pLite || activo || "travesia".equals(modo));
        texto(c, v, "w_meta", conPuntos && activo ? tramo + "/" + total : "", suave);
        int ahora = Widgets.id(c, "wp_ahora");
        if (ahora != 0 && (grande || ancho)) {
            v.setTextColor(ahora, suave);
            String zona = f.optString("zona", "");
            if (!zona.isEmpty()) v.setString(ahora, "setTimeZone", zona);
        }

        // ---- La cuenta ----
        // Corre sola, por segundos, cuando hay menos de una hora que contar; con
        // más va escrita en minutos (`Widgets.cuenta`, ver el comentario de arriba).
        int crono = Widgets.id(c, "wp_crono");
        boolean cuenta = cerrado.isEmpty() && !sueno && corre && resto < Widgets.HORA;
        ver(c, v, "wp_crono", cuenta);
        ver(c, v, "wp_t", !cuenta);
        if (cuenta) {
            v.setChronometer(crono, sube ? SystemClock.elapsedRealtime() - resto : SystemClock.elapsedRealtime() + resto, null, true);
            if (Build.VERSION.SDK_INT >= 24) v.setChronometerCountDown(crono, !sube);
            v.setTextColor(crono, texto);
        } else {
            v.setChronometer(crono, SystemClock.elapsedRealtime(), null, false);
            texto(c, v, "wp_t", t, texto);
            // «120 min» es más ancho que «25:00» y dentro del aro chico no cabía a su tamaño (visto en el emulador).
            if (!grande && !ancho) v.setTextViewTextSize(Widgets.id(c, "wp_t"), TypedValue.COMPLEX_UNIT_DIP, t.indexOf(':') < 0 ? 16.5f : 21.5f);
        }
        texto(c, v, "wp_rot", rot, sueno ? cursoTinta : texto);
        texto(c, v, "wp_sub", sub, suave);
        // En el Hiperfoco sin empezar, tocar el nombre pasa a la manera siguiente.
        if (pLite && !activo) v.setOnClickPendingIntent(Widgets.id(c, "wp_rot"), Widgets.alPomo(c, "modo", widget));

        // ---- El dibujo ----
        int tonoAro = sueno ? Widgets.tono(blo.optString("c", null), "#f0a5c0") : pausa ? curso : acento;
        if (!grande && !ancho) {
            v.setImageViewBitmap(Widgets.id(c, "wp_aro"), Dibujos.aro(c, 78, 6, prog, carril, tonoAro));
            ver(c, v, "wp_hora", sueno);
            if (sueno) texto(c, v, "wp_hora", Widgets.hora(blo.optInt("b")), suave);
        } else {
            // La grande ocupa lo que deje el resto del molde: cabecera, pestañas, rótulos, botones y el enlace.
            float lado = grande ? Math.max(170, Math.min(md[0] - 28, md[1] - 24 - 24 - 28 - 36 - 54 - (sueno ? 26 : 0))) : 140;
            if (pLite) {
                // El Hiperfoco no tiene rueda: no va por el día, va por lo que dura.
                v.setImageViewBitmap(Widgets.id(c, "wp_rueda"), Dibujos.aro(c, Math.min(lado, 300) * .84f, grande ? 10 : 7, prog, carril, tonoAro));
            } else {
                List<JSONObject> bloques = new ArrayList<>();
                JSONObject dias = f.optJSONObject("dias"), d = dias == null ? null : dias.optJSONObject(Widgets.hoy(f));
                JSONArray bs = d == null ? null : d.optJSONArray("bloques");
                for (int i = 0; bs != null && i < bs.length(); i++) if (bs.optJSONObject(i) != null) bloques.add(bs.optJSONObject(i));
                v.setImageViewBitmap(Widgets.id(c, "wp_rueda"), Dibujos.rueda(c, Math.min(lado, 340), grande, bloques, blo, minuto / 60f, carril, suave, texto, sobre));
            }
            // ---- El reloj de arena: se voltea cuando la arena sube de golpe, y el chorro cae mientras corre ----
            boolean parado = cerrado.isEmpty() && !sueno && !activo;
            float pArena = parado && pLite ? 1 : prog;   // parado, el Hiperfoco tiene la arena abajo
            android.graphics.Bitmap arena = Dibujos.arena(c, grande ? 46 : 22, pArena, suave, curso);
            // Las dos caras llevan siempre el mismo dibujo: da igual cuál esté a la vista.
            v.setImageViewBitmap(Widgets.id(c, "wp_arena"), arena);
            v.setImageViewBitmap(Widgets.id(c, "wp_arena_b"), arena);
            float arriba = 1 - pArena, antes = Widgets.prefs(c).getFloat("pm_arr_" + widget, -1f);
            boolean voltea = antes >= 0 && arriba - antes > 0.5f;
            /* Mientras da la vuelta no cae nada, como en la app: el chorro giraría
               con el reloj y se vería subir. Vuelve un segundo después, con un
               repintado que se pide aquí mismo; si Android cierra el proceso antes,
               lo trae el latido de siempre. */
            boolean cae = !voltea && cerrado.isEmpty() && !sueno && corre && pArena > 0 && pArena < 1;
            if (voltea) {
                final Context app = c.getApplicationContext();
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> Widgets.refrescar(app), 1100);
            }
            ver(c, v, "wp_chorro", cae);
            ver(c, v, "wp_chorro_b", cae);
            if (cae && Build.VERSION.SDK_INT >= 31) {
                android.content.res.ColorStateList tinte = android.content.res.ColorStateList.valueOf(curso);
                v.setColorStateList(Widgets.id(c, "wp_chorro"), "setIndeterminateTintList", tinte);
                v.setColorStateList(Widgets.id(c, "wp_chorro_b"), "setIndeterminateTintList", tinte);
            }
            int giro = Widgets.id(c, "wp_giro");
            if (giro != 0 && voltea) v.showNext(giro);
            if (antes != arriba) Widgets.prefs(c).edit().putFloat("pm_arr_" + widget, arriba).apply();
        }
        ver(c, v, "wp_tramos", conPuntos);
        if (conPuntos) v.setImageViewBitmap(Widgets.id(c, "wp_tramos"), Dibujos.tramos(c, tramo, total, Widgets.color(f, "hecho", "#5fe0b0"), acento, carril));

        // ---- Los botones ----
        // El principal: relleno para iniciar o seguir, amarillo para pausar, tenue para lo demás.
        int tinta = tonal ? tonoTinta : sobre;
        tenir(c, v, "wp_b_fondo", tonal ? tono : amarillo ? curso : Widgets.color(f, "boton", "#5fe0b0"));
        int ic = Widgets.recurso(c, "drawable", icono);
        if (ic != 0) v.setImageViewResource(Widgets.id(c, "wp_b_ic"), ic);
        tenir(c, v, "wp_b_ic", tinta);
        texto(c, v, "wp_b_tx", grande ? largo : corto, tinta);
        if (aqui) v.setOnClickPendingIntent(Widgets.id(c, "wp_b"), Widgets.alPomo(c, que, widget));
        else tocar(c, v, "wp_b", ir);

        // El segundo, solo en un Hiperfoco en marcha: Parar.
        ver(c, v, "wp_b2", segundo);
        if (segundo) {
            tenir(c, v, "wp_b2_fondo", tono);
            tenir(c, v, "wp_b2_ic", tonoTinta);
            if (avisos && r != null) v.setOnClickPendingIntent(Widgets.id(c, "wp_b2"), Widgets.alPomo(c, "parar", widget));
            else tocar(c, v, "wp_b2", "jornada:lite-parar");
        }

        if (grande) {
            ver(c, v, "wp_mas", !pLite);
            tenir(c, v, "wp_mas_fondo", tono);
            tenir(c, v, "wp_mas_ic", tonoTinta);
            tocar(c, v, "wp_mas", "jornada:bloque");
            ver(c, v, "wp_enlace", sueno);
            if (sueno) {
                texto(c, v, "wp_enlace", Widgets.tx(f, "enfocar", "Enfocar de todos modos"), suave);
                v.setInt(Widgets.id(c, "wp_enlace"), "setPaintFlags", Paint.ANTI_ALIAS_FLAG | Paint.UNDERLINE_TEXT_FLAG);
                if (avisos && arranque(pm, "rutina", "") != null) v.setOnClickPendingIntent(Widgets.id(c, "wp_enlace"), Widgets.alPomo(c, "iniciar-dia", widget));
                else tocar(c, v, "wp_enlace", "jornada:iniciar");
            }
        }
        tocar(c, v, "w_cab", pLite ? "jornada:lite" : "jornada");
        return v;
    }
}
