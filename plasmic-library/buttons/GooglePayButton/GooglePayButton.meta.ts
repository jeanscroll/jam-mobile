const GooglePayButtonMeta = {
  name: "GooglePayButton",
  section: "🔖 Jam",
  displayName: "Google Pay Button",
  description: "Bouton de paiement Google Pay pour les achats in-app (Android uniquement)",
  thumbnailUrl: "https://static1.plasmic.app/insertables/button.svg",
  props: {
    items: {
      type: "array",
      description: "Liste des articles à payer",
      defaultValue: [],
      itemType: {
        type: "object",
        fields: {
          label: {
            type: "string",
            description: "Nom de l'article",
          },
          amount: {
            type: "number",
            description: "Prix en euros (ex: 9.99)",
          },
        },
      },
    },
    customerEmail: {
      type: "string",
      description: "Email du client (optionnel)",
    },
    customerId: {
      type: "string",
      description: "ID Stripe du client (optionnel)",
    },
    disabled: {
      type: "boolean",
      defaultValue: false,
      description: "Désactiver le bouton",
    },
    className: {
      type: "string",
      description: "Classes CSS additionnelles",
    },
    onSuccess: {
      type: "eventHandler",
      description: "Fonction appelée après un paiement réussi",
      argTypes: [{ name: "paymentIntentId", type: "string" }],
    },
    onError: {
      type: "eventHandler",
      description: "Fonction appelée en cas d'erreur",
      argTypes: [{ name: "error", type: "string" }],
    },
    onCancel: {
      type: "eventHandler",
      description: "Fonction appelée si l'utilisateur annule",
      argTypes: [],
    },
  },
  importPath: "./plasmic-library/buttons/GooglePayButton/GooglePayButton",
};

export default GooglePayButtonMeta;
