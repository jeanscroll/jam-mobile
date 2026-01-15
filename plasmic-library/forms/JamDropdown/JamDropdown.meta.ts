const JamDropdownMeta = {
  name: "JamDropdown",
  section: "📍 Test",
  displayName: "JamDropdown",
  description: "Dropdown pour nos formulaires from Jam project",
  thumbnailUrl: "https://static1.plasmic.app/insertables/select.svg",
  props: {
    iconeUrl: "imageUrl",  // L'URL de l'icône optionnelle
    label: {
      type: "string",  // Le label du select
      defaultValue: "Choisir une option",  // Valeur par défaut du label
    },
    onChange: {
      type: "eventHandler",
      description: "Fonction appelée lors du changement de l'option.",
      argTypes: [
        {
          name: "selectedOption",
          type: "string",
        },
      ],
    },
    options: {
      type: "object",  // Pour stocker une liste d'options (par exemple un tableau d'objets)
      defaultValue: [
        { key: "1", value: "Option 1" },
        { key: "2", value: "Option 2" },
        { key: "3", value: "Option 3" }
      ]
    },
    children: {
      type: "slot", // Le slot pour accepter des composants enfants (par exemple des options)
      allowedComponents: ["Option"], // Ici, tu peux accepter des composants `Option` comme enfants

      defaultValue: [
        {
          type: "component",
          name: "Option",  // Assure-toi que `Option` est enregistré aussi dans Plasmic
          props: {
            value: "Option 1",
            children: { type: "text", value: "Option 1" }
          }
        },
        {
          type: "component",
          name: "Option",  // Assure-toi que `Option` est enregistré aussi dans Plasmic
          props: {
            value: "Option 2",
            children: { type: "text", value: "Option 2" }
          }
        }
      ]
    },
  },
  importPath: "./components/forms/JamDropdown/JamDropdown",
};

export default JamDropdownMeta;