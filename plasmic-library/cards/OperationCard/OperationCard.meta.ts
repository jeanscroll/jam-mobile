const OperationCardMeta = {
  name: "OperationCard",
  section: "🔖 Sitex",
  displayName: "Carte d'Opération",
  description: "Carte permettant de créer une nouvelle opération avec les informations nécessaires.",
  thumbnailUrl: "https://yourimageurl.com/operation-card-thumbnail.png",

  props: {
    title: {
      type: "string",
      defaultValue: "",
      description: "Titre de l'opération.",
    },
    startDate: {
      type: "string",
      defaultValue: "",
      description: "Date de début de l'opération.",
    },
    startTime: {
      type: "string",
      defaultValue: "",
      description: "Heure de début de l'opération.",
    },
    type: {
      type: "string",
      defaultValue: "",
      description: "Type d'opération.",
    },
    budget: {
      type: "string",
      defaultValue: "",
      description: "Budget de l'opération.",
    },
    comments: {
      type: "string",
      defaultValue: "",
      description: "Commentaires pour l'opération.",
    },
    runsheetModel: {
      type: "string",
      defaultValue: "",
      description: "Modèle de Runsheet & Dispositif.",
    },

    // Boutons
    submitButtonText: {
      type: "string",
      defaultValue: "Réinitialiser",
      description: "Texte du bouton de soumission",
    },
    submitButtonStyle: {
      type: "string",
      defaultValue: "primary",
      options: ["primary", "secondary", "tertiary"],
      description: "Style du bouton de soumission",
    },

    // Events handlers
    onSubmit: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
  },

  importPath: "./components/operations/OperationCard",
};

export default OperationCardMeta;
