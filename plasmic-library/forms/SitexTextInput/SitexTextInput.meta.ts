import type { TextInputProps } from "./SitexTextInput";

const SitexTextInputMeta = {
    name: "SitexTextInput",
    section: "🔖 Sitex",
    displayName: "Text Input Sitex",
    description: "Text input used in Sitex project",
    thumbnailUrl: "https://static1.plasmic.app/insertables/input.svg",
    props: {
        nameInErrorMessages: 'string',
        type: {
          type: 'choice',
          options: ['text', 'password', 'tel', 'email']
        },
        placeholder: 'string',
        prefixedText: 'string',
        destructive: 'boolean',
        disabled: 'boolean',
        iconUrl: 'string',
        inputClassName: {
          type: 'class',
          selectors: [
            {
              selector: ':hover',
              label: 'Hovered'
            },
            {
              selector: ':focus',
              label: 'Focused'
            }
          ]
        },
        errorTextClassName: {
          type: 'class'
        },
        initialValue: 'string',
        required: 'boolean',
        minLength: 'number',
        maxLength: 'number',
        customValidation: 'string',
        customErrorMessage: {
          type: 'string',
          hidden: (props: TextInputProps) => !props.customValidation,
        },
        onTextChange: {
          type: "eventHandler",
          description: "Fonction appelée lors du changement de saisie.",
          argTypes: [
            {
              name: "value",
              type: "string",
            },
          ],
        },
        onValidationChange: {
          type: "eventHandler",
          description: "Fonction appelée lorsque l'input est valide.",
          argTypes: [
            {
              name: "value",
              type: "string",
            },
          ],
        }
      },
      states: {
        value: {
          type: 'writable',
          variableType: 'text',
          valueProp: 'initialValue',
          onChangeProp: 'onTextChange'
        },
        isInputValid: {
          type: 'readonly',
          variableType: 'boolean',
          onChangeProp: 'onValidationChange'
        }
    },
    importPath: "./components/forms/SitexTextInput/SitexTextInput",
};

export default SitexTextInputMeta;
