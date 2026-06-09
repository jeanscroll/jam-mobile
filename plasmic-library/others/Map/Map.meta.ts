const MapBoxMeta = {
	section: "🔖 Jam",
	displayName: "MapBox",
	description: "Magnifique carte MapBox",
	thumbnailUrl: "https://plasmic-api.agence-scroll.com/mapbox.png",
	type: "component",
	name: "MapBox",
	props: {
		mapStyle: "string",
		latitude: "number",
		longitude: "number",
		iconUrl: "imageUrl",
		searchAddress: "string",
		zoom: "number",
		markers: {
			type: "object",
			defaultValue: [],
		},
		onPopupClick: {
			type: "eventHandler",
			argTypes: [{ name: "markerData", type: "object" }],
		},
		showLogoInPopup: {
			type: "boolean",
			defaultValue: true,
			description: "Affiche ou non le logo de l'entreprise dans la popup",
		},
		locked: {
			type: "boolean",
			defaultValue: true,
			description: "Bloque le recentrage automatique. Mettre à false via un clic card pour déplacer la carte, puis re-locker via onMoveEnd.",
		},
		onMoveEnd: {
			type: "eventHandler",
			description: "Déclenché quand l'animation flyTo est terminée — utiliser pour re-locker la carte (remettre locked=true).",
			argTypes: [],
		},
	},
	importPath: "./plasmic-library/others/Map/Map",
};
export default MapBoxMeta;
