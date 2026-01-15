const CardSimpleMeta = {
    name: "CardSimple",
    section: "📍 Test",
  displayName: "Card simple",
  description: "Description de cette belle carte",
  thumbnailUrl: "https://static1.plasmic.app/insertables/modal.svg",
    props: {
      title: {
        type: "string",
        defaultValue: "Default Title",
      },
      color: {
        type: "string",
        defaultValue: "#000000",
      },
    },
    importPath: "./components/cards/CardSimple/CardSimple",
  };
  
  export default CardSimpleMeta;