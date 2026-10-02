// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.app.PendingIntent;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.SystemClock;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.text.style.StyleSpan;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Map;

/* Los dos moldes de un aviso, llenos (0.7.161): el PLEGADO, como llega, y el
   ABIERTO, al deslizarlo. Los dibujos están en res/layout/aviso_corto.xml y
   aviso_largo.xml; aquí solo se ponen los textos, los colores y la cuenta.

   **Lo decidió Eduardo, sobre la lámina «Avisos de Norata»:**
     - Un solo marco para todos los mundos (borde de 1,5 en el acento y esquinas
       de 16) y la letra de Norata, Outfit. Del mundo solo vienen los tonos.
     - Los botones hablan como Norata en todos los mundos: primario menta, Pausa
       en el amarillo de «en curso», Seguir menta suave, mirar de línea,
       posponer neutro. Ninguno coral.
     - Con un acento rojo (Catedral, Averno) ningún texto va en rojo: los
       rótulos pasan a la menta y el rojo se queda solo en el borde.
   Todo eso ya llega resuelto en los colores que manda la página
   (`colores`, js/13b-avisos.js); aquí no se decide ningún tono.

   **Cómo se pinta un color que cambia con el mundo.** Un molde de aviso no
   deja leer variables ni cambiar el color de una forma. Por eso cada forma es
   blanca y se tiñe con `setColorFilter`, y un marco con borde son DOS formas
   apiladas: la de fuera, del color del borde, y la de dentro, 1,5 dp más
   chica, del color del fondo.

   **La vista llega de la página** (`jVista…`, js/09d-jornada.js), ya en el idioma
   de la app. Si el aviso cambia con la app cerrada —se pausa desde la
   cortina—, la página ya había mandado también la vista pausada. */
final class AvisosVista {

    private AvisosVista() {}

    static int id(Context c, String nombre) {
        return c.getResources().getIdentifier(nombre, "id", c.getPackageName());
    }

    static int recurso(Context c, String tipo, String nombre) {
        return c.getResources().getIdentifier(nombre, tipo, c.getPackageName());
    }

    /** ¿Trae este APK los moldes? Uno instalado a medias pinta como antes. */
    static boolean hayMoldes(Context c) {
        return recurso(c, "layout", "aviso_corto") != 0 && recurso(c, "layout", "aviso_largo") != 0;
    }

    /* ---------- Los colores ---------- */
    static JSONObject colores(Context c) {
        JSONObject o = Avisos.leer(c, "colores");
        return o != null ? o : new JSONObject();
    }

    static int color(JSONObject col, String llave, String porDefecto) {
        String v = col.optString(llave, porDefecto);
        try { return Color.parseColor(v); } catch (IllegalArgumentException e) { return Color.parseColor(porDefecto); }
    }

    static int rol(JSONObject col, String rol) {
        if ("marca".equals(rol)) return color(col, "marca", "#5fe0b0");
        if ("curso".equals(rol)) return color(col, "cursoTinta", "#f5d76e");
        if ("hecho".equals(rol)) return color(col, "hechoTinta", "#5fe0b0");
        if ("texto".equals(rol)) return color(col, "texto", "#eaf1ef");
        return color(col, "suave", "#9aa7b3");
    }

    private static void tenir(RemoteViews v, int viewId, int color) {
        if (viewId != 0) v.setInt(viewId, "setColorFilter", color);
    }

    private static void marco(Context c, RemoteViews v, JSONObject col) {
        tenir(v, id(c, "av_borde"), color(col, "borde", "#5fe0b0"));
        tenir(v, id(c, "av_fondo"), color(col, "fondo", "#1d2530"));
    }

