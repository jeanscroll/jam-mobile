const JamCheckboxMeta = {
    name: "JamCheckbox",
    section: "🔖 Jam",
    displayName: "CheckBox",
    description: "Checkbox used in Jam project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/checkbox.svg",
    props: {
      checked: "boolean",
      type: {
        type: "choice",
        defaultValue: "Checkbox",
        options: ["Checkbox", "Check circle"],
        required: false,
      },
      disabled: "boolean",
      onChange: {
        type: "eventHandler",
        description: "Fonction appelée lors du changement de la case.",
        argTypes: [
          {
            name: "checked",
            type: "boolean",
          },
        ],
      },
    },
    importPath: "./components/forms/JamCheckbox/JamCheckbox",
};

export default JamCheckboxMeta;
