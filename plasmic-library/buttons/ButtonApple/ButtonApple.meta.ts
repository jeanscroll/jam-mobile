const ButtonAppleMeta = {
    name: "ButtonApple",
    section: "🔖 Jam",
    displayName: "Button Apple",
    description: "Apple button used in Job Around Me project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/button.svg",
    props: {
      label: "string",
      icon: {
        type: "choice",
        defaultValue: "none",
        options: ["start", "end", "only", "none"],
        required: false,
      },
      destructive: "boolean",
      hierarchy: {
        type: "choice",
        defaultValue: "primary",
        options: ["primary", "secondary"],
        required: false,
      },
      size: {
        type: "choice",
        defaultValue: "large",
        options: ["small", "large"],
        required: false,
      },
      state: {
        type: "choice",
        defaultValue: "default",
        options: ["default", "hover", "focused", "disabled"],
        required: false,
      },
      iconImage: "imageUrl",
      className: "string",
      onClick: {
        type: "eventHandler",
        description: "Fonction appelée lors du clic sur le bouton.",
        argTypes: [],
      },
    },
    importPath: "./components/forms/ButtonApple/ButtonApple",
  };
  
  export default ButtonAppleMeta;
  