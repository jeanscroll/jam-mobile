const LibraryCardMeta = {
  name: "LibraryCard",
  section: "🔅 Librairie",
  displayName: "Manage library",
  description: "Manage ta librarie plasmic !",
  thumbnailUrl: "https://plasmic-api.agence-scroll.com/library.png",
  props: {
    title: {
      type: "string",
      defaultValue: "Version 0.7",
    },
    imageUrl: {
      type: "string",
      defaultValue: "library.webp",
    },
    buttonText: {
      type: "string",
      defaultValue: "Paramètres",
    },
    showHeader: {
      type: "boolean",
      defaultValue: true,
      description: "Afficher ou masquer le header de la carte",
    },
    headerTitle: {
      type: "string",
      defaultValue: "Librairie plasmic",
      description: "Titre du header",
    },
    headerSubtitle: {
      type: "string",
      defaultValue: "Manageur",
      description: "Sous-titre du header",
    },
    headerDescription: {
      type: "string",
      defaultValue: "X Composants",
      description: "Description du header",
    },
  },
  importPath: "./components/cards/LibraryCard/LibraryCard",
};

export default LibraryCardMeta;
