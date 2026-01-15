// tokens-colors.ts
import type { TokenType } from "@plasmicapp/host";

export const colors: Array<{
  name: string;
  displayName: string;
  value: string;
  type: TokenType;
}> = [
  // Primitive colors
  {
    name: "lime",
    displayName: "Lime",
    value: "#bafe68",
    type: "color",
  },
  {
    name: "dark-green",
    displayName: "Dark Green",
    value: "#002400",
    type: "color",
  },
  {
    name: "grey",
    displayName: "Grey",
    value: "#c8c8c8",
    type: "color",
  },
  {
    name: "off-white",
    displayName: "Off White",
    value: "#f4f4f4",
    type: "color",
  },
  {
    name: "white",
    displayName: "White",
    value: "#ffffff",
    type: "color",
  },
  {
    name: "black",
    displayName: "Black",
    value: "#000000",
    type: "color",
  },

  // Color nuances - Lime
  {
    name: "lime-50",
    displayName: "Lime/50",
    value: "#f4ffe6",
    type: "color",
  },
  {
    name: "lime-100",
    displayName: "Lime/100",
    value: "#e8ffcc",
    type: "color",
  },
  {
    name: "lime-200",
    displayName: "Lime/200",
    value: "#d1fe9a",
    type: "color",
  },
  {
    name: "lime-300",
    displayName: "Lime/300",
    value: "#bafe67",
    type: "color",
  },
  {
    name: "lime-400",
    displayName: "Lime/400",
    value: "#a3fe34",
    type: "color",
  },
  {
    name: "lime-500",
    displayName: "Lime/500",
    value: "#bbfe68",
    type: "color",
  },
  {
    name: "lime-600",
    displayName: "Lime/600",
    value: "#70cb01",
    type: "color",
  },
  {
    name: "lime-700",
    displayName: "Lime/700",
    value: "#549801",
    type: "color",
  },
  {
    name: "lime-800",
    displayName: "Lime/800",
    value: "#386501",
    type: "color",
  },
  {
    name: "lime-900",
    displayName: "Lime/900",
    value: "#1c3300",
    type: "color",
  },
  {
    name: "lime-950",
    displayName: "Lime/950",
    value: "#0e1900",
    type: "color",
  },

  // Color nuances - Grey
  {
    name: "grey-25",
    displayName: "Grey/25",
    value: "#f8f8f8",
    type: "color",
  },
  {
    name: "grey-50",
    displayName: "Grey/50",
    value: "#f2f2f2",
    type: "color",
  },
  {
    name: "grey-100",
    displayName: "Grey/100",
    value: "#e6e6e6",
    type: "color",
  },
  {
    name: "grey-200",
    displayName: "Grey/200",
    value: "#cccccc",
    type: "color",
  },
  {
    name: "grey-300",
    displayName: "Grey/300",
    value: "#b3b3b3",
    type: "color",
  },
  {
    name: "grey-400",
    displayName: "Grey/400",
    value: "#999999",
    type: "color",
  },
  {
    name: "grey-500",
    displayName: "Grey/500",
    value: "#c8c8c8",
    type: "color",
  },
  {
    name: "grey-600",
    displayName: "Grey/600",
    value: "#666666",
    type: "color",
  },
  {
    name: "grey-700",
    displayName: "Grey/700",
    value: "#4d4d4d",
    type: "color",
  },
  {
    name: "grey-800",
    displayName: "Grey/800",
    value: "#333333",
    type: "color",
  },
  {
    name: "grey-900",
    displayName: "Grey/900",
    value: "#1a1a1a",
    type: "color",
  },
  {
    name: "grey-950",
    displayName: "Grey/950",
    value: "#0d0d0d",
    type: "color",
  },

  // Color nuances - Error
  {
    name: "error-25",
    displayName: "Error/25",
    value: "#fffbfa",
    type: "color",
  },
  {
    name: "error-50",
    displayName: "Error/50",
    value: "#fef3f2",
    type: "color",
  },
  {
    name: "error-100",
    displayName: "Error/100",
    value: "#fee4e2",
    type: "color",
  },
  {
    name: "error-200",
    displayName: "Error/200",
    value: "#fecdca",
    type: "color",
  },
  {
    name: "error-300",
    displayName: "Error/300",
    value: "#fda29b",
    type: "color",
  },
  {
    name: "error-400",
    displayName: "Error/400",
    value: "#f97066",
    type: "color",
  },
  {
    name: "error-500",
    displayName: "Error/500",
    value: "#f04438",
    type: "color",
  },
  {
    name: "error-600",
    displayName: "Error/600",
    value: "#d92d20",
    type: "color",
  },
  {
    name: "error-700",
    displayName: "Error/700",
    value: "#b42318",
    type: "color",
  },
  {
    name: "error-800",
    displayName: "Error/800",
    value: "#912018",
    type: "color",
  },
  {
    name: "error-900",
    displayName: "Error/900",
    value: "#7a271a",
    type: "color",
  },

  // System colors - Danger
  {
    name: "danger-text",
    displayName: "Danger/Text",
    value: "#ab3832",
    type: "color",
  },
  {
    name: "danger-border",
    displayName: "Danger/Border",
    value: "#f0a5a3",
    type: "color",
  },
  {
    name: "danger-background",
    displayName: "Danger/Background",
    value: "#fcf1f1",
    type: "color",
  },

  // System colors - Warning
  {
    name: "warning-text",
    displayName: "Warning/Text",
    value: "#ad5b2b",
    type: "color",
  },
  {
    name: "warning-border",
    displayName: "Warning/Border",
    value: "#f7d165",
    type: "color",
  },
  {
    name: "warning-background",
    displayName: "Warning/Background",
    value: "#fdf9eb",
    type: "color",
  },

  // System colors - Success
  {
    name: "success-text",
    displayName: "Success/Text",
    value: "#387c39",
    type: "color",
  },
  {
    name: "success-border",
    displayName: "Success/Border",
    value: "#99e4a4",
    type: "color",
  },
  {
    name: "success-background",
    displayName: "Success/Background",
    value: "#f1fbf3",
    type: "color",
  },

  // System colors - Information
  {
    name: "information-text",
    displayName: "Information/Text",
    value: "#002400", // Using Dark Green value
    type: "color",
  },
  {
    name: "information-border",
    displayName: "Information/Border",
    value: "#bafe68", // Using Lime value
    type: "color",
  },
  {
    name: "information-background",
    displayName: "Information/Background",
    value: "#f4ffe6", // Using Lime 50 value
    type: "color",
  },

  // Theme colors
  {
    name: "primary",
    displayName: "Primary Color",
    value: "#BAFE68",
    type: "color",
  },
  {
    name: "secondary",
    displayName: "Secondary Color",
    value: "#f2eee9",
    type: "color",
  },
  {
    name: "tertiary",
    displayName: "Tertiary Color",
    value: "#f2f2f2",
    type: "color",
  }
];
