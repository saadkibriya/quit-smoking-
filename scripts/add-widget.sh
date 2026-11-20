#!/usr/bin/env bash
set -euo pipefail

APP_ID=$(node -e "console.log(require('./capacitor.config.json').appId)")
MAIN=android/app/src/main
PKG_DIR="$MAIN/java/$(echo "$APP_ID" | tr . /)"

mkdir -p "$PKG_DIR" "$MAIN/res/layout" "$MAIN/res/xml" "$MAIN/res/drawable" "$MAIN/res/values"

cat > "$PKG_DIR/QuitWidgetProvider.java" <<'EOF'
package __APP_ID__;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.util.Locale;

/**
 * Home-screen widget. Values are pushed by the web app through
 * @capacitor/preferences, which stores them in the "CapacitorStorage"
 * SharedPreferences file under their raw keys.
 *
 * The widget used to only rebuild itself when it was first added and on the
 * 30-minute system tick, so it sat on its placeholder text after the app wrote
 * fresh values. MainActivity now rebuilds it on open, resume and leave, and the
 * refresh action below lets anything else force an update.
 */
public class QuitWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_REFRESH = "com.unlit.app.REFRESH_WIDGET";
    private static final String PREFS = "CapacitorStorage";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        updateAll(context, manager, ids);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, android.os.Bundle options) {
        updateAll(context, manager, new int[] { id });
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && ACTION_REFRESH.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            updateAll(context, manager, manager.getAppWidgetIds(new ComponentName(context, QuitWidgetProvider.class)));
        }
    }

    /** Rebuilds every placed widget. Safe to call when none are placed. */
    public static void refresh(Context context) {
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, QuitWidgetProvider.class));
            updateAll(context, manager, ids);
        } catch (Throwable ignored) {
            // Never let a widget failure break the activity that called us.
        }
    }

    private static void updateAll(Context context, AppWidgetManager manager, int[] ids) {
        if (ids == null) return;
        for (int id : ids) {
            try {
                manager.updateAppWidget(id, build(context));
            } catch (Throwable ignored) {
                // Skip this instance, keep the others alive.
            }
        }
    }

    static RemoteViews build(Context context) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_quit);

        long quit = 0L;
        double perDay = 0;
        double packSize = 20;
        double packCost = 0;
        String cur = "\u09F3";

        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            quit = parseLong(sp.getString("unlit_quit_date", ""), 0L);
            perDay = parseDouble(sp.getString("unlit_cigs_per_day", ""), 0);
            packSize = parseDouble(sp.getString("unlit_pack_size", ""), 20);
            packCost = parseDouble(sp.getString("unlit_pack_cost", ""), 0);
            cur = sp.getString("unlit_currency", "\u09F3");
        } catch (Throwable ignored) {
            // Unreadable prefs: fall through to the setup state below.
        }

        if (quit <= 0L) {
            v.setTextViewText(R.id.days, "\u2013\u2013");
            v.setTextViewText(R.id.label, "OPEN UNLIT TO SET UP");
            v.setTextViewText(R.id.avoided, "\u2013");
            v.setTextViewText(R.id.saved, "\u2013");
        } else {
            long now = System.currentTimeMillis();
            long elapsed = Math.max(0L, now - quit);
            double daysExact = elapsed / 86400000.0;
            long days = (long) Math.floor(daysExact);
            long hours = (long) Math.floor((elapsed % 86400000L) / 3600000.0);

            long avoided = (long) Math.floor(daysExact * perDay);
            double saved = packSize > 0 ? (avoided / packSize) * packCost : 0;

            // Under a day the widget is more useful showing hours than "0".
            if (days < 1) {
                v.setTextViewText(R.id.days, hours + "h");
                v.setTextViewText(R.id.label, "SMOKE-FREE SO FAR");
            } else {
                v.setTextViewText(R.id.days, String.valueOf(days));
                v.setTextViewText(R.id.label, days == 1 ? "DAY SMOKE-FREE" : "DAYS SMOKE-FREE");
            }
            v.setTextViewText(R.id.avoided, String.valueOf(avoided));
            v.setTextViewText(R.id.saved, cur + String.format(Locale.US, "%,.0f", saved));
        }

        try {
            Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launch != null) {
                PendingIntent pi = PendingIntent.getActivity(
                    context, 0, launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                v.setOnClickPendingIntent(R.id.widget_root, pi);
            }
        } catch (Throwable ignored) {
            // Tapping does nothing rather than crashing the launcher.
        }

        return v;
    }

    private static long parseLong(String s, long fallback) {
        if (s == null) return fallback;
        try { return Long.parseLong(s.trim()); } catch (Exception e) { return fallback; }
    }

    private static double parseDouble(String s, double fallback) {
        if (s == null) return fallback;
        try { return Double.parseDouble(s.trim()); } catch (Exception e) { return fallback; }
    }
}
EOF
sed -i "s/__APP_ID__/$APP_ID/g" "$PKG_DIR/QuitWidgetProvider.java"

