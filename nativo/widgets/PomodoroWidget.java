// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

/* Pomodoro (2×2 a 4×4): crece hasta la rueda entera. Ver `Pinta.pomodoro`. */
public class PomodoroWidget extends WidgetNorata {
    @Override
    RemoteViews vista(Context c, AppWidgetManager m, int widget) { return Pinta.pomodoro(c, m, widget); }
}
