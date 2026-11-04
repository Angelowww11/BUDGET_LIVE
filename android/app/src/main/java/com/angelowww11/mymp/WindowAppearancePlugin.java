package com.angelowww11.mymp;

import android.graphics.Color;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Colors the native inset areas on WebViews that need native safe-area padding. */
@CapacitorPlugin(name = "WindowAppearance")
public class WindowAppearancePlugin extends Plugin {
    @PluginMethod
    public void setBackground(PluginCall call) {
        String color = call.getString("color", "");
        if (!color.matches("#[0-9a-fA-F]{6}")) {
            call.reject("Choose a valid window color.");
            return;
        }
        int background = Color.parseColor(color);
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().getDecorView().setBackgroundColor(background);
            call.resolve();
        });
    }
}
