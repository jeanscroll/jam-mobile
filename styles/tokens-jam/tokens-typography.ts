import type { TokenType } from "@plasmicapp/host";

export const typography: Array<{
  name: string;
  displayName: string;
  value: string;
  type: TokenType;
}> = [
  {
    name: "font-heading",
    displayName: "Heading Font",
    value: "Poppins, sans-serif",
    type: "font-family",
  },
  {
    name: "font-body",
    displayName: "Body Font",
    value: "Inter, sans-serif",
    type: "font-family",
  },
  {
    name: "font-manrope",
    displayName: "Manrope Font",
    value: "Manrope, sans-serif",
    type: "font-family",
  },
  {
    name: "font-size-sm",
    displayName: "Small Font Size",
    value: "14px",
    type: "font-size",
  },
  {
    name: "font-size-md",
    displayName: "Medium Font Size",
    value: "16px",
    type: "font-size",
  },
  {
    name: "font-size-lg",
    displayName: "Large Font Size",
    value: "24px",
    type: "font-size",
  },
  {
    name: "line-height-sm",
    displayName: "Small Line Height",
    value: "1.2",
    type: "line-height",
  },
  {
    name: "line-height-md",
    displayName: "Medium Line Height",
    value: "1.5",
    type: "line-height",
  },
  {
    name: "line-height-lg",
    displayName: "Large Line Height",
    value: "1.8",
    type: "line-height",
  },
  {
    name: "opacity-muted",
    displayName: "Muted Opacity",
    value: "0.6",
    type: "opacity",
  },
];