    /* «{resto}» lo cambia por lo que queda de una cuenta en pausa: lo único que
       la página no puede saber de antemano si se pausó con la app cerrada. */
    private static String llenar(Context c, String t, JSONObject estado) {
        if (t == null) return null;
        /* «{fin}» y «{inicio}»: la hora a la que acaba o empezó la cuenta, con
           el mismo formato que la rueda (jH12: «10:25 AM») y en la zona del
           perfil. Se llenan al pintar, porque una pausa con la app cerrada las
           mueve. */
        if (estado != null && (t.contains("{fin}") || t.contains("{inicio}"))) {
            java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("h:mm a", java.util.Locale.US);
            f.setTimeZone(Avisos.zona(c));
            if (estado.optLong("fin", 0) > 0) t = t.replace("{fin}", f.format(new java.util.Date(estado.optLong("fin"))));
            if (estado.optLong("inicio", 0) > 0) t = t.replace("{inicio}", f.format(new java.util.Date(estado.optLong("inicio"))));
        }
        if (t.contains("{resto}")) {
            long ms = estado == null ? 0 : (estado.optLong("restante", 0) > 0 ? estado.optLong("restante") : estado.optLong("transcurrido", 0));
            t = t.replace("{resto}", Avisos.mmss(ms));
        }
        return t;
    }

