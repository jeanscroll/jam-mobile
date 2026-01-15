const SitexFormMeta = {
    name: "SitexForm",
    section: "🔖 Sitex",
    displayName: "Form Sitex",
    description: "Form used in Sitex project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/drawer.svg",
    props: {
        children: {
            type: 'slot'
        }
    },
    actions: [
        {
          type: "button-action",
          label: "Append new CodeTextInput",
          onClick: ({ studioOps }: { studioOps: any }) => {
            studioOps.appendToSlot(
              {
                type: 'vbox',
                children: [
                  {
                    type: 'text',
                    value: 'Label',
                  },
                  {
                    type: 'component',
                    name: 'CodeTextInput'
                  }
                ],
                styles: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "0px"
                },
              },
              'children'
            );
          },
        },
      ],
    importPath: "./components/forms/SitexForm/SitexForm",
};

export default SitexFormMeta;
