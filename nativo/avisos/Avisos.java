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

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

/* Los avisos de Norata en la app de Android (0.7.163): las piezas que
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
    /* Los recordatorios de las misiones (0.7.213) van aparte de la alarma del
       Pomodoro: un recordatorio no es un despertador, y quien quiera callarlos
       tiene que poder hacerlo sin callar las actividades de su rueda. */
    static final String CANAL_MISIONES = "norata-misiones-v1";

    static final int ID_RELOJ = 7101;
    static final int ID_AVISO = 7102;
    static final int ID_AGENDA = 7103;

    static final String ACCION = "app.norata.avisos.ACCION";
    static final String FIN = "app.norata.avisos.FIN";
    static final String AGENDA = "app.norata.avisos.AGENDA";
    /* Vuelve a pintar el reloj: con una hora o más la cuenta va escrita en
       minutos y cambia al minuto (`programarRepinta`). */
    static final String REPINTA = "app.norata.avisos.REPINTA";

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
            case "min": return "{n} min";
            case "canalReloj": return "Pomodoro en curso";
            case "canalAvisos": return "Avisos del Pomodoro";
            case "canalAgenda": return "Inicio de actividad";
            case "canalMisiones": return "Recordatorios de misiones";
            case "cumplir": return "Ya la hice";
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

        NotificationChannel misiones = new NotificationChannel(CANAL_MISIONES, tx(c, "canalMisiones"), NotificationManager.IMPORTANCE_HIGH);
        misiones.enableVibration(true);
        misiones.setVibrationPattern(new long[] { 0, 180, 90, 180 });
        misiones.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(misiones);
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
        /* Un código por destino: con uno solo, el último aviso pisaba adónde
           llevaba el anterior (los extras no distinguen un PendingIntent), y
           tocar el del Pomodoro podía abrir Misiones (0.7.213). */
        int codigo = ir == null || "jornada".equals(ir) ? 7000 : 7001 + (ir.hashCode() & 0xff);
        return PendingIntent.getActivity(c, codigo, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
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
            desprogramar(c, pendiente(c, alReceptor(c, REPINTA, "reloj"), 2));
            guardar(c, "reloj", null);
            quitar(c, ID_RELOJ);
            avisarWidgets(c);
            return;
        }
        guardar(c, "reloj", e);
        pintarReloj(c, e);
        avisarWidgets(c);
        programarRepinta(c, e);
        long cuando = e.optLong("fin", 0);
        if (cuando > 0 && !e.optBoolean("pausado")) {
            Intent i = alReceptor(c, FIN, "reloj").putExtra("clave", e.optString("clave"));
            programar(c, cuando, pendiente(c, i, 1));
        }
    }

    /* ---------- Cuándo hay que volver a pintar la cuenta (0.7.214) ----------
       Por debajo de la hora la cuenta la lleva el cronómetro del sistema y no
       hay que tocar nada. Con una hora o más se escribe en minutos («87 min»,
       ver `cuenta`), y eso no se mueve solo: se repinta cada vez que cambia el
       minuto, y una vez más al cruzar la hora, que es cuando entra o sale el
       cronómetro.

       Con una alarma que NO despierta el teléfono: con la pantalla apagada
       nadie lo está leyendo, y al encenderla Android la entrega en el acto.
       Despertarlo cada minuto durante una Inmersión de tres horas, para pintar
       un número que nadie mira, sería gastar batería por nada. */
    static void programarRepinta(Context c, JSONObject e) {
        PendingIntent repinta = pendiente(c, alReceptor(c, REPINTA, "reloj"), 2);
        AlarmManager am = c.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(repinta);
        if (am == null || e == null || e.optBoolean("pausado")) return;
        long ya = System.currentTimeMillis(), fin = e.optLong("fin", 0), inicio = e.optLong("inicio", 0), en;
        if (fin > 0) {
            long resto = fin - ya;
            if (resto < HORA) return;                       // ya corre el cronómetro
            en = resto % 60000L == 0 ? (resto == HORA ? 1 : 60000L) : resto % 60000L;
        } else if (inicio > 0) {
            long lleva = ya - inicio;
            en = lleva < HORA ? HORA - lleva : 60000L - lleva % 60000L;
        } else return;
        long cuando = ya + en + 150;
        try {
            if (exactas(c)) am.setExact(AlarmManager.RTC, cuando, repinta);
            else am.set(AlarmManager.RTC, cuando, repinta);
        } catch (SecurityException x) {
            am.set(AlarmManager.RTC, cuando, repinta);
        }
    }

    /* Los widgets del Pomodoro (`nativo/widgets/`) enseñan este mismo reloj: cada
       vez que cambia, se les dice que se repinten. Por nombre y no por clase,
       para que un APK con los avisos y sin los widgets compile igual; sin
       ellos, este aviso no le llega a nadie. */
    static void avisarWidgets(Context c) {
        try {
            String n = Avisos.class.getName();
            Intent i = new Intent("norata.widgets.TIC");
            i.setClassName(c, n.substring(0, n.lastIndexOf('.')) + ".HoyWidget");
            c.sendBroadcast(i);
        } catch (Exception e) { /* sin widgets: no pasa nada */ }
    }

    static void pintarReloj(Context c, JSONObject e) {
        PendingIntent pPausa = pendiente(c, alReceptor(c, ACCION, "pausa").putExtra("accion", "pausa"), 10);
        PendingIntent pSeguir = pendiente(c, alReceptor(c, ACCION, "seguir").putExtra("accion", "seguir"), 11);
        PendingIntent pIniciar = e.optJSONObject("siguiente") == null ? null
                : pendiente(c, alReceptor(c, ACCION, "iniciar-reloj").putExtra("accion", "iniciar")
                        .putExtra("inicio", e.optJSONObject("siguiente").toString()), 12);
        Map<String, PendingIntent> acc = new HashMap<>();
        acc.put("pausa", pPausa);
        acc.put("seguir", pSeguir);
        if (pIniciar != null) acc.put("iniciar", pIniciar);
        acc.put("abrir", abrir(c, "jornada"));
        /* La vista que toca: corriendo o en pausa, que la página mandó las dos
           para que pausar con la app cerrada se vea bien. */
        JSONObject vistas = e.optJSONObject("vistas");
        JSONObject vista = vistas != null ? vistas.optJSONObject(e.optBoolean("pausado") ? "pausa" : "corre") : e.optJSONObject("vista");

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
            String resto = e.optLong("restante", 0) > 0 ? " · " + cuenta(c, e.optLong("restante"), false) : "";
            texto = tx(c, "enPausa") + resto + (texto.isEmpty() ? "" : " · " + texto);
        } else if (fin > 0 || inicio > 0) {
            b.setUsesChronometer(true);
            b.setShowWhen(true);
            b.setWhen(fin > 0 ? fin : inicio);
            if (fin > 0 && Build.VERSION.SDK_INT >= 24) b.setChronometerCountDown(true);
        }
        b.setContentText(texto);

        // Los botones salen del estado, no de la página: así se cambian solos
        // al pausar con la app cerrada.
        List<Notification.Action> botones = new ArrayList<>();
        if (pausado) botones.add(boton(c, tx(c, "seguir"), pSeguir));
        else if (e.optBoolean("pausable") && (fin > 0 || inicio > 0)) botones.add(boton(c, tx(c, "pausar"), pPausa));
        else if (pIniciar != null) botones.add(boton(c, tx(c, "iniciar"), pIniciar));
        if (vestir(c, b, vista, e, acc, false, botones)) {
            // Con molde, la cuenta va dentro, en grande: fuera sobraría.
            b.setUsesChronometer(false);
            b.setShowWhen(false);
        } else {
            /* El icono de la actividad solo en la plantilla de Android (un APK
               sin moldes). Con molde no va ninguno (0.7.214): Android lo ponía
               además a la derecha, y entre los dos se comían el ancho. */
            Bitmap ic = iconoGrande(e.optString("icono"));
            if (ic != null) b.setLargeIcon(ic);
            for (Notification.Action a : botones) b.addAction(a);
        }
        notificar(c, ID_RELOJ, b.build());
    }

    /* ---------- Los moldes (0.7.163) ----------
       Con moldes, los botones son los de Norata, dentro del aviso, y los de
       Android se quedan solo para el reloj de pulsera (WearableExtender): ahí
       el molde no se ve. Sin moldes (Android 6, o un APK a medias) devuelve
       false y el que llama pone la plantilla de siempre. */
    static boolean vestir(Context c, Notification.Builder b, JSONObject vista, JSONObject estado,
                          Map<String, PendingIntent> acciones, boolean alerta, List<Notification.Action> pulsera) {
        if (vista == null || Build.VERSION.SDK_INT < 24 || !AvisosVista.hayMoldes(c)) return false;
        try {
            b.setStyle(new Notification.DecoratedCustomViewStyle());
            b.setCustomContentView(AvisosVista.corto(c, vista, estado, acciones));
            b.setCustomBigContentView(AvisosVista.largo(c, vista, estado, acciones));
            if (alerta) b.setCustomHeadsUpContentView(AvisosVista.corto(c, vista, estado, acciones));
        } catch (RuntimeException e) {
            return false; // un molde que no cuadra con este APK: mejor la plantilla que nada
        }
        if (pulsera != null && !pulsera.isEmpty()) {
            Notification.WearableExtender w = new Notification.WearableExtender();
            for (Notification.Action a : pulsera) w.addAction(a);
            b.extend(w);
        }
        return true;
    }

    /** La vista sin los botones de una acción (Iniciar con un tramo ya corriendo). */
    static JSONObject sinAccion(JSONObject vista, String accion) {
        if (vista == null) return null;
        try {
            JSONObject v = new JSONObject(vista.toString());
            JSONObject k = v.optJSONObject("corto");
            if (k != null && k.optJSONObject("boton") != null && accion.equals(k.optJSONObject("boton").optString("accion"))) k.remove("boton");
            JSONObject l = v.optJSONObject("largo");
            JSONArray bs = l == null ? null : l.optJSONArray("botones");
            if (bs != null) {
                JSONArray n = new JSONArray();
                for (int i = 0; i < bs.length(); i++) if (!accion.equals(bs.optJSONObject(i).optString("accion"))) n.put(bs.optJSONObject(i));
                l.put("botones", n);
            }
            return v;
        } catch (JSONException e) {
            return vista;
        }
    }

    /* ---------- La cuenta: UNA forma de escribir el tiempo (0.7.214) ----------
       La regla es de la app y está contada en `jCuenta` (js/09d-jornada.js):
       con una hora o más, en minutos y sin segundos («87 min»); por debajo,
       «26:23» con dos cifras. Lo que falta se redondea hacia arriba y lo que
       se lleva (`sube`) hacia abajo. Es la misma de `Widgets.cuenta`
       (nativo/widgets/): al tocar una, las tres.

       Antes aquí salía «1:26:23», que es como escribe el cronómetro del
       sistema, mientras la app decía «86:23» y el widget «87 min». Por eso el
       cronómetro ya solo se usa por debajo de la hora (`AvisosVista`). */
    static final long HORA = 3600000L;

    static String cuenta(Context c, long ms, boolean sube) {
        ms = Math.max(0, ms);
        if (ms >= HORA) return tx(c, "min").replace("{n}", String.valueOf(sube ? ms / 60000L : (ms + 59999L) / 60000L));
        long s = sube ? ms / 1000L : (ms + 999L) / 1000L;
        return String.format(java.util.Locale.ROOT, "%02d:%02d", s / 60, s % 60);
    }

    /* ---------- Un aviso suelto ---------- */
    static void avisar(Context c, String titulo, String texto, String icono, String ir) {
        avisar(c, titulo, texto, icono, ir, null);
    }

    static void avisar(Context c, String titulo, String texto, String icono, String ir, JSONObject vista) {
        Notification.Builder b = constructor(c, CANAL_AVISOS)
                .setContentTitle(titulo)
                .setContentText(texto)
                .setStyle(new Notification.BigTextStyle().bigText(texto))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setContentIntent(abrir(c, ir));
        Bitmap ic = iconoGrande(icono);
        Map<String, PendingIntent> acc = new HashMap<>();
        acc.put("abrir", abrir(c, ir));
        JSONObject conIcono = new JSONObject();
        try { conIcono.put("icono", icono == null ? "" : icono); } catch (JSONException x) { /* sin icono */ }
        if (!vestir(c, b, vista, conIcono, acc, true, null) && ic != null) b.setLargeIcon(ic);
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

    /* Las misiones (0.7.213) traen dos cosas que la rueda no necesitaba:
         - `desde`: no sonar antes de esta hora. Es el «si ya la cumpliste, no
           suena»: cumplida hoy, la página la manda con `desde` en mañana.
         - `fecha` (AAAA-MM-DD): una sola vez, ese día. Es la de cada mes; la
           página manda la del mes siguiente en cuanto esta pasa o se cumple.
       Devuelve -1 si ya no toca. */
    static long cuandoToca(Context c, JSONObject e, long desde) {
        long piso = Math.max(desde, e.optLong("desde", 0));
        String f = e.optString("fecha", "");
        int minuto = e.optInt("min");
        if (f.length() == 10) {
            try {
                Calendar k = Calendar.getInstance(zona(c));
                k.clear();
                k.set(Integer.parseInt(f.substring(0, 4)), Integer.parseInt(f.substring(5, 7)) - 1,
                        Integer.parseInt(f.substring(8, 10)), minuto / 60, minuto % 60, 0);
                return k.getTimeInMillis() > piso ? k.getTimeInMillis() : -1;
            } catch (NumberFormatException x) {
                return -1;
            }
        }
        return proxima(c, e.optInt("dia"), minuto, piso);
    }

    static void programarEntrada(Context c, JSONObject e) {
        long cuando = cuandoToca(c, e, System.currentTimeMillis() + 30000);
        if (cuando > 0) programar(c, cuando, alarmaDe(c, e.optString("id"), false));
    }

    static boolean esMision(JSONObject e) { return e != null && "mision".equals(e.optString("tipo")); }

    /* Cada misión con su propio aviso: con un solo número, el recordatorio de
       beber agua tapaba el de llamar a mamá si coincidían. */
    static int idDe(JSONObject e) {
        return esMision(e) ? 7200 + (e.optString("mision").hashCode() & 0x3ff) : ID_AGENDA;
    }

    /* El recordatorio de una misión: su canal, abre Misiones, y dos botones —
       «Ya la hice» (se apunta y la página la marca al abrir, con esta hora) y
       «En 5 min»—. Su molde lo escribe la página como el de todos. */
    static void avisarMision(Context c, JSONObject e) {
        String id = e.optString("id");
        String ir = e.optString("ir", "missions");
        Notification.Builder b = constructor(c, CANAL_MISIONES)
                .setContentTitle(e.optString("titulo"))
                .setContentText(e.optString("texto"))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setContentIntent(abrir(c, ir));
        if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(3 * 60 * 60 * 1000L);
        Map<String, PendingIntent> acc = new HashMap<>();
        acc.put("abrir", abrir(c, ir));
        List<Notification.Action> botones = new ArrayList<>();
        Intent i = alReceptor(c, ACCION, "cumplir/" + id).putExtra("accion", "cumplir")
                .putExtra("entrada", id).putExtra("mision", e.optString("mision"));
        PendingIntent pi = pendiente(c, i, 22);
        acc.put("cumplir", pi);
        botones.add(boton(c, tx(c, "cumplir"), pi));
        if (e.optBoolean("posponible", true)) {
            Intent p = alReceptor(c, ACCION, "posponer/" + id).putExtra("accion", "posponer").putExtra("entrada", id);
            PendingIntent pp = pendiente(c, p, 21);
            acc.put("posponer", pp);
            botones.add(boton(c, tx(c, "posponer"), pp));
        }
        if (!vestir(c, b, e.optJSONObject("vista"), e, acc, true, botones)) {
            Bitmap ic = iconoGrande(e.optString("icono"));
            if (ic != null) b.setLargeIcon(ic);
            for (Notification.Action a : botones) b.addAction(a);
        }
        notificar(c, idDe(e), b.build());
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
        if (esMision(e)) { avisarMision(c, e); return; }
        String id = e.optString("id");
        Notification.Builder b = constructor(c, CANAL_AGENDA)
                .setContentTitle(e.optString("titulo"))
                .setContentText(e.optString("texto"))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_ALARM)
                .setContentIntent(abrir(c, "jornada"));
        if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(60 * 60 * 1000L);
        Bitmap ic = iconoGrande(e.optString("icono"));
        Map<String, PendingIntent> acc = new HashMap<>();
        acc.put("abrir", abrir(c, "jornada"));
        List<Notification.Action> botones = new ArrayList<>();

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
            PendingIntent pi = pendiente(c, i, 20);
            acc.put("iniciar", pi);
            botones.add(boton(c, tx(c, "iniciar"), pi));
        }
        if (e.optBoolean("posponible", true)) {
            Intent i = alReceptor(c, ACCION, "posponer/" + id).putExtra("accion", "posponer").putExtra("entrada", id);
            PendingIntent pi = pendiente(c, i, 21);
            acc.put("posponer", pi);
            botones.add(boton(c, tx(c, "posponer"), pi));
        }
        JSONObject vista = e.optJSONObject("vista");
        if (corriendo) vista = sinAccion(vista, "iniciar");
        if (!vestir(c, b, vista, e, acc, true, botones)) {
            if (ic != null) b.setLargeIcon(ic);
            for (Notification.Action a : botones) b.addAction(a);
        }
        notificar(c, ID_AGENDA, b.build());
    }
}
