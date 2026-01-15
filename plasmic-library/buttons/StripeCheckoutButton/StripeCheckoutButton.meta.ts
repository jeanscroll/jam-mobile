const StripeCheckoutButtonMeta = {
    name: "StripeCheckoutButton",
    section: "🔖 Jam",
    displayName: "Stripe Checkout button",
    description: "Stripe button used in JAM project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/button.svg",
    props: {
        items: {
        type: "array",
        itemType: {
          type: "object",
          fields: {
            price: { type: "string" },
            quantity: { type: "number" },
          },
        },
      },
      clientReferenceId: "string",
      customerEmail: "string",
      successUrl: {
        type: "string",
        description: "nomDeLaPage?credit=success&session_id={CHECKOUT_SESSION_ID}",
      },
      cancelUrl: {
        type: "string",
        description: "nomDeLaPage?credit=cancel",
      },
      children: "slot",
    },
    importPath: "./components/forms/StripeCheckoutButton/StripeCheckoutButton",
};

export default StripeCheckoutButtonMeta;
