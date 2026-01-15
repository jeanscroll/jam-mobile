import * as React from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import { useCallback, useEffect, useState } from "react";
import { presets } from "@/styles/presets";
import Link from "next/link";
import { EyeIcon, ViewIcon } from "@/plasmic-library/icons/icons";
import AuthButton from "@/plasmic-library/buttons/ButtonGoogle/ButtonGoogle";

export interface LoginProps {
  // Wrapper
  wrapperStyle?: "simple" | "card" | "custom";

  // Title
  titleHeading?: "h1" | "h2" | "h3";
  title?: string;

  // Input
  inputStyle?: "simple" | "advance";

  // Email
  email?: string;
  emailLabel?: string;
  placeholderEmail?: string;

  // Password
  password?: string;
  passwordLabel?: string;
  placeholderPassword?: string;
  eyeIconColor?: string;

  redirectTo?: string;

  // Links
  forgotPasswordText?: string;
  createAccountText?: string;
  signUpLinkText?: string;
  forgotPasswordPosition?: 'left' | 'right';

  // Buttons
  buttonStyle?: "primary" | "secondary" | "tertiary";
  submitButtonText?: string;
  
  // OAuth
  googleButtonText?: string;
  appleButtonText?: string;
  oAuthButtonsPosition?: 'top' | 'bottom';
  oAuthSeparatorText?: string;

  // show / hide
  showTitle?: boolean;
  showCreateAccount?: boolean;
  showPasswordToggle?: boolean;
  showGoogleButton?: boolean;
  showAppleButton?: boolean;
  showBottomSignupLink?: boolean;

  // Events handlers
  onEmailChange?: (value: string) => void;
  onPasswordChange?: (value: string) => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => Promise<{ error?: Error | { message: string } } | void>;
  onError?: (error: Error) => void;
}

