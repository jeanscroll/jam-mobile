const SitexFormv2Meta = {
    name: "SitexFormv2",
    section: "🔖 Sitex",
    displayName: "Form Sitex v2",
    description: "Enhanced form component used in Sitex project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/drawer.svg",
    props: {
        children: {
            type: 'slot'
        },
        onSubmit: {
            type: 'eventHandler',
            argTypes: []
        },
        autoComplete: {
            type: 'choice',
            options: ['on', 'off'],
            defaultValue: 'off'
        },
        noValidate: {
            type: 'boolean',
            defaultValue: false
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
        {
          type: "button-action",
          label: "Append Submit Button",
          onClick: ({ studioOps }: { studioOps: any }) => {
            studioOps.appendToSlot(
              {
                type: 'component',
                name: 'SitexButton',
                props: {
                  children: 'Submit',
                  type: 'submit'
                }
              },
              'children'
            );
          },
        },
      ],
    importPath: "./components/forms/SitexFormv2/SitexFormv2",
};

export default SitexFormv2Meta; 