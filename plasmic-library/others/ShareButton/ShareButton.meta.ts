const ShareButtonMeta = {
  name: "ShareButton",
  section: "🔖 Jam",
  displayName: "Share button",
  description:
    "Bouton de partage natif (Capacitor iOS/Android) avec repli web et copie de lien.",
  thumbnailUrl: "https://static1.plasmic.app/insertables/button.svg",
  props: {
    url: {
      type: "string",
      description: "URL à partager (lien de l'annonce).",
    },
    title: "string",
    text: "string",
    dialogTitle: {
      type: "string",
      description: "Titre de la feuille de partage (Android).",
    },
    copyFallbackMessage: {
      type: "string",
      defaultValue: "Lien copié dans le presse-papiers",
    },
    className: "string",
    children: {
      type: "slot",
      description: "Contenu cliquable (icône/label). Icône par défaut si vide.",
    },
    onShared: {
      type: "eventHandler",
      argTypes: [],
    },
    onError: {
      type: "eventHandler",
      argTypes: [{ name: "message", type: "string" }],
    },
  },
  importPath: "./components/others/ShareButton/ShareButton",
};

export default ShareButtonMeta;
