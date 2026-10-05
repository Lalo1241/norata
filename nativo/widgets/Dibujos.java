// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;

import org.json.JSONObject;

import java.util.List;

/* Lo que un widget no sabe pintar con sus moldes se dibuja aquí y viaja como
   imagen: aros, barras, la semana de la racha, la figura de un nodo, la
   escena de las luciérnagas, el reloj de arena y la rueda del Pomodoro.

   Las medidas están en las unidades del boceto que aprobó Eduardo (el HTML de
   «Widgets de Norata»), pasadas a dp: si se retoca una forma allí, se retoca
   aquí con los mismos números. */
final class Dibujos {
    private Dibujos() {}

    static float dp(Context c, float v) { return v * c.getResources().getDisplayMetrics().density; }

    static Paint pincel(int color, boolean trazo, float ancho) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(color);
        p.setStyle(trazo ? Paint.Style.STROKE : Paint.Style.FILL);
        p.setStrokeWidth(ancho);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setStrokeJoin(Paint.Join.ROUND);
        return p;
    }

    private static Bitmap lienzo(int ancho, int alto) {
        return Bitmap.createBitmap(Math.max(1, ancho), Math.max(1, alto), Bitmap.Config.ARGB_8888);
    }

    /* La letra de lo que se escribe DENTRO de un dibujo (las horas de la rueda, las
       iniciales de la semana): la del sistema, como todo lo demás de los widgets.
       Quien tiene otra letra puesta en su teléfono la ve también aquí. */
    static Typeface letra(Context c, String nombre) {
        return nombre.contains("medium") ? Typeface.create("sans-serif-medium", Typeface.NORMAL) : Typeface.DEFAULT_BOLD;
    }

    /* ---------- Aros y barras ---------- */
    static Bitmap aro(Context c, float ladoDp, float grosorDp, float parte, int carril, int color) {
        int n = Math.round(dp(c, ladoDp));
        Bitmap b = lienzo(n, n);
        Canvas k = new Canvas(b);
        float g = dp(c, grosorDp);
        RectF caja = new RectF(g / 2, g / 2, n - g / 2, n - g / 2);
        k.drawOval(caja, pincel(carril, true, g));
        if (parte > 0) k.drawArc(caja, -90, 360 * Math.min(1, parte), false, pincel(color, true, g));
        return b;
    }

    static Bitmap barra(Context c, float anchoDp, float parte, int carril, int color) {
        int w = Math.round(dp(c, anchoDp)), h = Math.round(dp(c, 5));
        Bitmap b = lienzo(w, h);
        Canvas k = new Canvas(b);
        float r = h / 2f;
        k.drawRoundRect(new RectF(0, 0, w, h), r, r, pincel(carril, false, 0));
        float lleno = w * Math.max(0, Math.min(1, parte));
        if (lleno > 0) k.drawRoundRect(new RectF(0, 0, Math.max(h, lleno), h), r, r, pincel(color, false, 0));
        return b;
    }

    /* La marca de «Lo que sigue»: el avance del día alrededor y la casilla dentro. */
    static Bitmap marcaConAro(Context c, float parte, int colorMision, boolean hecha, int hecho, int carril, int sobre) {
        int n = Math.round(dp(c, 48));
        Bitmap b = lienzo(n, n);
        Canvas k = new Canvas(b);
        float g = dp(c, 3), r = n / 2f;
        RectF caja = new RectF(g / 2, g / 2, n - g / 2, n - g / 2);
        k.drawOval(caja, pincel(carril, true, g));
        if (parte > 0) k.drawArc(caja, -90, 360 * Math.min(1, parte), false, pincel(hecho, true, g));
        float rc = dp(c, 15);
        if (!hecha) {
            k.drawCircle(r, r, rc - dp(c, 1), pincel(colorMision, true, dp(c, 2)));
            return b;
        }
        k.drawCircle(r, r, rc, pincel(hecho, false, 0));
        float u = dp(c, 30) / 22f, o = r - dp(c, 15);
        Path p = new Path();
        p.moveTo(o + 6.6f * u, o + 11.4f * u);
        p.lineTo(o + 9.6f * u, o + 14.4f * u);
        p.lineTo(o + 15.4f * u, o + 8.2f * u);
        k.drawPath(p, pincel(sobre, true, dp(c, 2.6f)));
        return b;
    }

    /* Los puntos de los tramos del Pomodoro: los hechos, el que va y los que faltan. */
    static Bitmap tramos(Context c, int va, int total, int hecho, int acento, int carril) {
        int n = Math.max(1, Math.min(8, total));
        float d = dp(c, 7), hueco = dp(c, 5), m = dp(c, 1);
        Bitmap b = lienzo(Math.round(n * d + (n - 1) * hueco + 2 * m), Math.round(d + 2 * m));
        Canvas k = new Canvas(b);
        for (int i = 0; i < n; i++) {
            float x = m + i * (d + hueco) + d / 2;
            k.drawCircle(x, m + d / 2, d / 2, pincel(i + 1 < va ? hecho : i + 1 == va ? acento : carril, false, 0));
        }
        return b;
    }

    /* ---------- La semana de la racha ----------
       Siete puntos de domingo a sábado con su letra debajo; el de hoy lleva un
       cerco. `on[i]` dice si ese día está encendido. */
    static Bitmap semana(Context c, float anchoDp, int[] on, int hoy, String letras, int hecho, int carril, int suave, int texto, int fondo) {
        int w = Math.round(dp(c, anchoDp)), h = Math.round(dp(c, 30));
        Bitmap b = lienzo(w, h);
        Canvas k = new Canvas(b);
        float paso = w / 7f, r = dp(c, 5.5f), cy = dp(c, 9);
        Paint tx = pincel(suave, false, 0);
        tx.setTextAlign(Paint.Align.CENTER);
        tx.setTextSize(dp(c, 9.5f));
        tx.setTypeface(letra(c, "outfit_medium"));
        for (int i = 0; i < 7; i++) {
            float x = paso * i + paso / 2;
            if (i == hoy) {
                k.drawCircle(x, cy, r + dp(c, 3.5f), pincel(suave, false, 0));
                k.drawCircle(x, cy, r + dp(c, 2), pincel(fondo, false, 0));
            }
            k.drawCircle(x, cy, r, pincel(on[i] > 0 ? hecho : carril, false, 0));
            String l = letras != null && letras.length() > i ? letras.substring(i, i + 1) : "";
            tx.setColor(i == hoy ? texto : suave);
            tx.setTypeface(letra(c, i == hoy ? "outfit_bold" : "outfit_medium"));
            k.drawText(l, x, h - dp(c, 2), tx);
        }
        return b;
    }

    /* ---------- La figura de un nodo ----------
       Las mismas cuatro de Ramas, con su significado: hexágono un hito, rombo
       una meta, triángulo algo que se acumula y círculo una compra. Cerrado, un
       candado dentro de su caja. */
    static Bitmap figura(Context c, String tipo, int acento, int relleno) {
        int n = Math.round(dp(c, 46));
        Bitmap b = lienzo(n, n);
        Canvas k = new Canvas(b);
        float u = n / 46f, g = dp(c, 2);
        Path p = new Path();
        if ("meta".equals(tipo)) {
            p.moveTo(23 * u, 3 * u); p.lineTo(43 * u, 23 * u); p.lineTo(23 * u, 43 * u); p.lineTo(3 * u, 23 * u); p.close();
        } else if ("acumular".equals(tipo)) {
            p.moveTo(23 * u, 5 * u); p.lineTo(43 * u, 40 * u); p.lineTo(3 * u, 40 * u); p.close();
        } else if ("compra".equals(tipo)) {
            p.addCircle(23 * u, 23 * u, 19 * u, Path.Direction.CW);
        } else {
            p.moveTo(23 * u, 3 * u); p.lineTo(40.3f * u, 13 * u); p.lineTo(40.3f * u, 33 * u);
            p.lineTo(23 * u, 43 * u); p.lineTo(5.7f * u, 33 * u); p.lineTo(5.7f * u, 13 * u); p.close();
        }
        k.drawPath(p, pincel(relleno, false, 0));
        k.drawPath(p, pincel(acento, true, g));
        k.drawCircle(23 * u, ("acumular".equals(tipo) ? 27 : 23) * u, 4.5f * u, pincel(acento, false, 0));
        return b;
    }

    static Bitmap candado(Context c, int suave, int relleno) {
        int n = Math.round(dp(c, 46));
        Bitmap b = lienzo(n, n);
        Canvas k = new Canvas(b);
        float u = n / 46f, r = 15 * u;
        k.drawRoundRect(new RectF(0, 0, n, n), r, r, pincel(relleno, false, 0));
        Paint t = pincel(suave, true, dp(c, 2));
        k.drawRoundRect(new RectF(15 * u, 22 * u, 31 * u, 33 * u), 2.5f * u, 2.5f * u, t);
        k.drawArc(new RectF(18 * u, 13 * u, 28 * u, 25 * u), 180, 180, false, t);
        k.drawLine(18 * u, 19 * u, 18 * u, 22 * u, t);
        k.drawLine(28 * u, 19 * u, 28 * u, 22 * u, t);
        return b;
    }

    /* ---------- Las luciérnagas ----------
       Se queda de noche en los dos modos: es un dibujo, no interfaz (la misma
       regla de la escena de la racha). Una luciérnaga por misión de hoy, y se
       enciende la que ya se cumplió. En un widget no flotan: Android no anima
       dentro de una imagen. */
    private static final float[][] LUGARES = { { 26, 36 }, { 68, 27 }, { 46, 50 }, { 82, 55 }, { 17, 58 }, { 58, 64 }, { 36, 24 }, { 74, 42 } };
    private static final float[][] ESTRELLAS = { { 12, 22 }, { 38, 16 }, { 58, 30 }, { 86, 20 }, { 74, 40 }, { 30, 44 }, { 90, 34 } };

    static Bitmap escena(Context c, float anchoDp, float altoDp, int total, int encendidas) {
        int w = Math.round(dp(c, anchoDp)), h = Math.round(dp(c, altoDp));
        Bitmap b = lienzo(w, h);
        Canvas k = new Canvas(b);
        float r = dp(c, 20);
        Path marco = new Path();
        marco.addRoundRect(new RectF(0, 0, w, h), r, r, Path.Direction.CW);
        k.save();
        k.clipPath(marco);
        Paint cielo = new Paint(Paint.ANTI_ALIAS_FLAG);
        cielo.setShader(new LinearGradient(0, 0, 0, h, new int[] { 0xFF080D1F, 0xFF101A33, 0xFF1B2C48 }, new float[] { 0f, .55f, 1f }, Shader.TileMode.CLAMP));
        k.drawRect(0, 0, w, h, cielo);
        Paint e = pincel(0x73FFFFFF, false, 0);
        for (float[] s : ESTRELLAS) k.drawCircle(w * s[0] / 100, h * s[1] / 100, dp(c, .8f), e);
        // Las lomas: las dos curvas del boceto, en su caja de 148 × 86 al pie.
        float sx = w / 148f, sy = dp(c, 86) / 86f, y0 = h - dp(c, 86);
        Path l1 = new Path();
        l1.moveTo(0, y0 + 40 * sy);
        l1.cubicTo(30 * sx, y0 + 22 * sy, 58 * sx, y0 + 26 * sy, 84 * sx, y0 + 40 * sy);
        l1.cubicTo(110 * sx, y0 + 54 * sy, 128 * sx, y0 + 52 * sy, 148 * sx, y0 + 36 * sy);
        l1.lineTo(w, h); l1.lineTo(0, h); l1.close();
        k.drawPath(l1, pincel(0xFF0D1628, false, 0));
        Path l2 = new Path();
        l2.moveTo(0, y0 + 62 * sy);
        l2.cubicTo(26 * sx, y0 + 48 * sy, 50 * sx, y0 + 50 * sy, 76 * sx, y0 + 62 * sy);
        l2.cubicTo(102 * sx, y0 + 74 * sy, 124 * sx, y0 + 70 * sy, 148 * sx, y0 + 56 * sy);
        l2.lineTo(w, h); l2.lineTo(0, h); l2.close();
        k.drawPath(l2, pincel(0xFF080E1B, false, 0));
        int n = Math.min(total, LUGARES.length * 2);
        for (int i = 0; i < n; i++) {
            float[] p = LUGARES[i % LUGARES.length];
            float x = w * (p[0] + (i >= LUGARES.length ? 6 : 0)) / 100, y = h * (p[1] + (i >= LUGARES.length ? 7 : 0)) / 100;
            if (i < encendidas) {
                Paint halo = new Paint(Paint.ANTI_ALIAS_FLAG);
                float rh = dp(c, 13);
                halo.setShader(new RadialGradient(x, y, rh, new int[] { 0x99F5D76E, 0x33F5D76E, 0x00F5D76E }, new float[] { 0f, .45f, 1f }, Shader.TileMode.CLAMP));
                k.drawCircle(x, y, rh, halo);
                k.drawCircle(x, y, dp(c, 2.6f), pincel(0xFFFFF6C4, false, 0));
            } else {
                k.drawCircle(x, y, dp(c, 1.6f), pincel(0xFF5A6880, false, 0));
            }
        }
        k.restore();
        float g = dp(c, 1);
        k.drawRoundRect(new RectF(g / 2, g / 2, w - g / 2, h - g / 2), r, r, pincel(0x33F5D76E, true, g));
        return b;
    }

    /* ---------- El reloj de arena ---------- */
    static Bitmap arena(Context c, float altoDp, float prog, int suave, int arena) {
        float u = dp(c, altoDp) / 52f;
        Bitmap b = lienzo(Math.round(40 * u), Math.round(52 * u));
        Canvas k = new Canvas(b);
        float p = Math.max(0, Math.min(1, prog));
        Path vaso = new Path();
        vaso.moveTo(8 * u, 6 * u); vaso.lineTo(32 * u, 6 * u); vaso.lineTo(32 * u, 10 * u);
        vaso.cubicTo(32 * u, 18 * u, 22 * u, 22 * u, 22 * u, 26 * u);
        vaso.cubicTo(22 * u, 30 * u, 32 * u, 34 * u, 32 * u, 42 * u);
        vaso.lineTo(32 * u, 46 * u); vaso.lineTo(8 * u, 46 * u); vaso.lineTo(8 * u, 42 * u);
        vaso.cubicTo(8 * u, 34 * u, 18 * u, 30 * u, 18 * u, 26 * u);
        vaso.cubicTo(18 * u, 22 * u, 8 * u, 18 * u, 8 * u, 10 * u);
        vaso.close();
        k.drawPath(vaso, pincel(suave, true, 2 * u));
        float y = 10 + 15 * p, m = 10 * (25 - y) / 15, q = (float) Math.sqrt(p);
        Path arriba = new Path();
        arriba.moveTo((20 - m) * u, y * u); arriba.lineTo((20 + m) * u, y * u); arriba.lineTo(20 * u, 25 * u); arriba.close();
        k.drawPath(arriba, pincel(arena, false, 0));
        Path abajo = new Path();
        abajo.moveTo((20 - 10 * q) * u, 44 * u); abajo.lineTo((20 + 10 * q) * u, 44 * u); abajo.lineTo(20 * u, (44 - 12 * q) * u); abajo.close();
        k.drawPath(abajo, pincel(arena, false, 0));
        /* El chorro no va aquí (0.7.214): dibujado en la imagen se quedaba
           quieto, también en pausa. Es una pieza animada encima, que solo se
           enseña mientras cae (`widget_chorro`, ver Pinta.pomodoro). */
        Paint tapa = pincel(suave, false, 0);
        k.drawRoundRect(new RectF(4 * u, 2 * u, 36 * u, 6.5f * u), 1.5f * u, 1.5f * u, tapa);
        k.drawRoundRect(new RectF(4 * u, 45.5f * u, 36 * u, 50 * u), 1.5f * u, 1.5f * u, tapa);
        return b;
    }

    /* ---------- La rueda del Pomodoro ----------
       Las 24 horas en círculo, con las 12 AM arriba y girando como un reloj: la
       misma de la app (js/09d-jornada.js). Cada bloque del día es un arco en su
       color; el que está en curso va entero y los demás un poco apagados; la
       aguja marca la hora. `conHoras` pone los números alrededor (solo cabe en
       la grande). Como es una imagen, la aguja avanza cuando el widget se
       repinta, no cada segundo. */
    static Bitmap rueda(Context c, float ladoDp, boolean conHoras, List<JSONObject> bloques, JSONObject enCurso, float hora,
                        int carril, int suave, int texto, int sobre) {
        int n = Math.round(dp(c, ladoDp));
        Bitmap b = lienzo(n, n);
        Canvas k = new Canvas(b);
        float V = conHoras ? 166 : 140, s = n / (2 * V), R = 124, r2 = 92, rm = 108;
        k.translate(n / 2f, n / 2f);
        k.scale(s, s);
        Paint punteado = pincel(carril, true, 1.5f);
        punteado.setPathEffect(new DashPathEffect(new float[] { 2, 5 }, 0));
        k.drawCircle(0, 0, R, punteado);
        k.drawCircle(0, 0, r2, punteado);
        Paint tx = pincel(suave, false, 0);
        tx.setTextAlign(Paint.Align.CENTER);
        String[] cuartos = { "12 AM", "6 AM", "12 PM", "6 PM" };
        for (int i = 0; i < 24; i += 2) {
            boolean mayor = i % 6 == 0;
            float g = mayor ? 7 : 3;
            double a = i / 12.0 * Math.PI;
            float sx = (float) Math.sin(a), cy = (float) -Math.cos(a);
            k.drawLine((R - g) * sx, (R - g) * cy, (R + g) * sx, (R + g) * cy, pincel(suave, true, mayor ? 3 : 1.5f));
            if (!conHoras) continue;
            tx.setColor(mayor ? texto : suave);
            tx.setTextSize(mayor ? 11.5f : 11f);
            tx.setTypeface(letra(c, mayor ? "outfit_bold" : "outfit_medium"));
            k.drawText(mayor ? cuartos[i / 6] : String.valueOf(i % 12), 147 * sx, 147 * cy + 4, tx);
        }
        RectF caja = new RectF(-rm, -rm, rm, rm);
        for (JSONObject o : bloques) {
            float a = o.optInt("a") / 60f, z = o.optInt("b") / 60f;
            float largo = ((z - a + 24) % 24) == 0 ? 24 : (z - a + 24) % 24;
            float pad = Math.min(.46f, largo / 2 - .02f);
            int tono = Widgets.tono(o.optString("c", null), "#9aa7b8");
            Paint arco = pincel(tono, true, 24);
            if (enCurso != null && enCurso != o) arco.setAlpha(140);
            k.drawArc(caja, (a + pad) / 24f * 360 - 90, Math.max(.5f, (largo - 2 * pad) / 24f * 360), false, arco);
            if (o.optBoolean("luna")) {
                double m = (a + largo / 2) / 12.0 * Math.PI;
                float x = (float) (rm * Math.sin(m)), y = (float) (-rm * Math.cos(m));
                k.drawCircle(x, y, 6.5f, pincel(sobre, false, 0));
                k.drawCircle(x + 3.4f, y - 2.6f, 5.6f, pincel(tono, false, 0));
            }
        }
        double h = hora / 12.0 * Math.PI;
        float hx = (float) Math.sin(h), hy = (float) -Math.cos(h);
        k.drawLine((r2 - 10) * hx, (r2 - 10) * hy, (R + 8) * hx, (R + 8) * hy, pincel(texto, true, 2.5f));
        k.drawCircle((R + 8) * hx, (R + 8) * hy, 4.5f, pincel(texto, false, 0));
        return b;
    }

    static int conAlfa(int color, int alfa) {
        return Color.argb(alfa, Color.red(color), Color.green(color), Color.blue(color));
    }
}
