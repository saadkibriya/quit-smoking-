#!/usr/bin/env bash
set -euo pipefail

APP_ID=$(node -e "console.log(require('./capacitor.config.json').appId)")
MAIN=android/app/src/main
PKG_DIR="$MAIN/java/$(echo "$APP_ID" | tr . /)"

mkdir -p "$PKG_DIR" "$MAIN/res/layout" "$MAIN/res/xml" "$MAIN/res/drawable" "$MAIN/res/values"

# ---------- Java: widget provider ----------
cat > "$PKG_DIR/QuitWidgetProvider.java" <<'EOF'
package __APP_ID__;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.util.Locale;

public class QuitWidgetProvider extends AppWidgetProvider {
    private static final String PREFS = "CapacitorStorage";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            manager.updateAppWidget(id, build(context));
        }
    }

    static RemoteViews build(Context context) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long quit = parseLong(sp.getString("unlit_quit_date", ""), 0L);
        double perDay = parseDouble(sp.getString("unlit_cigs_per_day", ""), 0);
        double packSize = parseDouble(sp.getString("unlit_pack_size", ""), 20);
        double packCost = parseDouble(sp.getString("unlit_pack_cost", ""), 0);
        String cur = sp.getString("unlit_currency", "\u09F3");

        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_quit);

        if (quit <= 0L) {
            v.setTextViewText(R.id.days, "--");
            v.setTextViewText(R.id.label, "OPEN APP TO SET QUIT DATE");
            v.setTextViewText(R.id.avoided, "-");
            v.setTextViewText(R.id.saved, "-");
        } else {
            long elapsed = Math.max(0L, System.currentTimeMillis() - quit);
            double daysExact = elapsed / 86400000.0;
            long days = (long) Math.floor(daysExact);
            long avoided = (long) Math.floor(daysExact * perDay);
            double saved = packSize > 0 ? (avoided / packSize) * packCost : 0;
            v.setTextViewText(R.id.days, String.valueOf(days));
            v.setTextViewText(R.id.label, days == 1 ? "DAY SMOKE-FREE" : "DAYS SMOKE-FREE");
            v.setTextViewText(R.id.avoided, String.valueOf(avoided));
            v.setTextViewText(R.id.saved, cur + String.format(Locale.US, "%.0f", saved));
        }

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            PendingIntent pi = PendingIntent.getActivity(
                context, 0, launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            v.setOnClickPendingIntent(R.id.widget_root, pi);
        }
        return v;
    }

    private static long parseLong(String s, long fallback) {
        try { return Long.parseLong(s.trim()); } catch (Exception e) { return fallback; }
    }

    private static double parseDouble(String s, double fallback) {
        try { return Double.parseDouble(s.trim()); } catch (Exception e) { return fallback; }
    }
}
EOF
sed -i "s/__APP_ID__/$APP_ID/g" "$PKG_DIR/QuitWidgetProvider.java"

# ---------- Layout ----------
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
        android:textSize="52sp"
        android:fontFamily="monospace"
        android:includeFontPadding="false" />

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
                android:textSize="16sp"
                android:fontFamily="monospace" />
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
                android:textSize="16sp"
                android:fontFamily="monospace" />
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

# ---------- Background ----------
cat > "$MAIN/res/drawable/widget_bg.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#000000" />
    <stroke android:width="1dp" android:color="#2A2A2A" />
    <corners android:radius="28dp" />
</shape>
EOF

# ---------- Widget metadata ----------
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
    <string name="widget_description">Smoke-free days, cigarettes avoided and money saved</string>
</resources>
EOF

# ---------- Register receiver in manifest ----------
MANIFEST="$MAIN/AndroidManifest.xml"
if ! grep -q "QuitWidgetProvider" "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name=".QuitWidgetProvider" android:exported="true">\n            <intent-filter>\n                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />\n            </intent-filter>\n            <meta-data android:name="android.appwidget.provider" android:resource="@xml/quit_widget_info" />\n        </receiver>\n    </application>#' "$MANIFEST"
fi

echo "Widget files added for $APP_ID"
