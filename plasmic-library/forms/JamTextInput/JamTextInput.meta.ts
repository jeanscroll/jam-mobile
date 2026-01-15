const JamTextInputMeta = {
    name: "JamTextInput",
    section: "🔖 Jam",
    displayName: "Jam Text input",
    description: "Text input used in Job Around Me project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/input.svg",
    props: {
        label: "string",
        placeholder: "string",
        Text: "string", // Valeur initiale du texte
        required: "boolean",
        type: {
        type: "choice",
        options: ["default", "leadingText", "textArea", "password", "phone"],
        defaultValue: "default",
        },
        destructive: "boolean",
        disabled: "boolean",
        iconImage: "imageUrl",
        prefixedText: "string",
        hint: "string",
        className: "string",
        iconUrl: "imageUrl",
        onTextChange: {
        type: "eventHandler",
        description: "Fonction appelée lors du changement de la case.",
        argTypes: [
            {
            name: "VarInput",
            type: "string",
            },
        ],
        },
    },
    importPath: "./components/forms/JamTextInput/JamTextInput",
};

export default JamTextInputMeta;
