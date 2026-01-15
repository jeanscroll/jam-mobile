const ButtonGoogleMeta = {
    name: "ButtonGoogle",
    section: "🔖 Jam",
    displayName: "Button Google",
    description: "Google button used in Job Around Me project",
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

      redirectTo: {
        type: "string",
        defaultValue: "/",
        description: "URL vers laquelle rediriger après login Google",
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
    importPath: "./components/forms/ButtonGoogle/ButtonGoogle",
  };
  
  export default ButtonGoogleMeta;
  