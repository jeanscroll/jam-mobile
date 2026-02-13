package com.jam.mobile.plugins;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.wallet.button.ButtonConstants;
import com.google.android.gms.wallet.button.ButtonOptions;
import com.google.android.gms.wallet.button.PayButton;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "GooglePayButtonPlugin")
public class GooglePayButtonPlugin extends Plugin {

    private PayButton payButton;

    private static final String ALLOWED_PAYMENT_METHODS = "[{\"type\":\"CARD\",\"parameters\":{\"allowedAuthMethods\":[\"PAN_ONLY\",\"CRYPTOGRAM_3DS\"],\"allowedCardNetworks\":[\"VISA\",\"MASTERCARD\",\"AMEX\"]}}]";

    @PluginMethod
    public void create(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        int top = dpToPx(call.getInt("top", 0));
        int left = dpToPx(call.getInt("left", 0));
        int width = dpToPx(call.getInt("width", ViewGroup.LayoutParams.MATCH_PARENT));
        int height = dpToPx(call.getInt("height", 48));

        activity.runOnUiThread(() -> {
            try {
                // Remove existing button if any
                removePayButton();

                payButton = new PayButton(activity);

                JSONArray allowedPaymentMethods = new JSONArray(ALLOWED_PAYMENT_METHODS);

                payButton.initialize(
                    ButtonOptions.newBuilder()
                        .setButtonTheme(ButtonConstants.ButtonTheme.DARK)
                        .setButtonType(ButtonConstants.ButtonType.PAY)
                        .setCornerRadius(8)
                        .setAllowedPaymentMethods(allowedPaymentMethods.toString())
                        .build()
                );

                payButton.setOnClickListener(v -> {
                    notifyListeners("onClick", new JSObject());
                });

                FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(width, height);
                params.topMargin = top;
                params.leftMargin = left;

                ViewGroup rootView = activity.findViewById(android.R.id.content);
                rootView.addView(payButton, params);

                // Notify JS that the button is ready
                JSObject readyData = new JSObject();
                readyData.put("isReady", true);
                notifyListeners("onReadyToPay", readyData);

                call.resolve();
            } catch (JSONException e) {
                call.reject("Failed to parse payment methods JSON", e);
            } catch (Exception e) {
                call.reject("Failed to create PayButton: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void updatePosition(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null || payButton == null) {
            call.reject("PayButton not initialized");
            return;
        }

        int top = dpToPx(call.getInt("top", 0));
        int left = dpToPx(call.getInt("left", 0));
        int width = dpToPx(call.getInt("width", -1));
        int height = dpToPx(call.getInt("height", -1));

        activity.runOnUiThread(() -> {
            FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) payButton.getLayoutParams();
            params.topMargin = top;
            params.leftMargin = left;
            if (width > 0) params.width = width;
            if (height > 0) params.height = height;
            payButton.setLayoutParams(params);
            call.resolve();
        });
    }

    @PluginMethod
    public void remove(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }

        activity.runOnUiThread(() -> {
            removePayButton();
            call.resolve();
        });
    }

    @PluginMethod
    public void setVisible(PluginCall call) {
        Boolean visible = call.getBoolean("visible", true);
        Activity activity = getActivity();
        if (activity == null || payButton == null) {
            call.resolve();
            return;
        }

        activity.runOnUiThread(() -> {
            payButton.setVisibility(visible ? View.VISIBLE : View.GONE);
            call.resolve();
        });
    }

    private void removePayButton() {
        if (payButton != null && payButton.getParent() != null) {
            ((ViewGroup) payButton.getParent()).removeView(payButton);
        }
        payButton = null;
    }

    private int dpToPx(int dp) {
        if (dp <= 0) return dp;
        float density = getActivity().getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    @Override
    protected void handleOnDestroy() {
        removePayButton();
        super.handleOnDestroy();
    }
}
