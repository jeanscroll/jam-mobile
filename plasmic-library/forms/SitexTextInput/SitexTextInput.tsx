// biome-ignore lint/style/useImportType: <explanation>
import React from "react";
import { type PropsWithChildren, useState, useEffect, useCallback } from "react"
import variants from "./variants";
import { cn } from "@/lib/utils";

export interface TextInputProps extends PropsWithChildren {
  nameInErrorMessages?: string,
  type?: "text" | "password" | "tel" | "email",
  placeholder?: string,
  prefixedText?: string,
  destructive?: boolean,
  disabled?: boolean,
  iconUrl?: string,
  className?: string,
  inputClassName?: string,
  errorTextClassName?: string,
  initialValue?: string,
  required?: boolean,
  minLength?: number,
  maxLength?: number,
  customValidation?: string,
  customErrorMessage?: string,
  onTextChange?: (value: string) => void,
  onValidationChange?: (isValid: boolean, value: string) => void
};

const SitexTextInput: React.FC<TextInputProps> = 
({
  type = "text",
  placeholder = "Placeholder",
  initialValue = "",
  destructive = false,
  prefixedText,
  iconUrl,
  className = "",
  inputClassName = "",
  errorTextClassName = "",
  nameInErrorMessages = "",
  required = false,
  minLength,
  maxLength,
  customValidation,
  customErrorMessage,
  onTextChange,
  onValidationChange,
  disabled = false,
}) => {
  const [focus, setFocus] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  // 🏆 Validation de l'input
  const validateInput = useCallback((value: string) => {
    let errorMessage = "";

    if (!value && required) {
      errorMessage = `${nameInErrorMessages} is required.`;
    } else if (minLength && maxLength && minLength === maxLength && value.length !== minLength) {
      errorMessage = `${nameInErrorMessages} must be ${minLength} characters.`;
    } else if (minLength && maxLength && minLength !== maxLength && (value.length < minLength || value.length > maxLength)) {
      errorMessage = `${nameInErrorMessages} must be between ${minLength} and ${maxLength} characters.`;
    } else if (minLength && value.length < minLength) {
      errorMessage = `${nameInErrorMessages} must be at least ${minLength} characters.`;
    } else if (maxLength && value.length > maxLength) {
      errorMessage = `${nameInErrorMessages} must be at most ${maxLength} characters.`;
    } else if (type === "password" && !/^[\w@#$%^&*()+=!-]+$/.test(value)) {
      errorMessage = "Password contains invalid characters.";
    } else if (type === "tel" && !/^\+?[0-9\s\-()]+$/.test(value)) {
      errorMessage = `${nameInErrorMessages} contains invalid characters.`;
    } else if (type === "email" && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
      errorMessage = `${nameInErrorMessages} is not a valid email.`;
    } else if (customValidation) {
      const regex = new RegExp(customValidation);
      if (!regex.test(value)) {
        customErrorMessage = customErrorMessage || `${nameInErrorMessages} contains invalid characters.`;
      }
    }

    setError(errorMessage);
    onValidationChange?.(errorMessage === "", value);
  }, [nameInErrorMessages, minLength, maxLength, type, customValidation, onValidationChange]);
  
  // 🔄 Met à jour la valeur quand initialValue change
  useEffect(() => {
    setInputValue(initialValue);
    validateInput(initialValue);
  }, [initialValue, validateInput]); 

  // Gestion du changement de valeur dans l'input
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInputValue(value);
    validateInput(value);
    onTextChange?.(value);
  }, [validateInput, onTextChange]);

  const handleBlur = useCallback(() => {
    setFocus(false);
    setTouched(true);
    validateInput(inputValue);
  }, [validateInput, inputValue]);

  const handlePhoneInputCharacters = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.target.value = event.target.value.replace(/[^0-9+\-() ]/g, "");
  };

  return (
    <div className="flex flex-col w-full gap-[6px] min-w-[320px]">

      {/* Préfixe de texte (optionnel) */}
      {prefixedText && (
        <span className="text-black text-base font-normal pl-[26px]">
          {prefixedText}
        </span>
      )}

      {/* Icône (optionnelle) */}
      {iconUrl && (
        <span className="pl-[14px]">
          <img src={iconUrl} alt="icon" className="h-4 w-4" />
        </span>
      )}
      
      {/* Champ de saisie */}
      <div className='flex flex-col gap-2'>
        <input
          type={type}
          placeholder={placeholder}
          value={inputValue} // Utilise la valeur de l'état
          onChange={handleInputChange} // Gère le changement
          inputMode={type === "tel" ? "numeric" : undefined} // Optimisation UX pour mobile
          onInput={type === "tel" ? handlePhoneInputCharacters : undefined} // Appliquer le filtre uniquement sur "tel"
          autoComplete={type === "password" ? "new-password" : "off"} // Amélioration UX
          className={cn(
            cn(variants.inputVariant({ destructive, focus })),
            className, inputClassName
          )}
          disabled={disabled}
          aria-disabled={disabled} // Amélioration accessibilité
          onFocus={() => setFocus(true)}
          onBlur={handleBlur}
          minLength={minLength}
          maxLength={maxLength}
        />

        { touched && error && <p className={`text-red-500  ${errorTextClassName}`}>{error}</p> }
      </div>
    </div>
  );
};

SitexTextInput.displayName = "CodeTextInput";

export default SitexTextInput;