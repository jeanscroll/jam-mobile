const SignUpMeta = {
  name: "SignUp",
  section: "1.🔑 Authentication",
  displayName: "Sign Up",
  description:
    "Un formulaire d'inscription avec validation, contrôle de force du mot de passe, visibilité du mot de passe et système d'alertes intégré",
  importPath: "./plasmic-library/authentication/SignUp",
  thumbnailUrl: `https://plasmic-api.agence-scroll.com/library/SignUp.png`,

  props: {
    // Wrapper style
    wrapperStyle: {
      type: "choice",
      defaultValue: "card",
      options: ["simple", "card", "custom"],
      description: "Style du conteneur du formulaire",
    },

    // Title
    title: {
      type: "string",
      defaultValue: "Bienvenue !",
    },
    titleHeading: {
      type: "choice",
      defaultValue: "h1",
      options: ["h1", "h2", "h3"],
      description: "Niveau du titre",
    },

    // Input style
    inputStyle: {
      type: "choice",
      defaultValue: "simple",
      options: ["simple", "advance"],
      description: "Style des champs de saisie",
    },

    // Firstname
    firstNameLabel: {
      type: "string",
      defaultValue: "Prénom",
    },
    firstName: {
      type: "string",
      defaultValue: "",
      valueProp: "firstName",
      onChangeProp: "onFirstNameChange",
    },

    // Lastname
    lastNameLabel: {
      type: "string",
      defaultValue: "Nom",
    },
    lastName: {
      type: "string",
      defaultValue: "",
      valueProp: "lastName",
      onChangeProp: "onLastNameChange",
    },

    // Email
    emailLabel: {
      type: "string",
      defaultValue: "Email",
    },
    placeholderEmail: {
      type: "string",
      defaultValue: "Entrez votre email",
    },
    email: {
      type: "string",
      defaultValue: "",
      valueProp: "email",
      onChangeProp: "onEmailChange",
    },

    // Phone
    phoneLabel: {
      type: "string",
      defaultValue: "Téléphone",
      description: "Label du champ téléphone",
    },
    placeholderPhone: {
      type: "string",
      defaultValue: "060606060606",
      description: "Placeholder du champ téléphone",
    },
    phone: {
      type: "string",
      defaultValue: "",
      valueProp: "phone",
      onChangeProp: "onPhoneChange",
    },
    countryCode: {
      type: "string",
      defaultValue: "+33",
      valueProp: "countryCode",
      onChangeProp: "onCountryCodeChange",
      description: "Code pays pour le numéro de téléphone",
    },

    // Password
    passwordLabel: {
      type: "string",
      defaultValue: "Mot de passe",
    },
    placeholderPassword: {
      type: "string",
      defaultValue: "Entrez votre mot de passe",
    },
    password: {
      type: "string",
      defaultValue: "",
      valueProp: "password",
      onChangeProp: "onPasswordChange",
    },
    confirmPasswordLabel: {
      type: "string",
      defaultValue: "Répétez le mot de passe",
    },
    placeholderConfirmPassword: {
      type: "string",
      defaultValue: "Confirmez votre mot de passe",
    },
    confirmPassword: {
      type: "string",
      defaultValue: "",
      valueProp: "confirmPassword",
      onChangeProp: "onConfirmPasswordChange",
    },
    passwordInfoText: {
      type: "string",
      defaultValue:
        "Utilisez 8 caractères ou plus en mélangeant lettres, chiffres et symboles.",
    },
    eyeIconColor: {
      type: "string",
      defaultValue: "#666",
      description: "Couleur de l'icône d'œil",
    },

    // Gestion des alertes
    alertPosition: {
      type: "choice",
      options: ["top", "bottom", "inline"],
      defaultValue: "top",
      description: "Position des alertes dans le composant",
    },
    maxAlerts: {
      type: "number",
      defaultValue: 3,
      description: "Nombre maximum d'alertes à afficher simultanément",
    },
    customErrorMessages: {
      type: "object",
      description: "Messages d'erreur personnalisés pour chaque type d'erreur",
    },

    // Links
    redirectTo: {
      type: "string",
      defaultValue: "/auth/oauth-callback",
      description: "URL vers laquelle rediriger après le login oAuth",
    },
    redirectAfterSignUp: {
      type: "string",
      description:
        "URL de redirection après inscription réussie (laisser vide = pas de redirection). Ex: page d'onboarding employeur sur /register-company.",
    },

    // Propriétés pour la checkbox
    privacyPolicyText: {
      type: "string",
      defaultValue: "J'accepte la politique de confidentialité",
    },
    privacyPolicyUrl: {
      type: "string",
      defaultValue: "",
      description: "URL de la politique de confidentialité",
    },

    // Buttons
    buttonStyle: {
      type: "choice",
      defaultValue: "primary",
      options: ["primary", "secondary", "tertiary"],
      description: "Style du bouton de soumission",
    },
    submitButtonText: {
      type: "string",
      defaultValue: "S'inscrire",
    },
    buttonAbordStyle: {
      type: "choice",
      defaultValue: "tertiary",
      options: ["primary", "secondary", "tertiary"],
      description: "Style du bouton d'abandon",
    },
    googleButtonText: {
      type: "string",
      defaultValue: "GOOGLE",
      description: "Texte du bouton Google",
    },
    appleButtonText: {
      type: "string",
      defaultValue: "APPLE",
      description: "Texte du bouton Apple",
    },
    oAuthButtonsPosition: {
      type: "choice",
      options: ["top", "bottom"],
      defaultValue: "bottom",
      description: "Position des boutons OAuth",
    },
    oAuthSeparatorText: {
      type: "string",
      defaultValue: "ou",
      description: "Texte du séparateur OAuth",
    },

    // Show / hide
    showLabels: {
      type: "boolean",
      defaultValue: true,
      description: "Afficher les labels des champs",
    },
    showPhone: {
      type: "boolean",
      defaultValue: false,
      description: "Affiche ou non le champ téléphone",
    },
    showPasswordStrength: {
      type: "boolean",
      defaultValue: true,
    },
    showPasswordToggle: {
      type: "boolean",
      defaultValue: true,
      description: "Affiche un bouton pour montrer/masquer le mot de passe",
    },
    showGoogleButton: {
      type: "boolean",
      defaultValue: false,
      description: "Affiche ou non le bouton Google",
    },
    showAppleButton: {
      type: "boolean",
      defaultValue: false,
      description: "Affiche ou non le bouton Apple",
    },
    showPrivacyPolicy: {
      type: "boolean",
      defaultValue: true,
    },
    showLoginLink: {
      type: "boolean",
      defaultValue: true,
      description: "Afficher le lien vers la page de connexion",
    },
    showAlerts: {
      type: "boolean",
      defaultValue: true,
      description: "Affiche des alertes pour les erreurs et succès",
    },

    // Events handlers
    onSubmit: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
    onFirstNameChange: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
    onLastNameChange: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
    onEmailChange: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
    onPhoneChange: {
      type: "eventHandler",
      argTypes: [{ name: "value", type: "string" }],
      description:
        "Fonction appelée lorsque le numéro de téléphone change (optionnel)",
      required: false,
    },
    onCountryCodeChange: {
      type: "eventHandler",
      argTypes: [{ name: "value", type: "string" }],
      description: "Fonction appelée lorsque le code pays change (optionnel)",
      required: false,
    },
    onPasswordChange: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
    onConfirmPasswordChange: {
      type: "eventHandler",
      argTypes: [{ name: "value", type: "string" }],
    },
    onAlertClose: {
      type: "eventHandler",
      argTypes: [{ name: "id", type: "string" }],
      description: "Fonction appelée lorsqu'une alerte est fermée",
    },
  },

  // States
  states: {
    email: {
      type: "writable",
      variableType: "text",
      valueProp: "email",
      onChangeProp: "onEmailChange",
    },
    firstName: {
      type: "writable",
      variableType: "text",
      valueProp: "firstName",
      onChangeProp: "onFirstNameChange",
    },
    lastName: {
      type: "writable",
      variableType: "text",
      valueProp: "lastName",
      onChangeProp: "onLastNameChange",
    },
    password: {
      type: "writable",
      variableType: "text",
      valueProp: "password",
      onChangeProp: "onPasswordChange",
    },
    confirmPassword: {
      type: "writable",
      variableType: "text",
      valueProp: "confirmPassword",
      onChangeProp: "onConfirmPasswordChange",
    },
    phone: {
      type: "writable",
      variableType: "text",
      valueProp: "phone",
      onChangeProp: "onPhoneChange",
    },
    countryCode: {
      type: "writable",
      variableType: "text",
      valueProp: "countryCode",
      onChangeProp: "onCountryCodeChange",
      defaultValue: "+33",
    },
  },
};

export default SignUpMeta;
