package com.angelowww11.mymp;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Colors the native inset areas on WebViews that need native safe-area padding. */
@CapacitorPlugin(name = "WindowAppearance")
public class WindowAppearancePlugin extends Plugin {
    private final ColorDrawable[] edges = {
        new ColorDrawable(), new ColorDrawable(), new ColorDrawable(), new ColorDrawable()
    };

    @Override
    public void load() {
        getActivity().runOnUiThread(() -> {
            View decor = getActivity().getWindow().getDecorView();
            for (ColorDrawable edge : edges) decor.getOverlay().add(edge);
            decor.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> layoutEdges(v));
        });
    }

    private void layoutEdges(View decor) {
        WindowInsetsCompat windowInsets = ViewCompat.getRootWindowInsets(decor);
        if (windowInsets == null) return;
        Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
        int width = decor.getWidth();
        int height = decor.getHeight();
        edges[0].setBounds(0, 0, width, bars.top);
        edges[1].setBounds(0, height - bars.bottom, width, height);
        edges[2].setBounds(0, bars.top, bars.left, height - bars.bottom);
        edges[3].setBounds(width - bars.right, bars.top, width, height - bars.bottom);
    }

    @PluginMethod
    public void setBackground(PluginCall call) {
        String color = call.getString("color", "");
        if (!color.matches("#[0-9a-fA-F]{6}")) {
            call.reject("Choose a valid window color.");
            return;
        }
        int background = Color.parseColor(color);
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().setBackgroundDrawable(new ColorDrawable(background));
            View decor = getActivity().getWindow().getDecorView();
            decor.setBackgroundColor(background);
            // Draw behind system icons even when Android's inset protection uses a fixed theme color.
            for (ColorDrawable edge : edges) edge.setColor(background);
            layoutEdges(decor);
            call.resolve();
        });
    }
}
