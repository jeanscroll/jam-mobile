const JamButtonMeta = {
    name: "JamButton",
    section: "🔖 Jam",
    displayName: "Jam Button",
    description: "Button used in Job Around Me project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/button.svg",
    props: {
      icon: {
        type: "choice",
        defaultValue: "none",
        options: ["start", "none", "end"],
        required: false,
      },
      iconImage: "imageUrl",
      label: "string",
      onClick: {
        type: "eventHandler",
        description: "Fonction appelée lors du clic sur le bouton.",
        argTypes: [],
      },
    },
    importPath: "./components/forms/JamButton/JamButton",
  };
  
  export default JamButtonMeta;
  