cat > "$MAIN/res/layout/widget_quit.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="@drawable/widget_bg">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="UNLIT"
        android:textColor="#D71921"
        android:textSize="11sp"
        android:letterSpacing="0.25"
        android:fontFamily="monospace" />

    <TextView
        android:id="@+id/days"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="--"
        android:textColor="#FFFFFF"
        android:textSize="44sp"
        android:textStyle="bold"
        android:fontFamily="monospace"
        android:includeFontPadding="false"
        android:maxLines="1"
        android:ellipsize="end" />

    <TextView
        android:id="@+id/label"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="DAYS SMOKE-FREE"
        android:textColor="#8A8A8A"
        android:textSize="10sp"
        android:letterSpacing="0.15"
        android:fontFamily="monospace" />

    <View
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal">

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:orientation="vertical">
            <TextView
                android:id="@+id/avoided"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="-"
                android:textColor="#FFFFFF"
                android:textSize="14sp"
                android:textStyle="bold"
                android:fontFamily="monospace"
                android:maxLines="1"
                android:ellipsize="end" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="NOT SMOKED"
                android:textColor="#8A8A8A"
                android:textSize="9sp"
                android:fontFamily="monospace" />
        </LinearLayout>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:orientation="vertical">
            <TextView
                android:id="@+id/saved"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="-"
                android:textColor="#FFFFFF"
                android:textSize="14sp"
                android:textStyle="bold"
                android:fontFamily="monospace"
                android:maxLines="1"
                android:ellipsize="end" />
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="SAVED"
                android:textColor="#8A8A8A"
                android:textSize="9sp"
                android:fontFamily="monospace" />
        </LinearLayout>
    </LinearLayout>
</LinearLayout>
EOF

cat > "$MAIN/res/drawable/widget_bg.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#000000" />
    <stroke android:width="1dp" android:color="#2A2A2A" />
    <corners android:radius="28dp" />
</shape>
EOF

cat > "$MAIN/res/xml/quit_widget_info.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:targetCellWidth="2"
    android:targetCellHeight="2"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_quit"
    android:previewLayout="@layout/widget_quit"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:description="@string/widget_description" />
EOF

cat > "$MAIN/res/values/widget_strings.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="widget_name">Unlit streak</string>
    <string name="widget_description">Smoke-free days, cigarettes avoided and money saved</string>
</resources>
EOF

# The activity is the only reliable moment to refresh the widget after the web
# layer writes new values: onCreate for a cold start, onResume when coming back
# from the launcher, and onPause right after the user logs something.
cat > "$PKG_DIR/MainActivity.java" <<'EOF'
package __APP_ID__;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        QuitWidgetProvider.refresh(this);
        // The web layer writes its values a moment later, so refresh once more
        // after the first paint instead of waiting for the user to leave.
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(
            () -> QuitWidgetProvider.refresh(this), 2500L);
    }

    @Override
    public void onResume() {
        super.onResume();
        QuitWidgetProvider.refresh(this);
    }

    @Override
    public void onPause() {
        QuitWidgetProvider.refresh(this);
        super.onPause();
    }
}
EOF
sed -i "s/__APP_ID__/$APP_ID/g" "$PKG_DIR/MainActivity.java"

MANIFEST="$MAIN/AndroidManifest.xml"
if ! grep -q "QuitWidgetProvider" "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name=".QuitWidgetProvider" android:exported="true" android:label="@string/widget_name">\n            <intent-filter>\n                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />\n            </intent-filter>\n            <meta-data android:name="android.appwidget.provider" android:resource="@xml/quit_widget_info" />\n        </receiver>\n    </application>#' "$MANIFEST"
fi

# Ensure the label is applied even when the receiver was injected by an older
# version of this script (the block above only runs for a fresh manifest).
sed -i 's#<receiver android:name=".QuitWidgetProvider" android:exported="true">#<receiver android:name=".QuitWidgetProvider" android:exported="true" android:label="@string/widget_name">#' "$MANIFEST"

echo "Widget files added for $APP_ID"
