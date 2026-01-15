// tokens-spacing.ts
import type { TokenType } from "@plasmicapp/host";

export const spacing: Array<{
  name: string;
  displayName: string;
  value: string;
  type: TokenType;
}> = [
  {
    name: "space-xs",
    displayName: "Extra Small Space",
    value: "4px",
    type: "spacing",
  },
  {
    name: "space-sm",
    displayName: "Small Space",
    value: "8px",
    type: "spacing",
  },
  {
    name: "space-md",
    displayName: "Medium Space",
    value: "16px",
    type: "spacing",
  },
  // Ajoute ici les autres espacements...
];
