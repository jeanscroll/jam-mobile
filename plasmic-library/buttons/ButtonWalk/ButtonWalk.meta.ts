const ButtonWalkMeta = {
    name: "ButtonWalk",
    section: "🔖 Jam",
    displayName: "Button walk",
    description: "Button used to walk in Job Around Me project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/button.svg",
    props: {
      label: "string",
      variant: {
        type: "choice",
        defaultValue: "active",
        options: ["active", "inactive", "disabled"],
        required: false,
      },
      size: {
        type: "choice",
        defaultValue: "medium",
        options: ["small", "medium", "large"],
        required: false,
      },
      icon: {
        type: "choice",
        defaultValue: "none",
        options: ["start", "none", "end"],
        required: false,
      },
      destructive: "boolean",
      uppercase: "boolean",
      iconImage: "imageUrl",
      disabled: "boolean",
    },
    importPath: "./components/forms/ButtonWalk/ButtonWalk",
  };
  
  export default ButtonWalkMeta;
  