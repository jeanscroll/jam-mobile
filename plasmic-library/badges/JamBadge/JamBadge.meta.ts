const JamBadgeMeta = {
  name: "JamBadge",
  section: "🔖 Jam",
  displayName: "Badge JAM",
  description: "Description de cette belle carte",
  thumbnailUrl: "https://static1.plasmic.app/insertables/popover.svg",
  props: {
    size: {
      type: "choice",
      options: ["small", "medium", "large"],
      defaultValue: "medium",
    },
    icon: {
      type: "string",
      description: "URL de l'icône affichée dans le badge.",
    },
    color: {
      type: "choice",
      options: ["gray", "red", "yellow", "green", "blue", "purple"],
      defaultValue: "gray",
    },
    instance: {
      type: "number",
      description: "Instance associée au badge (affichée après le texte).",
    },
    label: {
      type: "string",
      defaultValue: "Badge",
      description: "Texte affiché dans le badge.",
    },
  },
  importPath: "./components/badges/JamBadge/JamBadge",
};

export default JamBadgeMeta;
