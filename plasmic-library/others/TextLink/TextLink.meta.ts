const TextLinkMeta = {
  name: "TextLink",
  section: "🔖 Jam",
  displayName: "Text Link",
  description: "Text for links from JAM",
  thumbnailUrl: "https://static1.plasmic.app/insertables/text.svg",
  props: {
    redirect: {
      type: "string",
      defaultValue: "",
    },
    label: "string",
    size: {
      type: "choice",
      defaultValue: "Small",
      options: ["Small", "Large"],
      required: false,
    },
    icon: {
      type: "choice",
      defaultValue: "None",
      options: ["Start", "None", "End"],
      required: false,
    },
    destructive: "boolean",
    uppercase: "boolean",
    iconImage: "imageUrl",
    disabled: "boolean",
  },
  importPath: "./components/others/TextLink/TextLink",
};

export default TextLinkMeta;