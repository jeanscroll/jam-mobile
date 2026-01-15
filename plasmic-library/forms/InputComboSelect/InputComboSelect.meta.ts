const InputComboSelectMeta = {
  name: "InputComboSelect",
  section: "🔖 Jam",
  displayName: "Input + Combo Select",
  description: "Champ combiné pour saisie ou sélection d'un nombre de 1 à 20",
  thumbnailUrl: "https://static1.plasmic.app/insertables/modal.svg",
  props: {
    value: {
      type: "number",
      defaultValue: 0,
    },
    dropDirection: {
      type: "choice",
      options: ["up", "down"],
      defaultValue: "up",
    },
    onChange: {
      type: "eventHandler",
      argTypes: [],
    },
  },

   // States
   states: {
    value: {
      type: "writable",
      variableType: "number",
      valueProp: "value",
      onChangeProp: "onChange",
    },
  },

  importPath: "./components/forms/InputComboSelect/InputComboSelect",
};

export default InputComboSelectMeta;