function Login_(
  props: LoginProps, 
  ref: HTMLElementRefOf<"div">
) {
  const {
    // Wrapper
    wrapperStyle = "card", 

    // Title
    titleHeading = "h1",  
    title = "Connexion",  

    // Input
    inputStyle = "simple", 

    // Email
    emailLabel = "Email",
    placeholderEmail = "Entrez votre email",

    // Password
    passwordLabel = "Mot de passe",
    placeholderPassword = "Entrez votre mot de passe",
    eyeIconColor = "#666",

    redirectTo= "/auth/oauth-callback",

    // Links
    forgotPasswordText = "Mot de passe oublié ?",
    createAccountText = "Créer un compte",
    signUpLinkText = "Pas encore de compte ? INSCRIPTION",
    forgotPasswordPosition = "left",

    // Buttons
    buttonStyle = "primary", 
    submitButtonText = "Connexion",  

    // OAuth
    googleButtonText = "GOOGLE",
    appleButtonText = "APPLE",
    oAuthButtonsPosition = 'bottom',
    oAuthSeparatorText = "ou",

    // show / hide
    showTitle = true,
    showCreateAccount = true,  
    showPasswordToggle = true,
    showGoogleButton = false,
    showAppleButton = false,
    showBottomSignupLink = false,

    // Events handlers
    onEmailChange,  
    onPasswordChange,
    onSubmit,
    onError,
  } = props;
  
  type HeadingKeys = "heading1" | "heading2" | "heading3";

  const headingKey = `heading${titleHeading.slice(1)}` as HeadingKeys;
  const headingStyle = presets[headingKey] || presets.heading1;

  const Title = titleHeading as keyof JSX.IntrinsicElements;
  const [email, setEmail] = useState(props.email || "");
  const [password, setPassword] = useState(props.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identityMatch, setIdentityMatch] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFormError(null);
    if (onEmailChange) onEmailChange(e.target.value);
  }, [onEmailChange]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setFormError(null);
    if (onPasswordChange) onPasswordChange(e.target.value);
  }, [onPasswordChange]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleError = (error: Error) => {
    console.error('Login error:', error);
    setFormError("error");
    onError?.(error);
  };

  const errorMessages = {
    wrongIdentity: "Aucun compte trouvé pour cet email/mot de passe"
   };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      throw new Error("L'email est requis");
    }
    if (!emailRegex.test(email)) {
      throw new Error("Format d'email invalide");
    }
    if (!password) {
      throw new Error("Le mot de passe est requis");
    }
    if (password.length < 6) {
      throw new Error("Le mot de passe doit contenir au moins 6 caractères");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      validateForm();
      setIsSubmitting(true);

      // Vérification préalable sans bloquer la soumission finale
      const response = await fetch('/api/supabase/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 401) {
        // Email/mot de passe invalide → affichage d’un message
        setFormError('wrongIdentity');
        setIdentityMatch(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification des identifiants');
      }

      // ✅ Identifiants OK → on laisse Plasmic gérer la suite
      setFormError(null);
      setIdentityMatch(true);

      // Appelle le callback `onSubmit` fourni par Plasmic Studio (il gère login + redirection)
      if (onSubmit) {
        const submitResult = await onSubmit(event);
        if (submitResult && submitResult.error) {
          throw typeof submitResult.error === "string"
            ? new Error(submitResult.error)
            : new Error(submitResult.error.message);
        }
      }

    } catch (error) {
      setFormError('wrongIdentity');
      setIdentityMatch(false);
      console.error("Erreur formulaire :", error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu des boutons OAuth
  const renderOAuthButtons = () => {
    if (!showGoogleButton && !showAppleButton) return null;
    
    return (
      <div style={presets.oAuthButtons as React.CSSProperties}>
        {showGoogleButton && (
          <AuthButton
            label={googleButtonText}
            icon="start"
            iconImage="/google-logo.svg"
            size="large"
            hierarchy="secondary"
            redirectTo={redirectTo}
          />
        )}

        {showAppleButton && (
          <AuthButton
            label={appleButtonText}
            icon="start"
            iconImage="/apple-logo.svg"
            size="large"
            hierarchy="secondary"
            redirectTo={redirectTo}
          />
        )}
       
      </div>
    );
  };

  useEffect(() => {
    setEmail(props.email || "");
  }, [props.email]);

  useEffect(() => {
    setPassword(props.password || "");
  }, [props.password]);

  return (
    <div
      ref={ref}
      style={presets.wrappers[wrapperStyle] as React.CSSProperties}
    >
      {showTitle && ( <Title style={headingStyle}>{title}</Title> )}

      {oAuthButtonsPosition === 'top' && renderOAuthButtons()}

      <form
        onSubmit={handleSubmit}
        style={presets.form as React.CSSProperties}
      >
        <div style={{ rowGap: presets.inputField.rowGap }}>
          <label style={presets.formLabel as React.CSSProperties} htmlFor="email">{emailLabel}</label>
          <input
            type="email"
            id="email"
            placeholder={placeholderEmail}
            style={presets.inputs[inputStyle]} 
            value={email}
            onChange={handleEmailChange}
          />
        </div>

        <div style={ presets.inputField }>
          <label style={presets.formLabel as React.CSSProperties} htmlFor="password">{passwordLabel}</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder={placeholderPassword}
              style={presets.inputs[inputStyle]} 
              value={password}
              onChange={handlePasswordChange}
            />
            {showPasswordToggle && (
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                style={presets.togglePasswordVisibility as React.CSSProperties}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeIcon /> : <ViewIcon />}
              </button>
            )}
          </div>

          {formError && (
            <small style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
              {formError === 'wrongIdentity' ? errorMessages.wrongIdentity : formError}
            </small>
          )}
        </div>

        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          flexDirection: forgotPasswordPosition === "left" ? "row" : "row-reverse" 
        }}>
          <Link href="/forgot-password"><span style={presets.links.linkLeft}>{forgotPasswordText}</span></Link>

          {showCreateAccount && (
            <Link href="/signup"><span style={presets.links.linkRight}>{createAccountText}</span></Link>
          )}
        </div>

        <button 
          type="submit" 
          style={{
            ...presets.buttons[buttonStyle] as React.CSSProperties,
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? "not-allowed" : "pointer"
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Connexion..." : submitButtonText}
        </button>

        {(showGoogleButton || showAppleButton) && oAuthSeparatorText && (
          <div style={presets.separator as React.CSSProperties}>
            <div style={presets.separatorHr as React.CSSProperties} />
              <span style={presets.separatorText as React.CSSProperties}>{oAuthSeparatorText}</span>
           {/* <div style={presets.separatorHr as React.CSSProperties} />*/}
          </div>
        )}

        {oAuthButtonsPosition === 'bottom' && renderOAuthButtons()}
      </form>

      {showBottomSignupLink && (
        <div style={presets.linkSignupBottom}>
          <Link href="/register" style={presets.linkSignupBottomText}>{signUpLinkText}</Link>
        </div>
      )}
    </div>
  );
}

const Login = React.forwardRef(Login_);
export default Login;
