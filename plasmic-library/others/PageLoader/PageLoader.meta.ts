const PageLoaderMeta = {
  name: "PageLoader",
  section: "📍 Utils",
  displayName: "Page Loader",
  description: "Déclenche une action au chargement de la page",
  thumbnailUrl: "https://static1.plasmic.app/insertables/modal.svg",
  props: {
    shouldRun: {
      type: "boolean",
      defaultValue: true,
      description: "Exécuter l'action ?",
    },
    onMount: {
      type: "eventHandler",
      description: "Action à exécuter au chargement",
      argTypes: [],
    },
  },
  importPath: "./components/others/PageLoader/PageLoader",
};

export default PageLoaderMeta;
