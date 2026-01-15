const PasswordCheckIndicatorMeta = {
    name: "PasswordCheckIndicator",
    section: "🔖 Sitex",
    displayName: "Password Check Indicator",
    description: "Password Check Indicator input used in Sitex project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/range-slider.svg",
    props: {
        numberOfChecksToMake: {
            type: 'number',
            displayName: 'Number of slots to display',
            description: 'The number of checks that will be made on the password (length, contains a digit...) (by default 4)',
            defaultValueHint: 4
          },
          numberOfChecksValidated: {
            type: 'number',
            displayName: 'Number of checks validated',
            description: 'The number of checks realized on the current password entry of the user',
            defaultValueHint: 0
          },
          colorUnchecked: {
            type: 'string',
            displayName: 'Color of the unchecked slots',
            defaultValueHint: '#EFEFEF'
          },
          colorChecked: {
            type: 'string',
            displayName: 'Color of the unchecked slots',
            defaultValueHint: '#800080'
          }
    },
    templates: {
        Funky: {
          props: {
            numberOfChecksToMake: 6,
            numberOfChecksValidated: 2,
            colorUnchecked: "fd3f92",
            colorChecked: "#ffff00"
          }
        }
      },
    importPath: "./components/forms/PasswordCheckIndicator/PasswordCheckIndicator",
};

export default PasswordCheckIndicatorMeta;
