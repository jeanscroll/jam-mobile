const LoginMeta = {
  name: "Login",
  section: "1.🔑 Authentication",
  displayName: "Login",
  description: "Un formulaire simple pour se connecter",
  importPath: "./plasmic-library/authentication/Login",
  thumbnailUrl: "http://localhost:29015/library/Login.png",

  props: {

    // Wrapper styles
    wrapperStyle: {
      type: "choice",
      defaultValue: "card",
      options: ["simple", "card", "custom"],
      description: "Style du conteneur global",
    },

    // Espace entre les inputs (et entre inputs et bouton)
    inputGap: {
      type: "string",
      defaultValue: "1rem",
      description: "Espace vertical entre les champs du formulaire (ex: '16px', '2rem', etc.)",
    },

    // Title
    title: {
      type: "string",
      defaultValue: "Connexion",
    },
    titleHeading: {
      type: "choice",
      defaultValue: "h1",
      options: ["h1", "h2", "h3"],
      description: "Choisissez le niveau du titre (h1, h2, h3)",
    },

    // Input style
    inputStyle: {
      type: "choice",
      defaultValue: "simple",
      options: ["simple", "advance"],
      description: "Style des champs de saisie",
    },

    // Email
    emailLabel: {
      type: "string",
      defaultValue: "Email",
    },
    email: {
      type: "string",
      defaultValue: "",
      valueProp: "email",
      onChangeProp: "onEmailChange",
    },
    placeholderEmail: {
      type: "string",
      defaultValue: "Entrez votre email",
    },

    // Password
    passwordLabel: {
      type: "string",
      defaultValue: "Mot de passe",
    },
    password: {
      type: "string",
      defaultValue: "",
      valueProp: "password",
      onChangeProp: "onPasswordChange",
    },
    placeholderPassword: {
      type: "string",
      defaultValue: "Entrez votre mot de passe",
    },

    redirectTo: {
      type: "string",
      defaultValue: "/auth/oauth-callback",
      description: "URL vers laquelle rediriger après le login oAuth",
    },

    // Links
    forgotPasswordText: {
      type: "string",
      defaultValue: "Mot de passe oublié ?",
    },
    createAccountText: {
      type: "string",
      defaultValue: "Créer un compte",
      description: "Texte à afficher pour le lien Créer un compte",
    },
    signUpLinkText: {
      type: "string",
      defaultValue: "Pas encore de compte ? INSCRIPTION",
      description: "Texte à afficher pour le lien Signup du bas",
    },
    forgotPasswordPosition: {
      type: "choice",
      defaultValue: "left",
      options: ["left", "right"],
      description: "Position du lien forgot password",
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
      defaultValue: "Connexion",
    },

    // show / hide
    showCreateAccount: {
      type: "boolean",
      defaultValue: false,
      description: "Affiche ou non le lien Créer un compte",
    },
    showPasswordToggle: {
      type: "boolean",
      defaultValue: true,
      description: "Affiche ou non l'oeil",
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
    showBottomSignupLink: {
      type: "boolean",
      defaultValue: false,
      description: "Affiche ou non le lien signup du bas",
    },

    // Events handlers
    onEmailChange: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
    onPasswordChange: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
    onSubmit: {
      type: "eventHandler",
      argTypes: [{ name: "event", type: "object" }],
    },
    onError: {
      type: "eventHandler",
      argTypes: [{ name: "error", type: "object" }],
      description: "Appelé lorsqu'une erreur se produit dans le composant",
    },
  },

  // States
  states: {
    email: {
      type: 'writable',
      variableType: 'text',
      valueProp: 'email',
      onChangeProp: 'onEmailChange'
    },
    password: {
      type: 'writable',
      variableType: 'text',
      valueProp: 'password',
      onChangeProp: 'onPasswordChange'
    },
  },
};

export default LoginMeta;
