const AlertManagerMeta = {
  name: "AlertManager",
  section: "🔔 Alerts",
  displayName: "Alert Manager",
  description: "Gestionnaire d'alertes pour les formulaires d'authentification et autres composants",
  thumbnailUrl: "https://plasmic-api.agence-scroll.com/alert-manager.png",
  props: {
    alerts: {
      type: "array",
      defaultValue: [],
      description: "Tableau d'objets d'alerte à afficher",
    },
    position: {
      type: "choice",
      options: ["top", "bottom", "inline"],
      defaultValue: "top",
      description: "Position des alertes dans le composant parent",
    },
    onClose: {
      type: "eventHandler",
      argTypes: [{ name: "id", type: "string" }],
      description: "Fonction appelée lorsqu'une alerte est fermée",
    },
    maxAlerts: {
      type: "number",
      defaultValue: 3,
      description: "Nombre maximum d'alertes à afficher simultanément",
    },
    className: {
      type: "string",
      defaultValue: "",
      description: "Classes CSS supplémentaires à appliquer",
    },
  },
  importPath: "./components/alerts/AlertManager/AlertManager",
};

export default AlertManagerMeta; 