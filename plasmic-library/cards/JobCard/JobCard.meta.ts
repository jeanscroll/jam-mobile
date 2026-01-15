const JobCardMeta = {
    name: "JobCard",
    section: "🔖 Jam",
    displayName: "Job card",
    description: "Description de cette belle carte",
    thumbnailUrl: "https://static1.plasmic.app/insertables/modal.svg",
    props: {
      state: {
        type: "choice",
        defaultValue: "default",
        options: ["default", "liked", "applied", "new", "lastMin"],
        required: false,
      },
      title: "string",
      className: "string",
      city: "string",
      companyName: "string",
      logo: "imageUrl",
      domain: {
        type: "object",
        fields: {
          icon: "imageUrl",
          text: "string",
        },
        required: false,
      },
      contractType: {
        type: "object",
        fields: {
          icon: "imageUrl",
          text: "string",
        },
        required: false,
      },
      availability: {
        type: "object",
        fields: {
          icon: "imageUrl",
          text: "string",
        },
        required: false,
      },
      workingTime: {
        type: "object",
        fields: {
          icon: "imageUrl",
          text: "string",
        },
        required: false,
      },
      salary: {
        type: "object",
        fields: {
          icon: "imageUrl",
          text: "string",
        },
        required: false,
      },
      workMode: {
        type: "object",
        fields: {
          icon: "imageUrl",
          text: "string",
        },
        required: false,
      },
      onClick: {
        type: "eventHandler",
        description: "Fonction appelée lors du clic sur le bouton.",
        argTypes: [
          {
            name: "event",
            type: "object",
          },
        ],
      },
      metrics: {
        type: "array",
        itemType: {
          type: "object",
          fields: {
            icon: "imageUrl",
            label: "string",
            value: "string",
          },
        },
        required: false,
        defaultValue: [],
      },
      tags: {
        type: "array",
        itemType: {
          type: "object",
          fields: {
            icon: "imageUrl",
            label: "string",
          },
        },
        required: false,
        defaultValue: [],
      },
      customIcons: {
        type: "object",
        defaultValue: {},
      },
    },
    importPath: "./components/cards/JobCard/JobCard",
  };
  
  export default JobCardMeta;