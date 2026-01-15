const TextInputMeta = {
  name: "TextInput",
  section: "📍 Test",
  displayName: "Texte Input",
  description: "Input texte de test pour les formulaire",
  thumbnailUrl: "https://static1.plasmic.app/insertables/input.svg",
  props: {
    showLabel: {
      type: "boolean",
      defaultValue: true,
      description: "Affiche ou masque l'étiquette du champ de saisie.",
    },
    label: {
      type: "string",
      defaultValue: "Input Label",
      description: "Le texte à afficher pour l'étiquette du champ de saisie.",
    },
    placeholder: {
      type: "string",
      defaultValue: "Enter text...",
      description: "Texte à afficher lorsqu'aucune saisie n'a été effectuée.",
    },
    text: {
      type: "string",
      defaultValue: "",
      description: "Valeur initiale du champ de saisie.",
    },
    state: {
      type: "choice",
      options: ["default", "focused", "disabled", "error"],
      defaultValue: "default",
      description: "L'état visuel du champ de saisie.",
    },
    isMulti: {
      type: "boolean",
      defaultValue: false,
      description: "Détermine si le champ est un champ de texte multi-lignes (textarea).",
    },
    type: {
      type: "choice",
      options: ["email", "password", "tel", "text", "url"],
      defaultValue: "text",
      description: "Type de champ de saisie, utilisé pour définir les contraintes du champ.",
    },
    icon: {
      type: "string",
      description: "URL de l'icône à afficher dans le champ de saisie.",
    },
    showIcon: {
      type: "boolean",
      defaultValue: false,
      description: "Affiche ou masque l'icône à gauche du champ de saisie.",
    },
    onChange: {
      type: "eventHandler",
      description: "Fonction appelée lors du changement de la case.",
      argTypes: [
        {
          name: "checked",
          type: "boolean",
        },
      ],
    },
  },
  importPath: "./components/forms/TextInput/TextInput",
};

export default TextInputMeta;