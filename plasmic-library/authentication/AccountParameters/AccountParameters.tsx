import type * as React from "react";
import { forwardRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { presets } from "@/styles/presets";
import AlertManager, { type AlertType, type AlertMessage } from "../../alerts/AlertManager/AlertManager";

export interface AccountParametersProps {
  inputStyle?: "simple" | "advance";

  firstName: string;
  lastName: string;
  email: string;
  role: string;
  
  passwordLabel?: string;
    repeatPasswordLabel?: string;
    buttonSubmitStyle?: "primary" | "secondary" | "tertiary";
    submitButtonText?: string;
    showPasswordToggle?: boolean;
    eyeIconColor?: string;
    showAlerts?: boolean;
    alertPosition?: 'top' | 'bottom' | 'inline';
    maxAlerts?: number;
    customErrorMessages?: {
      weakPassword?: string;
      passwordMismatch?: string;
      resetTokenInvalid?: string;
      resetTokenExpired?: string;
      networkError?: string;
    };
    resetSuccessMessage?: string;
    onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
    onAlertClose?: (id: string) => void;
}

const AccountParameters = forwardRef<HTMLDivElement, AccountParametersProps>(
  ({ 
    inputStyle = "simple",
    firstName,
    lastName,
    email,
    role,

    passwordLabel= "Nouveau mot de passe*",
    repeatPasswordLabel= "Répétez le mot de passe*",
    submitButtonText = "Enregistrer le nouveau mot de passe",
    buttonSubmitStyle = "secondary",
    showPasswordToggle = true,
    eyeIconColor = "#666",
    showAlerts = true,
    alertPosition = 'top',
    maxAlerts = 3,
    customErrorMessages,
    resetSuccessMessage = "Votre mot de passe a été réinitialisé avec succès!",
    onAlertClose,
    onSubmit,
  }, ref) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [alerts, setAlerts] = useState<AlertMessage[]>([]);

const defaultErrorMessages = {
    weakPassword: "Le mot de passe est trop faible. Utilisez au moins 8 caractères avec des lettres, chiffres et symboles.",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    resetTokenInvalid: "Le lien de réinitialisation n'est pas valide",
    resetTokenExpired: "Le lien de réinitialisation a expiré",
    networkError: "Une erreur réseau s'est produite. Veuillez réessayer."
  };

  const errorMessages = { ...defaultErrorMessages, ...customErrorMessages };

  const addAlert = (type: AlertType, message: string) => {
    const id = Date.now().toString();
    setAlerts(prevAlerts => [...prevAlerts, { id, type, message }]);
    return id;
  };

  const removeAlert = (id: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
    if (onAlertClose) onAlertClose(id);
  };

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    checkPasswordStrength(value);
  }, []);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const checkPasswordStrength = (password: string) => {
    const criteria = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
    const hasMinLength = password.length >= 8;
    const criteriaCount = criteria.filter(regex => regex.test(password)).length;
    const strength = hasMinLength ? criteriaCount : Math.min(criteriaCount, 2);
    setPasswordStrength(strength);
  };

  const getStrengthColor = (strength: number) => {
    switch (strength) {
      case 1: return "#ff4d4d";
      case 2: return "#ffaa00";
      case 3: return "#c9d64f";
      case 4: return "#4caf50";
      default: return "#ddd";
    }
  };

  const renderStrengthBars = () => {
    const bars = [];
    for (let i = 0; i < 4; i++) {
      bars.push(
        <div
          key={i}
          style={{
            ...presets.strengthBar,
            backgroundColor: i < passwordStrength ? getStrengthColor(passwordStrength) : "#ddd",
          }}
        />
      );
    }
    return bars;
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <title>Icône d'œil</title> {/* Accessibilité */}
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <title>Icône de vue</title> {/* Accessibilité */}
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  useEffect(() => {
    return () => {
      setAlerts([]);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlerts([]);
    let isValid = true;
    let hasShownError = false;

    if (passwordStrength < 3) {
      isValid = false;
      addAlert('error', errorMessages.weakPassword);
      hasShownError = true;
    }

    if (password !== confirmPassword) {
      isValid = false;
      if (!hasShownError) {
        addAlert('error', errorMessages.passwordMismatch);
      }
    }

    if (isValid && onSubmit) {
      try {
        onSubmit(event);
        addAlert('success', resetSuccessMessage);
      } catch (error) {
        if (error instanceof Error) {
          addAlert('error', error.message || errorMessages.networkError);
        } else {
          addAlert('error', errorMessages.networkError);
        }
      }
    }
  };

    return (
      <div style={presets.wrappers.accountCard as React.CSSProperties} ref={ref}>
        
        {/* Informations utilisateur */}
        <div style={{ columnGap: 110}}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            <strong>Nom</strong>
            <span>{lastName}</span>
          </div>
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            <strong>Prénom</strong>
            <span>{firstName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', marginTop: '10px' }}>
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            <strong>Email</strong>
            <span>{email}</span>
          </div>
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            <strong>Rôle</strong>
            <span>{role}</span>
          </div>
        </div>
      </div>

        <p style={presets.accountInfos}>Ces informations ne peuvent être modifiées que par un Administrateur.</p>
        <hr />

        {/* Formulaire de réinitialisation du mot de passe */}
        {showAlerts && <AlertManager
        alerts={alerts}
        position={alertPosition}
        onClose={removeAlert}
        maxAlerts={maxAlerts}
      />}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", rowGap: presets.form.rowGap }}
      >
        <div style={{ rowGap: presets.inputField.rowGap }}>
          <label style={presets.formLabel as React.CSSProperties} htmlFor="passwordInput">{passwordLabel}</label>
          <div style={presets.passwordInputWrapper as React.CSSProperties}>
            <input
              type={showPassword ? "text" : "password"}
              id="passwordInput"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              style={presets.inputs[inputStyle]}
            />
            {showPasswordToggle && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{ ...presets.togglePasswordVisibility, color: eyeIconColor} as React.CSSProperties}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeIcon /> : <ViewIcon />}
              </button>
            )}
          </div>
          <p style={presets.checkPassword as React.CSSProperties}>Utilisez 8 caractères ou plus en mélangeant lettres, chiffres et symboles.</p>
          <div style={presets.strengthBars}>{renderStrengthBars()}</div>
        </div>

        <div style={{ rowGap: presets.inputField.rowGap }}>
          <label style={presets.formLabel as React.CSSProperties} htmlFor="confirmPassword">{repeatPasswordLabel}</label>
          <div style={presets.passwordInputWrapper as React.CSSProperties}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPasswordInput"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              required
              style={presets.inputs[inputStyle]}
            />
            {showPasswordToggle && (
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                style={{ ...presets.togglePasswordVisibility, color: eyeIconColor } as React.CSSProperties}
                aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showConfirmPassword ? <EyeIcon /> : <ViewIcon />}
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          style={presets.buttons[buttonSubmitStyle] as React.CSSProperties}
        >
          {submitButtonText}
        </button>
      </form>
      </div>
    );
  }
);

export default AccountParameters;
