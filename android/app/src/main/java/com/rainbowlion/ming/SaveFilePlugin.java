package com.rainbowlion.ming;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** User-chosen document export. No broad filesystem permissions or remote transfer. */
@CapacitorPlugin(name = "SaveFile")
public class SaveFilePlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String content = call.getString("content");
        if (content == null || content.length() > 30000000) {
            call.reject("Invalid save file size");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("name", "Ming-1582-save.json"));
        startActivityForResult(call, intent, "fileSelected");
    }

    @ActivityCallback
    private void fileSelected(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Export canceled", "CANCELED");
            return;
        }
        Uri uri = result.getData().getData();
        if (uri == null || !"content".equals(uri.getScheme())) {
            call.reject("No document selected");
            return;
        }
        try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "wt")) {
            if (stream == null) throw new java.io.IOException("Document unavailable");
            stream.write(call.getString("content", "").getBytes(StandardCharsets.UTF_8));
            stream.flush();
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not save document");
        }
    }
}
