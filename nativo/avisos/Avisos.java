// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
// Lo pone ahí `instalar-avisos.js`; el porqué de todo, en LEEME.md.
package app.norata;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.TimeZone;

/* Los avisos de Norata en la app de Android (0.7.161): las piezas que
   comparten el complemento (`AvisosPlugin`, lo que habla con la página) y el
   receptor (`AvisosReceptor`, lo que contesta a los botones y a las alarmas).

   **Por qué hace falta esto y no basta la página.** El Pomodoro avisaba con la
   API `Notification` del navegador, y el WebView de Android no la trae: en el
   APK los avisos de fuera de la app no salían nunca. Y aunque la trajera, una
   página dormida no puede sonar a una hora: eso lo hace el sistema
   (`AlarmManager`), y es lo único que suena con la app cerrada.

   **La regla que lo ordena todo: la página DECIDE y esto PINTA.** Los textos,
   los colores, los iconos y lo que pasa después de una fase salen de
   `js/09d-jornada.js`, que es lo que se actualiza solo con cada versión. Lo
   nativo solo se reinstala con un APK nuevo, así que aquí no se decide nada
   que pueda querer cambiarse: se guarda lo que la página manda y se enseña.

   La única excepción es lo que tiene que pasar con la app cerrada —pausar,
   seguir, iniciar desde el aviso—, y aun eso se APUNTA en una cola que la
   página repasa al abrir (`pendientes`), con la hora de cada toque. El estado
   de verdad sigue siendo el de la página; esto solo adelanta lo que se ve. */
final class Avisos {

    private Avisos() {}

    static final String PREFS = "norata-avisos";

    /* Tres canales, porque cada uno es una decisión distinta de la persona en
       los ajustes del sistema: el reloj en curso no suena nunca, el final de
       una fase sí, y el inicio de una actividad es una alarma. Los ids llevan
       versión porque un canal ya creado NO cambia de sonido ni de importancia:
       para cambiar eso hay que estrenar otro id. */
    static final String CANAL_RELOJ = "norata-reloj-v1";
    static final String CANAL_AVISOS = "norata-avisos-v1";
    static final String CANAL_AGENDA = "norata-agenda-v1";

    static final int ID_RELOJ = 7101;
    static final int ID_AVISO = 7102;
    static final int ID_AGENDA = 7103;

    static final String ACCION = "app.norata.avisos.ACCION";
    static final String FIN = "app.norata.avisos.FIN";
    static final String AGENDA = "app.norata.avisos.AGENDA";

    /* Quién está vivo. Los pone el complemento: con la app a la vista, el
       final de una fase lo dice la página (campana y aviso dentro) y aquí no
       se repite. */
    static volatile AvisosPlugin instancia;
    static volatile boolean enPrimerPlano;

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static JSONObject leer(Context c, String llave) {
        String s = prefs(c).getString(llave, null);
        if (s == null) return null;
        try { return new JSONObject(s); } catch (JSONException e) { return null; }
    }

    static JSONArray leerLista(Context c, String llave) {
        String s = prefs(c).getString(llave, null);
        if (s == null) return new JSONArray();
        try { return new JSONArray(s); } catch (JSONException e) { return new JSONArray(); }
    }

    static void guardar(Context c, String llave, Object valor) {
        SharedPreferences.Editor ed = prefs(c).edit();
        if (valor == null) ed.remove(llave); else ed.putString(llave, valor.toString());
        ed.apply();
    }

    /* ---------- Los textos ----------
       Llegan de la página en el idioma de la app (`configurar`). Los de aquí
       son solo el suelo para un aviso que salte antes de la primera apertura
       después de instalar, que no debería pasar. */
    static String tx(Context c, String llave) {
        JSONObject t = leer(c, "textos");
        String v = t == null ? null : t.optString(llave, null);
        if (v != null && !v.isEmpty()) return v;
        switch (llave) {
            case "canalReloj": return "Pomodoro en curso";
            case "canalAvisos": return "Avisos del Pomodoro";
            case "canalAgenda": return "Inicio de actividad";
            case "pausar": return "Pausar";
            case "seguir": return "Seguir";
            case "iniciar": return "Iniciar";
            case "posponer": return "En 5 min";
            case "enPausa": return "En pausa";
            default: return llave;
        }
    }

