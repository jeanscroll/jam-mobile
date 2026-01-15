import React, { useState, type InputHTMLAttributes } from "react";
import { cn } from "../../../lib/utils";

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showLabel?: boolean;
  label?: string;
  placeholder?: string;
  text?: string;
  state?: "default" | "focused" | "disabled" | "error";
  isMulti?: boolean;
  type?: "email" | "password" | "tel" | "text" | "url";
  icon?: string;
  showIcon?: boolean;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const TextInput = ({
  showLabel = true,
  label = "Input Label",
  placeholder = "Enter text...",
  text = "",
  state = "default",
  isMulti = false,
  type = "text",
  icon,
  showIcon = false,
  className,
  ...props
}: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputClassName = cn(
    "w-full px-4 py-2 border rounded-lg transition-all",
    "placeholder-gray-400 text-gray-900",
    {
      "border-gray-300": state === "default",
      "border-blue-500 ring-2 ring-blue-200": state === "focused" || isFocused,
      "border-red-500": state === "error",
      "bg-gray-100 opacity-50": state === "disabled",
    },
    showIcon && "pl-10",
    className
  );

  const Component = isMulti ? "textarea" : "input";

  return (
    <div className="w-full">
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {showIcon && icon && (
          <img
            src={icon}
            alt=""
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
          />
        )}
        <Component
          {...(props as any)}
          type={type}
          placeholder={placeholder}
          defaultValue={text}
          disabled={state === "disabled"}
          className={inputClassName}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={isMulti ? 4 : undefined}
        />
        {state === "error" && (
          <div className="mt-1 text-sm text-red-600">
            <svg
              className="inline w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Please enter a valid value
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInput;