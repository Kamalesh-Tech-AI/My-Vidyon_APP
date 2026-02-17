package com.myvidyon.app;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;
import android.os.Build;
import android.app.AlertDialog;
import android.content.DialogInterface;
import java.io.File;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (isRooted()) {
            showRootWarning();
        }
    }

    private boolean isRooted() {
        String[] paths = {
                "/system/app/Superuser.apk",
                "/sbin/su",
                "/system/bin/su",
                "/system/xbin/su",
                "/data/local/xbin/su",
                "/data/local/bin/su",
                "/system/sd/xbin/su",
                "/system/bin/failsafe/su",
                "/data/local/su"
        };
        for (String path : paths) {
            if (new File(path).exists())
                return true;
        }

        String buildTags = android.os.Build.TAGS;
        return buildTags != null && buildTags.contains("test-keys");
    }

    private void showRootWarning() {
        new AlertDialog.Builder(this)
                .setTitle("Security Warning")
                .setMessage(
                        "This device appears to be rooted or running a custom ROM. For security reasons, My Vidyon may not function correctly on compromised devices.")
                .setPositiveButton("I Understand", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
                    }
                })
                .setCancelable(false)
                .show();
    }
}
