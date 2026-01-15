const JamDatePickerMeta = {
    name: "JamDatePicker",
    section: "🔖 Jam",
    displayName: "Jam Date Picker",
    description: "Sélecteur de date et heure basé sur Ant Design pour le projet Job Around Me",
    thumbnailUrl: "https://static1.plasmic.app/insertables/calendar.svg",
    props: {
        type: {
            type: "choice",
            options: ["date", "time", "datetime"],
            defaultValue: "date",
            description: "Type de sélecteur : date, time ou datetime",
        },
        label: {
            type: "string",
            description: "Libellé affiché au-dessus du champ",
        },
        placeholder: {
            type: "string",
            description: "Texte d'indication dans le champ",
        },
        hint: {
            type: "string",
            description: "Texte d'aide affiché sous le champ",
        },
        value: {
            type: "string",
            description: "Valeur initiale (format ISO 8601 ou date lisible)",
        },
        format: {
            type: "string",
            description: "Format d'affichage personnalisé (ex: DD/MM/YYYY, HH:mm)",
        },
        destructive: {
            type: "boolean",
            defaultValue: false,
            description: "Style d'erreur (bordure rouge)",
        },
        disabled: {
            type: "boolean",
            defaultValue: false,
            description: "Désactiver le champ",
        },
        showTime: {
            type: "boolean",
            defaultValue: false,
            description: "Afficher la sélection d'heure (pour type='date')",
        },
        size: {
            type: "choice",
            options: ["small", "middle", "large"],
            defaultValue: "middle",
            description: "Taille du composant",
        },
        allowClear: {
            type: "boolean",
            defaultValue: true,
            description: "Permettre de vider le champ avec un bouton",
        },
        className: {
            type: "string",
            description: "Classes CSS personnalisées",
        },
        onDateChange: {
            type: "eventHandler",
            description: "Fonction appelée lors du changement de date",
            argTypes: [
                {
                    name: "dateString",
                    type: "string",
                    description: "Date formatée en chaîne",
                },
                {
                    name: "dayjs",
                    type: "object",
                    description: "Objet Dayjs de la date sélectionnée",
                },
            ],
        },
    },
    importPath: "./components/forms/JamDatePicker/JamDatePicker",
};

export default JamDatePickerMeta;