    /* El de la casa, en su tono MACIZO: se lee igual sobre la cortina clara y
       sobre la oscura. La marca fuera de la app no cambia con el mundo. */
    static int color(Context c) {
        return prefs(c).getInt("color", Color.parseColor("#00cc7f"));
    }

    /* El isotipo en blanco, que es lo único que Android deja en la barra de
       arriba. Se busca por nombre y no con `R.drawable`: si el paquete del
       código no es el de la app, `R` no existe con ese nombre y no compila. */
    static int iconoChico(Context c) {
        int id = c.getResources().getIdentifier("aviso_norata", "drawable", c.getPackageName());
        return id != 0 ? id : c.getApplicationInfo().icon;
    }

    static Bitmap iconoGrande(String base64) {
        if (base64 == null || base64.isEmpty()) return null;
        try {
            int coma = base64.indexOf(',');
            byte[] b = Base64.decode(coma >= 0 ? base64.substring(coma + 1) : base64, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(b, 0, b.length);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /* ---------- Los canales ---------- */
    static void canales(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel reloj = new NotificationChannel(CANAL_RELOJ, tx(c, "canalReloj"), NotificationManager.IMPORTANCE_LOW);
        reloj.setShowBadge(false);
        reloj.setSound(null, null);
        reloj.enableVibration(false);
        nm.createNotificationChannel(reloj);

        NotificationChannel avisos = new NotificationChannel(CANAL_AVISOS, tx(c, "canalAvisos"), NotificationManager.IMPORTANCE_HIGH);
        avisos.enableVibration(true);
        avisos.setVibrationPattern(new long[] { 0, 180, 90, 180 });
        nm.createNotificationChannel(avisos);

        /* El inicio de una actividad es una ALARMA: suena por el volumen de las
           alarmas (que el modo silencio no apaga) y con el tono que cada quien
           tiene para despertarse. Suena una vez, no en bucle: es un aviso con
           botón para empezar, no un despertador que hay que apagar. Se cambia
           en los ajustes del sistema, en este canal. */
        NotificationChannel agenda = new NotificationChannel(CANAL_AGENDA, tx(c, "canalAgenda"), NotificationManager.IMPORTANCE_HIGH);
        Uri tono = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (tono == null) tono = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        agenda.setSound(tono, new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
        agenda.enableVibration(true);
        agenda.setVibrationPattern(new long[] { 0, 400, 200, 400, 200, 400 });
        agenda.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(agenda);
    }

    @SuppressWarnings("deprecation")
    static Notification.Builder constructor(Context c, String canal) {
        canales(c);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, canal) : new Notification.Builder(c);
        b.setSmallIcon(iconoChico(c));
        b.setColor(color(c));
        b.setVisibility(Notification.VISIBILITY_PUBLIC);
        if (Build.VERSION.SDK_INT < 26) {
            // Antes de los canales, la importancia va en cada aviso.
            b.setPriority(CANAL_RELOJ.equals(canal) ? Notification.PRIORITY_LOW : Notification.PRIORITY_HIGH);
            if (!CANAL_RELOJ.equals(canal)) b.setDefaults(Notification.DEFAULT_ALL);
        }
        return b;
    }

    static void notificar(Context c, int id, Notification n) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        try { nm.notify(id, n); } catch (SecurityException e) { /* sin permiso: no hay a quién decírselo */ }
    }

    static void quitar(Context c, int id) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm != null) nm.cancel(id);
    }

    /* ---------- Lo que abre y lo que contesta ---------- */

