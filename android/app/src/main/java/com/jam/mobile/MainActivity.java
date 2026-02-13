package com.jam.mobile;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.jam.mobile.plugins.GooglePayButtonPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GooglePayButtonPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
