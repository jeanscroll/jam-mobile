import Notation from "./Notation";

const NotationMeta = {
  name: "Notation",
  displayName: "Notation (Étoiles)",
  description: "Affiche une note sous forme de 5 étoiles colorées.",
  importName: "Notation",
  importPath: "./plasmic-library/others/Notation/Notation",
  component: Notation,
  props: {
    value: {
      type: "number",
      displayName: "Valeur",
      description: "Nombre d'étoiles à afficher (0 à 5)",
      defaultValue: 0,
      min: 0,
      max: 5,
      step: 1,
    },
    className: {
      type: "string",
      displayName: "Classe CSS",
      description: "Classe CSS optionnelle pour personnaliser le composant.",
      defaultValue: "",
      advanced: true,
    },
    onChange: {
      type: "eventHandler",
      displayName: "Au changement",
      description: "Fonction appelée lorsqu'une étoile est cliquée",
      argTypes: [
        { name: "value", type: "number" }
      ]
    },
    enableHover: {
      type: "boolean",
      displayName: "Activer le hover",
      description: "Active ou désactive l'effet hover sur les étoiles.",
      defaultValue: true
    }
  },
};

export default NotationMeta; 