    /* Tocar el aviso abre la app EN el Pomodoro. `norataIr` lo lee el
       complemento al arrancar o, con la app ya abierta, en `handleOnNewIntent`
       (MainActivity es `singleTask`, así que no se abre otra encima). */
    static PendingIntent abrir(Context c, String ir) {
        Intent i = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (i == null) i = new Intent(Intent.ACTION_MAIN).setPackage(c.getPackageName());
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        i.putExtra("norataIr", ir == null ? "jornada" : ir);
        return PendingIntent.getActivity(c, 7000, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /* Un botón o una alarma que llega al receptor. La dirección (`setData`) es
       lo que hace distintos dos `PendingIntent` del mismo receptor: Android los
       compara SIN los extras, y sin ella el botón de pausar de un aviso pisaba
       al de iniciar de otro. */
    static Intent alReceptor(Context c, String accion, String clave) {
        return new Intent(c, AvisosReceptor.class)
                .setAction(accion)
                .setData(Uri.parse("norata-avisos://" + accion + "/" + Uri.encode(clave)));
    }

    static PendingIntent pendiente(Context c, Intent i, int codigo) {
        return PendingIntent.getBroadcast(c, codigo, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static Notification.Action boton(Context c, String rotulo, PendingIntent pi) {
        Icon ic = Icon.createWithResource(c, iconoChico(c));
        return new Notification.Action.Builder(ic, rotulo, pi).build();
    }

    /* ---------- Las alarmas ----------
       Exactas si la persona lo permitió (`SCHEDULE_EXACT_ALARM`, que desde
       Android 14 nace apagado); si no, las del sistema, que pueden llegar
       unos minutos tarde con el teléfono dormido. Las dos despiertan al
       teléfono: «while idle». La página pregunta y ofrece el permiso
       (`permisos`, `pedirExactas`). */
    static boolean exactas(Context c) {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = c.getSystemService(AlarmManager.class);
        return am != null && am.canScheduleExactAlarms();
    }

    static void programar(Context c, long cuando, PendingIntent pi) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        if (am == null) return;
        try {
            if (exactas(c)) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cuando, pi);
        }
    }

    static void desprogramar(Context c, PendingIntent pi) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(pi);
        pi.cancel();
    }

    /* ---------- Cada aviso se dice UNA vez ----------
       El final de una fase lo pueden decir dos: la alarma de aquí y la página,
       si estaba viva de fondo y llegó antes. Los dos pasan por aquí con la
       misma clave —la de `jFinFase`, `fid|fase`— y el segundo se calla. */
    static synchronized boolean primeraVez(Context c, String clave) {
        if (clave == null || clave.isEmpty()) return true;
        JSONArray l = leerLista(c, "claves");
        for (int i = 0; i < l.length(); i++) if (clave.equals(l.optString(i))) return false;
        JSONArray n = new JSONArray();
        int desde = Math.max(0, l.length() - 29);
        for (int i = desde; i < l.length(); i++) n.put(l.optString(i));
        n.put(clave);
        guardar(c, "claves", n);
        return true;
    }

    /* ---------- La cola de lo que se tocó con la app cerrada ---------- */
    static synchronized void encolar(Context c, JSONObject ev) {
        JSONArray l = leerLista(c, "cola");
        l.put(ev);
        JSONArray n = new JSONArray();
        for (int i = Math.max(0, l.length() - 50); i < l.length(); i++) n.put(l.opt(i));
        guardar(c, "cola", n);
        AvisosPlugin p = instancia;
        if (p != null) p.hayAcciones();
    }

    static synchronized JSONArray vaciarCola(Context c) {
        JSONArray l = leerLista(c, "cola");
        guardar(c, "cola", null);
        return l;
    }

    /* ---------- El reloj en curso ----------
       Un aviso fijo con la cuenta atrás. La cuenta la lleva el SISTEMA
       (`setUsesChronometer`), no un proceso nuestro: así no hace falta un
       servicio en primer plano ni despertar al teléfono cada segundo, y la
       cuenta sigue aunque Android cierre la app. Lo que sí hace falta es la
       alarma del final, que es lo que suena. */
    static JSONObject reloj(Context c) { return leer(c, "reloj"); }

    static void ponerReloj(Context c, JSONObject e) {
        PendingIntent fin = pendiente(c, alReceptor(c, FIN, "reloj"), 1);
        desprogramar(c, fin);
        if (e == null) {
            guardar(c, "reloj", null);
            quitar(c, ID_RELOJ);
            return;
        }
        guardar(c, "reloj", e);
        pintarReloj(c, e);
        long cuando = e.optLong("fin", 0);
        if (cuando > 0 && !e.optBoolean("pausado")) {
            Intent i = alReceptor(c, FIN, "reloj").putExtra("clave", e.optString("clave"));
            programar(c, cuando, pendiente(c, i, 1));
        }
    }

    static void pintarReloj(Context c, JSONObject e) {
        Notification.Builder b = constructor(c, CANAL_RELOJ)
                .setContentTitle(e.optString("titulo"))
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(Notification.CATEGORY_PROGRESS)
                .setContentIntent(abrir(c, "jornada"))
                .setShowWhen(false);
        String texto = e.optString("texto");
        long fin = e.optLong("fin", 0), inicio = e.optLong("inicio", 0);
        boolean pausado = e.optBoolean("pausado");
        if (pausado) {
            String resto = e.optLong("restante", 0) > 0 ? " · " + mmss(e.optLong("restante")) : "";
            texto = tx(c, "enPausa") + resto + (texto.isEmpty() ? "" : " · " + texto);
        } else if (fin > 0 || inicio > 0) {
            b.setUsesChronometer(true);
            b.setShowWhen(true);
            b.setWhen(fin > 0 ? fin : inicio);
            if (fin > 0 && Build.VERSION.SDK_INT >= 24) b.setChronometerCountDown(true);
        }
        b.setContentText(texto);
        Bitmap ic = iconoGrande(e.optString("icono"));
        if (ic != null) b.setLargeIcon(ic);

        // Los botones salen del estado, no de la página: así se cambian solos
        // al pausar con la app cerrada.
        if (pausado) {
            b.addAction(boton(c, tx(c, "seguir"), pendiente(c, alReceptor(c, ACCION, "seguir").putExtra("accion", "seguir"), 11)));
        } else if (e.optBoolean("pausable") && (fin > 0 || inicio > 0)) {
            b.addAction(boton(c, tx(c, "pausar"), pendiente(c, alReceptor(c, ACCION, "pausa").putExtra("accion", "pausa"), 10)));
        } else if (e.optJSONObject("siguiente") != null) {
            Intent i = alReceptor(c, ACCION, "iniciar-reloj").putExtra("accion", "iniciar")
                    .putExtra("inicio", e.optJSONObject("siguiente").toString());
            b.addAction(boton(c, tx(c, "iniciar"), pendiente(c, i, 12)));
        }
        notificar(c, ID_RELOJ, b.build());
    }

    static String mmss(long ms) {
        long s = Math.max(0, ms / 1000);
        long h = s / 3600, m = (s % 3600) / 60, ss = s % 60;
        return h > 0 ? String.format(java.util.Locale.ROOT, "%d:%02d:%02d", h, m, ss)
                : String.format(java.util.Locale.ROOT, "%d:%02d", m, ss);
    }

    /* ---------- Un aviso suelto ---------- */
    static void avisar(Context c, String titulo, String texto, String icono, String ir) {
        Notification.Builder b = constructor(c, CANAL_AVISOS)
                .setContentTitle(titulo)
                .setContentText(texto)
                .setStyle(new Notification.BigTextStyle().bigText(texto))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setContentIntent(abrir(c, ir));
        Bitmap ic = iconoGrande(icono);
        if (ic != null) b.setLargeIcon(ic);
        notificar(c, ID_AVISO, b.build());
    }

    /* ---------- La agenda: el inicio de cada actividad ----------
       La rueda se repite cada semana, así que cada entrada es «este día de la
       semana a esta hora» y se vuelve a programar sola para la semana
       siguiente al sonar. Sin eso, quien no abriera la app en unos días se
       quedaría sin alarmas justo cuando más falta le hacen. */
    static JSONArray agenda(Context c) { return leerLista(c, "agenda"); }

    static JSONObject entrada(Context c, String id) {
        JSONArray l = agenda(c);
        for (int i = 0; i < l.length(); i++) {
            JSONObject e = l.optJSONObject(i);
            if (e != null && id.equals(e.optString("id"))) return e;
        }
        return null;
    }

    /* Dos alarmas por entrada: la de cada semana y la de «En 5 min». */
    static PendingIntent alarmaDe(Context c, String id, boolean unaVez) {
        Intent i = alReceptor(c, AGENDA, (unaVez ? "pospuesta/" : "semana/") + id)
                .putExtra("entrada", id).putExtra("unaVez", unaVez);
        return pendiente(c, i, (unaVez ? 0x20000000 : 0x10000000) ^ (id.hashCode() & 0x0fffffff));
    }

    static TimeZone zona(Context c) {
        String z = prefs(c).getString("zona", null);
        return z == null ? TimeZone.getDefault() : TimeZone.getTimeZone(z);
    }

    /* La próxima vez que toca, contando desde ahora. `dia` va como
       `Date.getDay()` de JavaScript (0 es domingo) y la hora en la zona del
       perfil, que es la misma con la que se dibuja la rueda. */
    static long proxima(Context c, int dia, int minuto, long desde) {
        Calendar k = Calendar.getInstance(zona(c));
        k.setTimeInMillis(desde);
        k.set(Calendar.HOUR_OF_DAY, minuto / 60);
        k.set(Calendar.MINUTE, minuto % 60);
        k.set(Calendar.SECOND, 0);
        k.set(Calendar.MILLISECOND, 0);
        for (int i = 0; i < 8; i++) {
            if (k.get(Calendar.DAY_OF_WEEK) - 1 == dia && k.getTimeInMillis() > desde) return k.getTimeInMillis();
            k.add(Calendar.DAY_OF_MONTH, 1);
        }
        return k.getTimeInMillis();
    }

    static void programarEntrada(Context c, JSONObject e) {
        long cuando = proxima(c, e.optInt("dia"), e.optInt("min"), System.currentTimeMillis() + 30000);
        programar(c, cuando, alarmaDe(c, e.optString("id"), false));
    }

    static void ponerAgenda(Context c, JSONArray nueva) {
        JSONArray vieja = agenda(c);
        for (int i = 0; i < vieja.length(); i++) {
            JSONObject e = vieja.optJSONObject(i);
            if (e == null) continue;
            desprogramar(c, alarmaDe(c, e.optString("id"), false));
            desprogramar(c, alarmaDe(c, e.optString("id"), true));
        }
        guardar(c, "agenda", nueva);
        reprogramarAgenda(c);
    }

    static void reprogramarAgenda(Context c) {
        JSONArray l = agenda(c);
        for (int i = 0; i < l.length(); i++) {
            JSONObject e = l.optJSONObject(i);
            if (e != null) programarEntrada(c, e);
        }
    }

    static void avisarEntrada(Context c, JSONObject e) {
        String id = e.optString("id");
        Notification.Builder b = constructor(c, CANAL_AGENDA)
                .setContentTitle(e.optString("titulo"))
                .setContentText(e.optString("texto"))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_ALARM)
                .setContentIntent(abrir(c, "jornada"));
        if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(60 * 60 * 1000L);
        Bitmap ic = iconoGrande(e.optString("icono"));
        if (ic != null) b.setLargeIcon(ic);

        // Iniciar solo si no hay ya un tramo corriendo: con uno en marcha,
        // el botón empezaría otro encima.
        JSONObject r = reloj(c);
        boolean corriendo = r != null && (r.optLong("fin", 0) > 0 || r.optLong("inicio", 0) > 0 || r.optBoolean("pausado"));
        JSONObject ini = e.optJSONObject("iniciar");
        if (ini != null && !corriendo) {
            // El icono va una vez por entrada y no repetido dentro de `iniciar`.
            if (ini.optString("icono", "").isEmpty()) {
                try { ini.put("icono", e.optString("icono")); } catch (JSONException x) { /* sin icono */ }
            }
            Intent i = alReceptor(c, ACCION, "iniciar/" + id).putExtra("accion", "iniciar")
                    .putExtra("inicio", ini.toString()).putExtra("entrada", id);
            b.addAction(boton(c, tx(c, "iniciar"), pendiente(c, i, 20)));
        }
        if (e.optBoolean("posponible", true)) {
            Intent i = alReceptor(c, ACCION, "posponer/" + id).putExtra("accion", "posponer").putExtra("entrada", id);
            b.addAction(boton(c, tx(c, "posponer"), pendiente(c, i, 21)));
        }
        notificar(c, ID_AGENDA, b.build());
    }
}
