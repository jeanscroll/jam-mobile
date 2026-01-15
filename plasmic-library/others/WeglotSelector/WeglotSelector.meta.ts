const WeglotSelectorMeta = {
	section: "🔖 Jam",
	displayName: "Weglot Selector",
	description: "Sélecteur de langue personnalisé pour Weglot",
	thumbnailUrl: "https://plasmic-api.agence-scroll.com/language.png",
	type: "component",
	name: "WeglotSelector",
	props: {
		languages: {
			type: "array",
			defaultValue: ["fr", "en"],
			description: "Codes de langues disponibles (ex: fr, en)",
		},
		labels: {
			type: "object",
			defaultValue: { fr: "Français", en: "English" },
			description: "Libellés d'affichage par code langue",
		},
		defaultLanguage: {
			type: "string",
			defaultValue: "fr",
			description: "Langue sélectionnée par défaut",
		},
		className: "string",
		dropdownDirection: {
			type: "choice",
			options: ["down", "up", "auto"],
			defaultValue: "down",
			description: "Direction d'ouverture du menu",
		},
		onLanguageChange: {
			type: "eventHandler",
			argTypes: [{ name: "lang", type: "object" }],
		},
	},
	importPath: "./plasmic-library/others/WeglotSelector/WeglotSelector",
};

export default WeglotSelectorMeta;
