import { registerPlugin, PluginListenerHandle } from "@capacitor/core";

export interface GooglePayButtonPluginInterface {
  create(options: {
    top: number;
    left: number;
    width: number;
    height: number;
  }): Promise<void>;

  updatePosition(options: {
    top: number;
    left: number;
    width: number;
    height: number;
  }): Promise<void>;

  remove(): Promise<void>;

  setVisible(options: { visible: boolean }): Promise<void>;

  addListener(
    event: "onClick",
    callback: () => void
  ): Promise<PluginListenerHandle>;

  addListener(
    event: "onReadyToPay",
    callback: (data: { isReady: boolean }) => void
  ): Promise<PluginListenerHandle>;
}

export const GooglePayButtonNative =
  registerPlugin<GooglePayButtonPluginInterface>("GooglePayButtonPlugin");
