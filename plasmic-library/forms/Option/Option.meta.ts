const OptionMeta = {
    name: "Option",
    section: "🔖 Jam",
    displayName: "Jam Option",
    description: "Option used in Job Around Me project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/button.svg",
    props: {
      value: "string",
      children: {
        type: "slot",
        defaultValue: "Option Text",
      },
    },
    importPath: "./components/forms/Option/Option",
  };
  
  export default OptionMeta;
  