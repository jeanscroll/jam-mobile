import { blob } from "stream/consumers";
import { tokens } from "./tokens-jam";
import { AlignCenter } from "lucide-react";
import { px } from "framer-motion";

export const getTokenValue = (name: string) =>
	tokens.find((token) => token.name === name)?.value || name;

export const presets = {
	// Wrappers
	wrappers: {
		simple: {
			padding: "32px",
			borderRadius: "8px",
			backgroundColor: getTokenValue("tertiary"),
			boxShadow: "none",
			rowGap: "32px",
		},
		card: {
			padding: "48px",
			backgroundColor: getTokenValue("white-500"),
			borderRadius: "24px",
			rowGap: "24px",
			minHeight: "auto",
			width: "100%",
			maxWidth: "640px",
			textAlign: "left",
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			boxShadow: getTokenValue("shadow-medium"),
			border: `1px solid ${getTokenValue("sand-200-borders")}`,
			margin: "0 auto",
			boxSizing: "border-box",
			"@media (max-width: 768px)": {
				padding: "24px",
				maxWidth: "100%",
				margin: "0 16px",
				minWidth: "auto",
				rowGap: "16px",
			},
		},
		custom: {
			padding: "48px",
			borderRadius: "16px",
			backgroundColor: getTokenValue("secondary"),
			boxShadow: getTokenValue("shadow-small"),
		},
		signUpCard: {
			backgroundColor: getTokenValue("white-500"),
			maxWidth: "640px",
			width: "100%",
			margin: "0 auto",
			padding: "48px",
			borderRadius: "24px",
			boxShadow: getTokenValue("shadow-medium"),
			"@media (max-width: 768px)": {
				padding: "24px",
				maxWidth: "100%",
				margin: "0 16px",
			},
		},
		accountCard: {
			display: "flex",
			flexDirection: "column",
			rowGap: "20px",
			backgroundColor: getTokenValue("white-500"),
			width: "1191px",
			maxWidth: "100%",
			maxHeight: "640px",
			padding: "64px",
			borderRadius: "24px",
			boxSizing: "border-box",
		},
	},

	separatorHr: {
		flex: 1,
		borderBottom: "1px solid #ccc",
	},
	separatorText: {
		margin: "0 8px",
		fontSize: "14px",
		color: "#666",
	},
	linkSignupBottom: {
		display: "flex",
		justifyContent: "center",
		width: "100%",
		marginTop: "24px",
	},

	linkSignupBottomText: {
		color: "#002400",
		fontSize: "14px",
		fontWeight: "500",
		textDecoration: "none",
		cursor: "pointer",
	},

	// typography
	heading1: {
		fontFamily: "Manrope, sans-serif",
		fontWeight: "bold",
		fontSize: "48px",
		lineHeight: "120%",
		color: "#000000",
	},
	heading2: {
		fontFamily: "Improvise, sans-serif",
		fontWeight: "bold",
		fontSize: "40px",
		lineHeight: "130%",
		color: getTokenValue("primary"),
	},
	heading3: {
		fontFamily: "Improvise, sans-serif",
		fontWeight: "normal",
		fontSize: "32px",
		lineHeight: "140%",
		color: getTokenValue("primary"),
	},

	passwordInputWrapper: {
		position: "relative",
		display: "flex",
		flexDirection: "column",
		rowGap: "12px",
		marginBottom: "24px",
	},

	// à ranger
	togglePasswordVisibility: {
		position: "absolute",
		right: "12px",
		top: "50%",
		transform: "translateY(-50%)",
		color: getTokenValue("grey-500"),
		cursor: "pointer",
		zIndex: 1,
	},

	checkPassword: {
		fontFamily: "Manrope, sans-serif",
		fontWeight: "500",
		fontSize: "14px",
		color: getTokenValue("black"),
		lineHeight: "1.4",
		display: "flex",
		gap: "8px",
		alignItems: "center",
	},

	// Buttons
	buttons: {
		primary: {
			backgroundColor: getTokenValue("primary"),
			color: getTokenValue("white-500"),
			fontFamily: "Manrope, sans-serif",
			width: "100%",
			height: "52px",
			fontWeight: "bold",
			fontSize: "18px",
			lineHeight: "24px",
			borderRadius: "16px",
			cursor: "pointer",
			"@media (max-width: 768px)": {
				height: "36px",
				fontSize: "14px",
				borderRadius: "8px",
			},
		},
		secondary: {
			backgroundColor: getTokenValue("secondary"),
			color: getTokenValue("primary"),
			fontFamily: "Manrope, sans-serif",
			fontWeight: "bold",
			fontSize: "16px",
			padding: "12px 20px",
			borderRadius: "8px",
			border: `1px solid ${getTokenValue("sand-200-borders")}`,
			cursor: "pointer",
			maxWidth: "322px",
		},
		tertiary: {
			backgroundColor: "transparent",
			color: getTokenValue("information-text"),
			fontFamily: "Manrope, sans-serif",
			fontWeight: "bold",
			fontSize: "16px",
			width: "100%",
			textAlign: "center",
			border: "none",
			cursor: "pointer",
		},
		submitButton: {
			padding: "12px",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			gap: "8px",
			backgroundColor: getTokenValue("primary"),
			color: getTokenValue("white-500"),
			border: "none",
			borderRadius: "16px",
			cursor: "pointer",
			fontWeight: "500",
			marginTop: "8px",
			height: "48px",
			fontSize: "15px",
			letterSpacing: "0.5px",
			hover: {
				opacity: "0.9",
			},
		},
		oAuthButton: {
			flex: 1,
			border: "1px solid #E5E7EB",
			backgroundColor: getTokenValue("white-500"),
			color: getTokenValue("grey-900"),
			fontWeight: "500",
			borderRadius: "4px",
			height: "40px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			padding: "8px 16px",
			gap: "8px",
			fontSize: "14px",
			cursor: "pointer",
			transition: "all 0.2s ease",
			hover: {
				backgroundColor: getTokenValue("grey-50"),
			},
		},
	},

	// Inputs
	inputField: {
		marginBottom: "8px",
		width: "100%",
		"@media (max-width: 768px)": {
			marginBottom: "6px",
		},
		rowGap: "0px",
	},
	inputGroup: {
		display: "flex",
		flexDirection: "row",
		gap: "8px",
		width: "100%",
		marginTop: "12px",
		marginBottom: "8px",
	},
	nameInputGroup: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		gap: "16px",
		width: "100%",
		marginBottom: "16px",
		"@media (max-width: 768px)": {
			flexDirection: "column",
			gap: "8px",
			marginBottom: "8px",
		},
	},
	inputs: {
		simple: {
			padding: "16px",
			width: "100%",
			height: "56px",
			color: getTokenValue("information-text"),
			borderRadius: "16px",
			borderColor: getTokenValue("grey-200"),
			borderWidth: "1px",
			fontSize: "16px",
			backgroundColor: getTokenValue("white-500"),
			focus: {
				outline: "none",
				borderColor: getTokenValue("primary"),
				boxShadow: getTokenValue("shadow-focus"),
			},
			"@media (max-width: 768px)": {
				padding: "12px",
				height: "48px",
				fontSize: "15px",
				borderRadius: "8px",
			},
		},
		advance: {
			fontSize: "16px",
			padding: "12px",
			border: `1px solid ${getTokenValue("primary")}`,
			borderRadius: "8px",
			width: "100%",
			backgroundColor: getTokenValue("grey-50"),
		},
	},

	selectStyle: {
		padding: "12px",
		width: "100%",
		height: "48px",
		color: getTokenValue("grey-400"),
		borderRadius: "8px",
		borderColor: getTokenValue("grey-200"),
		borderWidth: "1px",
		fontSize: "15px",
		backgroundColor: getTokenValue("white-500"),
		appearance: "none", // Supprime les styles natifs du navigateur pour une meilleure personnalisation
		cursor: "pointer",
		focus: {
			outline: "none",
			borderColor: getTokenValue("primary"),
			boxShadow: getTokenValue("shadow-focus"),
		},
	},

	textareaStyle: {
		padding: "12px",
		width: "100%",
		height: "120px", // Ajuste la hauteur pour un textarea
		color: getTokenValue("grey-400"),
		borderRadius: "8px",
		borderColor: getTokenValue("grey-200"),
		borderWidth: "1px",
		fontSize: "15px",
		backgroundColor: getTokenValue("white-500"),
		resize: "vertical", // Permet de redimensionner verticalement le textarea
		focus: {
			outline: "none",
			borderColor: getTokenValue("primary"),
			boxShadow: getTokenValue("shadow-focus"),
		},
	},

	// Forms
	form: {
		display: "flex",
    flexDirection: "column",
		rowGap: "16px",
	},

	formLabel: {
		fontFamily: "DM Sans,sans-serif",
		fontSize: "18px",
		fontWeight: "500",
		color: getTokenValue("black"),
		lineHeight: "24px",
		textAlign: "left",
		verticalAlign: "top",
		marginBottom: "8px",
		display: "block",
		"@media (max-width: 768px)": {
			fontSize: "14px",
			lineHeight: "20px",
			marginBottom: "4px",
		},
	},

	formMessage: {
		fontSize: getTokenValue("font-size-sm"),
		color: getTokenValue("grey-500"),
		marginTop: "-8px",
	},

	// Links
	links: {
		linkLeft: {
			color: getTokenValue("information-text"),
			textDecoration: "none",
			fontWeight: "bold",
			cursor: "pointer",
			alignSelf: "flex-start",
			fontSize: "16px",
		},
		linkRight: {
			color: getTokenValue("information-text"),
			textDecoration: "none",
			fontWeight: "bold",
			cursor: "pointer",
			alignSelf: "flex-end",
		},
	},

	// Others
	passwordHint: {
		fontSize: "13px",
		color: "black",
		marginTop: "0px",
		marginBottom: "24px",
	},

	requiredField: {
		content: "*",
		color: getTokenValue("danger-text"),
		marginLeft: "2px",
		fontSize: "16px",
		position: "relative",
		top: "2px",
	},

	accountInfos: {
		fontFamily: "Manrope, sans-serif",
		fontWeight: "regular",
		fontSize: "12px",
		lineHeight: "130%",
		color: getTokenValue("grey-600"),
	},

	// Strength Bar
	strengthBars: {
		display: "flex",
		gap: "4px",
		marginTop: "-8px",
		paddingBottom: "16px",
	},

	strengthBar: {
		width: "25%",
		height: "6px",
		backgroundColor: getTokenValue("grey-300"),
		borderRadius: "16px",
		transition: "background-color 0.3s ease",
	},

	strengthBarFilled: {
		backgroundColor: getTokenValue("success-text"),
	},

	strengthBarFilledFirst: {
		backgroundColor: getTokenValue("success-text"),
	},

	// Phone Input Group
	phoneInputGroup: {
		display: "flex",
		border: `1px solid ${getTokenValue("grey-200")}`,
		borderRadius: "12px",
		overflow: "hidden",
		height: "56px",
		backgroundColor: getTokenValue("white-500"),
		"@media (max-width: 768px)": {
			height: "48px",
			borderRadius: "8px",
		},
	},

	phoneSelector: {
		minWidth: "130px",
		display: "flex",
		alignItems: "center",
		padding: "0 20px",
		backgroundColor: getTokenValue("white-500"),
		border: "none",
		borderRight: `1px solid ${getTokenValue("grey-200")} !important`,
		position: "relative",
		"@media (max-width: 768px)": {
			minWidth: "120px",
			padding: "0 16px",
		},
	},

	phoneInput: {
		flex: 1,
		padding: "10px 24px",
		border: "none",
		outline: "none",
		fontSize: "16px",
		"@media (max-width: 768px)": {
			padding: "10px 20px",
			fontSize: "15px",
		},
	},

	checkboxGroup: {
		display: "flex",
		alignItems: "center",
		gap: "5px",
		margin: "4px 0",
	},

	checkboxLabel: {
		fontSize: "16px",
		color: getTokenValue("black"),
	},

	oAuthContainer: {
		width: "100%",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		marginTop: "16px",
	},

	separator: {
		position: "relative",
		width: "100%",
		textAlign: "center",
		margin: "16px 0",
		color: getTokenValue("grey-600"),
		fontSize: "14px",
	},

	oAuthButtons: {
		display: "flex",
		gap: "16px",
		width: "100%",
		marginTop: "16px",
		marginBottom: "16px",
		backgroundColor: getTokenValue("white-500"),
		"@media (max-width: 768px)": {
			flexDirection: "column",
			gap: "8px",
			marginTop: "8px",
			marginBottom: "8px",
		},
	},

	oAuthButton: {
		flex: "1 1 0",
		height: "56px",
		borderRadius: "28px",
		border: "1px solid #E5E7EB",
		backgroundColor: getTokenValue("white"),
		color: getTokenValue("black-500"),
		fontWeight: "500",
		fontSize: "16px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "12px",
		cursor: "pointer",
		padding: "0 24px",
		boxSizing: "border-box",
		width: "100%",
		maxWidth: "100%",
		"@media (max-width: 768px)": {
			height: "44px",
			borderRadius: "24px",
			fontSize: "14px",
			padding: "0 16px",
			gap: "8px",
		},
	},

	oAuthButton2: {
		flex: "1 1 0",
		height: "56px",
		borderRadius: "28px",
		border: "1px solid #E5E7EB",
		backgroundColor: getTokenValue("white-500"),
		color: getTokenValue("black-500"),
		fontWeight: "500",
		fontSize: "16px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "12px",
		cursor: "pointer",
		padding: "0 24px",
		boxSizing: "border-box",
		width: "100%",
		maxWidth: "100%",
		boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
		hover: {
			backgroundColor: getTokenValue("gray-200"),
		},
	},

	inputGroupItem: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
	},

	loginLinkContainer: {
		marginTop: "8px",
		textAlign: "center",
	},

	loginLink: {
		color: getTokenValue("primary"),
		textDecoration: "none",
		fontWeight: "500",
		fontSize: getTokenValue("font-size-sm"),
	},
	linkRegister: {
		color: getTokenValue("information-text"),
		fontSize: "14px",
		fontWeight: "500",
		textDecoration: "none",
		cursor: "pointer",
	},

	arrowIcon: {
		fontSize: "18px",
		marginLeft: "4px",
	},

	checkboxStyle: {
		display: "flex" as const,
		alignItems: "center" as const,
		gap: "12px",
		fontFamily: "system-ui, -apple-system, sans-serif",
		fontSize: "16px",
		lineHeight: "1.5",
		cursor: "pointer" as const,
		userSelect: "none" as const,
	},

	customCheckboxStyle: {
		position: "relative" as const,
		width: "20px",
		height: "20px",
		border: "2px solid #002400",
		borderRadius: "6px",
		backgroundColor: "white",
		display: "flex" as const,
		alignItems: "center" as const,
		justifyContent: "center" as const,
		flexShrink: 0,
		transition: "all 0.2s ease",
		cursorPointer: "pointer" as const,
	},

	checkmarkStyleBase: {
		color: "#002400",
		fontSize: "16px",
		fontWeight: "bold" as const,
		transition: "opacity 0.2s ease",
	},

	labelTextStyle: {
		color: "#333",
		fontSize: "16px",
	},

	privacyLinkStyle: {
		color: "#002400",
		fontWeight: "600" as const,
		textDecoration: "none" as const,
		cursor: "pointer" as const,
	},

	hiddenInputStyle: {
		position: "relative" as const,
		opacity: 0,
		cursor: "pointer" as const,
		height: 0,
		width: 0,
	},
};