    /* Un renglón con partes de colores: [["En foco","marca"],[" · Leer","suave"]]. */
    private static CharSequence partes(Context c, JSONArray a, JSONObject col, JSONObject estado) {
        SpannableStringBuilder sb = new SpannableStringBuilder();
        if (a == null) return sb;
        for (int i = 0; i < a.length(); i++) {
            JSONArray p = a.optJSONArray(i);
            if (p == null) continue;
            String t = llenar(c, p.optString(0), estado);
            String r = p.optString(1, "suave");
            int ini = sb.length();
            sb.append(t);
            sb.setSpan(new ForegroundColorSpan(rol(col, r)), ini, sb.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            if (!"suave".equals(r) && !"texto".equals(r)) sb.setSpan(new StyleSpan(Typeface.BOLD), ini, sb.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
        return sb;
    }

    private static void texto(Context c, RemoteViews v, String nombre, String t, int color) {
        int vid = id(c, nombre);
        if (vid == 0) return;
        if (t == null || t.isEmpty()) { v.setViewVisibility(vid, View.GONE); return; }
        v.setViewVisibility(vid, View.VISIBLE);
        v.setTextViewText(vid, t);
        v.setTextColor(vid, color);
    }

    /* La cuenta la lleva el SISTEMA: el cronómetro se mide con el reloj de
       arranque, no con la hora, así que se traduce `fin`/`inicio`. */
    private static boolean cronometro(Context c, RemoteViews v, String nombre, JSONObject estado, int color) {
        int vid = id(c, nombre);
        if (vid == 0 || estado == null || estado.optBoolean("pausado")) return false;
        long fin = estado.optLong("fin", 0), inicio = estado.optLong("inicio", 0);
        if (fin <= 0 && inicio <= 0) return false;
        long ahora = System.currentTimeMillis();
        long base = SystemClock.elapsedRealtime() + ((fin > 0 ? fin : inicio) - ahora);
        v.setViewVisibility(vid, View.VISIBLE);
        v.setChronometer(vid, base, null, true);
        if (android.os.Build.VERSION.SDK_INT >= 24) v.setChronometerCountDown(vid, fin > 0);
        v.setTextColor(vid, color);
        return true;
    }

    /** Con horas (H:MM:SS) la cifra baja de 36 a 28 y ocupa casi lo mismo. */
    static boolean conHoras(JSONObject estado) {
        if (estado == null) return false;
        long ahora = System.currentTimeMillis();
        if (estado.optLong("fin", 0) > 0) return estado.optLong("fin") - ahora >= 3600000L;
        if (estado.optLong("inicio", 0) > 0) return ahora - estado.optLong("inicio") >= 3600000L;
        return false;
    }

    /* ---------- Los botones ---------- */
    private static void boton(Context c, RemoteViews v, String pre, JSONObject b, JSONObject col, Map<String, PendingIntent> acciones) {
        int caja = id(c, pre);
        if (caja == 0) return;
        if (b == null) { v.setViewVisibility(caja, View.GONE); return; }
        v.setViewVisibility(caja, View.VISIBLE);
        JSONObject nivel = col.optJSONObject("botones") == null ? null : col.optJSONObject("botones").optJSONObject(b.optString("nivel", "suave"));
        if (nivel == null) nivel = new JSONObject();
        // Relleno o línea: el borde y el fondo de dentro. En los rellenos los dos valen lo mismo.
        tenir(v, id(c, pre + "_borde"), color(nivel, "borde", "#5fe0b0"));
        tenir(v, id(c, pre + "_fondo"), color(nivel, "fondo", "#5fe0b0"));
        int tinta = color(nivel, "tinta", "#10151d");
        String t = b.optString("texto", "");
        texto(c, v, pre + "_tx", t, tinta);
        int ic = id(c, pre + "_ic");
        String icono = b.optString("icono", "");
        if (ic != 0) {
            int res = icono.isEmpty() ? 0 : recurso(c, "drawable", "aviso_ic_" + icono);
            if (res == 0) v.setViewVisibility(ic, View.GONE);
            else {
                v.setViewVisibility(ic, View.VISIBLE);
                v.setImageViewResource(ic, res);
                tenir(v, ic, tinta);
            }
        }
        if (t.isEmpty()) v.setContentDescription(caja, b.optString("nombre", ""));
        PendingIntent pi = acciones == null ? null : acciones.get(b.optString("accion", "abrir"));
        if (pi != null) v.setOnClickPendingIntent(caja, pi);
    }

    private static void chip(Context c, RemoteViews v, String pre, JSONObject ch, JSONObject col) {
        int caja = id(c, pre);
        if (caja == 0) return;
        if (ch == null) { v.setViewVisibility(caja, View.GONE); return; }
        v.setViewVisibility(caja, View.VISIBLE);
        boolean hecho = "hecho".equals(ch.optString("tipo"));
        int tinta = color(col, hecho ? "hechoTinta" : "cursoTinta", hecho ? "#5fe0b0" : "#f5d76e");
        tenir(v, id(c, pre + "_fondo"), color(col, hecho ? "hechoVelo" : "cursoVelo", "#33383f"));
        texto(c, v, pre + "_tx", ch.optString("texto"), tinta);
        int ic = id(c, pre + "_ic");
        int res = ch.optString("icono").isEmpty() ? 0 : recurso(c, "drawable", "aviso_ic_" + ch.optString("icono"));
        if (ic != 0) {
            if (res == 0) v.setViewVisibility(ic, View.GONE);
            else { v.setViewVisibility(ic, View.VISIBLE); v.setImageViewResource(ic, res); tenir(v, ic, tinta); }
        }
    }

    /* El icono va UNA vez, en el estado o en la entrada, y no repetido en cada
       vista: pesa unos 6 KB y una alarma lleva dos vistas dentro. */
    private static void icono(Context c, RemoteViews v, JSONObject vista, JSONObject estado) {
        int vid = id(c, "av_icono");
        String png = vista.optString("icono", "");
        if (png.isEmpty() && estado != null) png = estado.optString("icono", "");
        Bitmap b = Avisos.iconoGrande(png);
        if (vid == 0) return;
        if (b == null) { v.setViewVisibility(vid, View.GONE); return; }
        v.setImageViewBitmap(vid, b);
    }

    /* ---------- El plegado ---------- */
    static RemoteViews corto(Context c, JSONObject vista, JSONObject estado, Map<String, PendingIntent> acciones) {
        JSONObject col = colores(c);
        RemoteViews v = new RemoteViews(c.getPackageName(), recurso(c, "layout", "aviso_corto"));
        JSONObject k = vista.optJSONObject("corto");
        if (k == null) k = new JSONObject();
        marco(c, v, col);
        icono(c, v, vista, estado);
        int texto = color(col, "texto", "#eaf1ef"), suave = color(col, "suave", "#9aa7b3");
        boolean crono = k.optBoolean("crono") && cronometro(c, v, "av_c_crono", estado, texto);
        if (!crono) v.setViewVisibility(id(c, "av_c_crono"), View.GONE);
        texto(c, v, "av_c_r1", crono ? null : llenar(c, k.optString("r1", null), estado),
                k.optBoolean("r1Quieto") ? suave : texto);
        texto(c, v, "av_c_r1b", k.optString("r1b", null), suave);
        v.setTextViewText(id(c, "av_c_r2"), partes(c, k.optJSONArray("r2"), col, estado));
        v.setTextColor(id(c, "av_c_r2"), suave);
        texto(c, v, "av_c_num", llenar(c, k.optString("num", null), estado), texto);
        boton(c, v, "av_c_b", k.optJSONObject("boton"), col, acciones);
        return v;
    }

    /* ---------- El abierto ---------- */
    static RemoteViews largo(Context c, JSONObject vista, JSONObject estado, Map<String, PendingIntent> acciones) {
        JSONObject col = colores(c);
        RemoteViews v = new RemoteViews(c.getPackageName(), recurso(c, "layout", "aviso_largo"));
        JSONObject l = vista.optJSONObject("largo");
        if (l == null) l = new JSONObject();
        marco(c, v, col);
        icono(c, v, vista, estado);
        int texto = color(col, "texto", "#eaf1ef"), suave = color(col, "suave", "#9aa7b3");

        JSONArray ceja = l.optJSONArray("ceja");
        texto(c, v, "av_ceja", ceja == null ? null : ceja.optString(0), rol(col, ceja == null ? "marca" : ceja.optString(1, "marca")));
        texto(c, v, "av_tit", l.optString("tit", ""), texto);
        texto(c, v, "av_sub", llenar(c, l.optString("sub", null), estado), suave);

        // La cifra, con su rótulo ENCIMA.
        texto(c, v, "av_rot", l.optString("rot", null), suave);
        boolean crono = l.optBoolean("crono") && cronometro(c, v, "av_crono", estado, texto);
        if (!crono) v.setViewVisibility(id(c, "av_crono"), View.GONE);
        String num = crono ? null : llenar(c, l.optString("num", null), estado);
        texto(c, v, "av_num", num, l.optBoolean("numQuieto") ? suave : texto);
        float tam = (crono ? conHoras(estado) : (num != null && num.length() > 5)) ? 28f : 36f;
        v.setTextViewTextSize(id(c, crono ? "av_crono" : "av_num"), TypedValue.COMPLEX_UNIT_SP, tam);
        chip(c, v, "av_dchip", l.optJSONObject("dchip"), col);

        // El pie: etiqueta, tramos con su texto y un dato. Con solo el dato, centrado.
        JSONObject chipPie = l.optJSONObject("chip");
        JSONArray puntos = l.optJSONArray("puntos");
        String tramo = l.optString("tramo", null), dato = l.optString("dato", null);
        boolean hayPie = chipPie != null || puntos != null || (tramo != null && !tramo.isEmpty()) || (dato != null && !dato.isEmpty());
        v.setViewVisibility(id(c, "av_pie"), hayPie ? View.VISIBLE : View.GONE);
        chip(c, v, "av_chip", chipPie, col);
        int caja = id(c, "av_puntos");
        if (puntos == null) v.setViewVisibility(caja, View.GONE);
        else {
            v.setViewVisibility(caja, View.VISIBLE);
            int hechos = puntos.optInt(0), ahora = puntos.optInt(1, -1), total = puntos.optInt(2, 4);
            for (int i = 0; i < 4; i++) {
                int p = id(c, "av_p" + (i + 1));
                if (i >= total) { v.setViewVisibility(p, View.GONE); continue; }
                v.setViewVisibility(p, View.VISIBLE);
                boolean aro = i == ahora && i >= hechos;
                v.setImageViewResource(p, recurso(c, "drawable", aro ? "aviso_aro" : "aviso_punto"));
                tenir(v, p, i < hechos ? color(col, "hecho", "#5fe0b0") : aro ? color(col, "curso", "#f5d76e") : color(col, "carril", "#2a3441"));
            }
        }
        texto(c, v, "av_tramo", tramo, texto);
        texto(c, v, "av_dato", dato, suave);
        boolean solo = chipPie == null && puntos == null && (tramo == null || tramo.isEmpty());
        v.setInt(id(c, "av_dato"), "setGravity", solo ? Gravity.CENTER : (Gravity.END | Gravity.CENTER_VERTICAL));
        if (solo) v.setViewPadding(id(c, "av_dato"), 0, 0, 0, 0);

        JSONArray bs = l.optJSONArray("botones");
        v.setViewVisibility(id(c, "av_acc"), bs != null && bs.length() > 0 ? View.VISIBLE : View.GONE);
        boton(c, v, "av_b1", bs == null ? null : bs.optJSONObject(0), col, acciones);
        boton(c, v, "av_b2", bs == null ? null : bs.optJSONObject(1), col, acciones);
        return v;
    }
}
