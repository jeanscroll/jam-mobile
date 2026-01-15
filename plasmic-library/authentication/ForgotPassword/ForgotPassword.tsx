import * as React from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import { useState } from "react";
import { presets } from "@/styles/presets";
import Link from "next/link";

export interface ForgotPasswordProps {
  wrapperStyle?: "simple" | "card" | "custom";
  buttonSubmitStyle?: "primary" | "secondary" | "tertiary";
  buttonAbordStyle?: "primary" | "secondary" | "tertiary";
  inputStyle?: "simple" | "advance";
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;

  // Titre
  titleHeading?: "h1" | "h2" | "h3";
  title?: string;

  // Icone du bouton de soumission
  submitButtonIcon?: React.ReactNode;
  submitButtonIconPosition?: "left" | "right"; // Default: right


  // Champ email
  emailLabel?: string;
  placeholderEmail?: string;
  onEmailChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // Bouton de soumission
  submitButtonText?: string;
  cancelButtonText?: string;

  // Texte explicatif
  descriptionText?: string;
}

function ForgotPassword_(
  {
    wrapperStyle = "card",
    buttonSubmitStyle = "primary",
    buttonAbordStyle = "tertiary",
    inputStyle = "simple",
    onSubmit,

    // Icone du bouton de soumission
    submitButtonIcon,
    submitButtonIconPosition = "right",


    titleHeading = "h1",
    title = "Mot de passe oublié ?",

    emailLabel = "Email",
    placeholderEmail = "Entrez votre email",
    onEmailChange,

    submitButtonText = "Réinitialiser",
    cancelButtonText = "Annuler",
    descriptionText = "Pas de panique, nous allons vous envoyer un e-mail pour vous aider à réinitialiser votre mot de passe.", // Valeur par défaut
  }: ForgotPasswordProps,
  ref: HTMLElementRefOf<"div">
) {
  const [emailState, setEmail] = useState("");

  // Utiliser une fonction pour rendre le titre au lieu de créer une variable qui référence la chaîne de caractères
  const renderTitle = () => {
    switch (titleHeading) {
      case 'h1':
        return <h1 style={presets.heading1 as React.CSSProperties}>{title}</h1>;
      case 'h2':
        return <h2 style={presets.heading2 as React.CSSProperties}>{title}</h2>;
      case 'h3':
        return <h3 style={presets.heading3 as React.CSSProperties}>{title}</h3>;
      default:
        return <h1 style={presets.heading1 as React.CSSProperties}>{title}</h1>;
    }
  };

  // Modifié pour éviter le problème de DataCloneError
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Solution pour éviter l'erreur DataCloneError:
    // Au lieu de passer l'événement original, créer un objet simplifié
    if (onEmailChange) {
      // Créer un objet simplifié qui imite l'événement de changement
      const simpleEvent = {
        target: {
          value: value,
          name: e.target.name,
          id: e.target.id
        },
        currentTarget: {
          value: value,
          name: e.target.name,
          id: e.target.id
        },
        preventDefault: () => { },
        stopPropagation: () => { }
      } as React.ChangeEvent<HTMLInputElement>;

      onEmailChange(simpleEvent);
    }
  };

  return (
    <div
      ref={ref}
      style={presets.wrappers[wrapperStyle] as React.CSSProperties}
    >
      {renderTitle()}

      <p style={{ ...(presets.formMessage as React.CSSProperties), color: "#000" }}>
        {descriptionText}
      </p>


      <form
        onSubmit={(event) => { event.preventDefault(); onSubmit?.(event); }}
        style={{ display: "flex", flexDirection: "column", rowGap: presets.form.rowGap }}
      >
        <div style={{ ...presets.inputField } as React.CSSProperties}>
          <label style={presets.formLabel as React.CSSProperties} htmlFor="email">{emailLabel}</label>
          <input
            type="email"
            id="email"
            placeholder={placeholderEmail}
            style={presets.inputs[inputStyle] as React.CSSProperties}
            value={emailState}
            onChange={handleEmailChange}
          />
        </div>
        <button
          type="submit"
          style={{
            ...(presets.buttons[buttonSubmitStyle] as React.CSSProperties),
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px", // espace entre texte et icône
          }}
        >
          {submitButtonIconPosition === "left" && submitButtonIcon}
          {submitButtonText}
          {submitButtonIconPosition !== "left" && submitButtonIcon}
        </button>

      </form>

      <Link href="/login">
        <button
          type="button"
          style={presets.buttons[buttonAbordStyle] as React.CSSProperties}
        >
          {cancelButtonText}
        </button>
      </Link>
    </div>
  );
}

const ForgotPassword = React.forwardRef(ForgotPassword_);
export default ForgotPassword;