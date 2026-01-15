const StripeSubscriptionButtonMeta = {
  name: "StripeSubscriptionButton",
  section: "🔖 Jam",
  displayName: "Stripe Subscription Button",
  description: "Gère création, gestion et résiliation d'abonnement Stripe",
  thumbnailUrl: "https://static1.plasmic.app/insertables/button.svg",
  props: {
    stripeAction: {
      type: "choice",
      options: ["create", "update", "cancel"],
      defaultValue: "create",
    },
    priceId: {
      type: "string",
      displayName: "Price ID",
      description: "Identifiant Stripe du tarif (price_xxx)",
    },
    customerId: "string",
    customerEmail: "string",
    successUrl: { type: "string" },
    cancelUrl: { type: "string" },
    disabled: { type: "boolean" },

    // Modale
    confirmTitle: {
      type: "string",
      defaultValue: "Voulez-vous résilier votre abonnement ?",
      displayName: "Titre de confirmation",
    },
    confirmDescription: {
      type: "string",
      defaultValue: "Votre abonnement sera actif jusqu’à la fin du mois en cours. Sans abonnement, vous ne pourrez plus utiliser la plateforme.",
      displayName: "Texte de confirmation",
    },
    confirmIconSlot: {
      type: "slot",
      displayName: "Icône de confirmation",
      description: "Slot pour une image ou une icône",
    },
    confirmButtonSlot: {
      type: "slot",
      displayName: "Bouton confirmer personnalisé",
    },
    cancelButtonSlot: {
      type: "slot",
      displayName: "Bouton annuler personnalisé",
    },
    
     modalPosition: {
      type: "choice",
      options: ["top", "middle", "bottom"],
      defaultValue: "middle",
      displayName: "Position de la modale",
    },
    showConfirmationModal: {
      type: "boolean",
      defaultValue: true,
      displayName: "Afficher la modale de confirmation",
    },


    // Slots et callbacks
    children: "slot",
    onSuccess: {
      type: "eventHandler",
      argTypes: [],
      description: "Callback appelé en cas de succès",
    },
    onError: {
      type: "eventHandler",
      argTypes: [{ name: "error", type: "object" }],
      description: "Callback appelé en cas d'erreur",
    },
    onStatusChange: {
      type: "eventHandler",
      argTypes: [{ name: "status", type: { type: "choice", options: ["success", "error"] } }],
      description: "Retour d'état (hors création), succès ou erreur",
    },
  },
  importPath: "./components/forms/StripeSubscriptionButton/StripeSubscriptionButton",
};

export default StripeSubscriptionButtonMeta;
