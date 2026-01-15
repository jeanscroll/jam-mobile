import { ComponentMeta } from "@plasmicapp/host";
import Separator from "./Separator";

const SeparatorMeta = {
  name: "Separator",
  displayName: "Séparateur",
  importName: "Separator",
  importPath: "./plasmic-library/others/Separator/Separator",
  component: Separator,
  description: "Un séparateur visuel qui peut être horizontal ou vertical",
  section: "UI",
  props: {
    orientation: {
      type: "string",
      description: "Orientation du séparateur (horizontal ou vertical)",
      defaultValue: "horizontal",
    },
    decorative: {
      type: "boolean",
      description: "Si le séparateur est décoratif",
      defaultValue: true,
    },
    className: {
      type: "string",
      description: "Classes CSS additionnelles",
      defaultValue: "",
    },
  },
} as ComponentMeta<typeof Separator>;

export default SeparatorMeta; 