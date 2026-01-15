import React, { PropsWithChildren, useState, useEffect } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import "tailwindcss/tailwind.css";

interface JamTextInputProps extends PropsWithChildren {
  type?: "default" | "leading text" | "textarea" | "password" | "phone";
  label?: string;
  placeholder?: string;
  hint?: string;
  prefixedtext?: string;
  destructive?: boolean;
  disabled?: boolean;
  iconUrl?: string;
  className?: string;
  text?: string;
  onTextChange?: (value: string) => void;
}

const JamTextInput = ({
  placeholder = "placeholder",
  label,
  type = "default",
  destructive,
  disabled,
  iconUrl,
  prefixedtext,
  hint,
  className,
  text = "",
  onTextChange,
}: JamTextInputProps) => {
  const [focus, setFocus] = useState(false);
  const [inputValue, setInputValue] = useState(text);

  useEffect(() => {
    setInputValue(text);
  }, [text]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInputValue(value);
    if (onTextChange) {
      onTextChange(value);
    }
  };

  const inputVariant = cva(
    "flex w-full transition-all bg-white rounded-2xl items-center",
    {
      variants: {
        destructive: {
          true: "border-1 border-solid border-error-700",
          false: "border-1 border-solid border-pine-500",
        },
        focus: {
          true: "",
          false: "",
        },
      },
      compoundVariants: [
        {
          destructive: true,
          focus: true,
          className: "shadow-[0_0_0_4px_#D92D20]",
        },
        {
          destructive: false,
          focus: true,
          className: "border-1 border-solid border-pine-500 shadow-[0_0_0_4px_#E8FFCC]",
        },
      ],
    }
  );

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const charCode = event.charCode;
    if (
      !(
        (charCode >= 48 && charCode <= 57) ||
        charCode === 32 ||
        charCode === 43 ||
        charCode === 45 ||
        charCode === 40 ||
        charCode === 41
      )
    ) {
      event.preventDefault();
    }
  };

  return (
    <div className="flex flex-col w-full gap-[6px]">
      <label className="text-black text-lg leading-5 font-medium">{label}</label>
      <div className={cn(inputVariant({ destructive, focus }))}>
        {prefixedtext && (
          <span className="text-black text-base font-normal pl-[26px]">
            {prefixedtext}
          </span>
        )}
        {iconUrl && (
          <span className="pl-[14px]">
            <img src={iconUrl} alt="icon" className="h-6 w-6" />
          </span>
        )}
        {type === "default" && (
          <>
            <label htmlFor="textInput" className="sr-only">{label}</label>
            <input
              id="textInput"
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              className={`bg-transparent placeholder:text-grey-500 placeholder:text-lg text-base font-normal w-full flex-1 p-3 outline-none ${className}`}
              disabled={disabled}
            />
          </>
        )}
        {type === "textarea" && (
          <>
            <label htmlFor="textArea" className="sr-only">{label}</label>
            <textarea
              id="textArea"
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              className={`bg-transparent placeholder:text-grey-500 placeholder:text-lg text-base font-normal w-full flex-1 p-3 outline-none min-h-32 ${className}`}
              disabled={disabled}
            />
          </>
        )}
        {type === "phone" && (
          <>
            <label htmlFor="phoneInput" className="sr-only">{label}</label>
            <input
              id="phoneInput"
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={inputValue}
              onChange={handleInputChange}
              className={`bg-transparent placeholder:text-grey-500 placeholder:text-lg text-base font-normal flex-1 p-3 outline-none ${className}`}
              disabled={disabled}
              onKeyPress={handleKeyPress}
            />
          </>
        )}
        {type === "password" && (
          <>
            <label htmlFor="passwordInput" className="sr-only">{label}</label>
            <input
              id="passwordInput"
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              type="password"
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              className={`bg-transparent placeholder:text-grey-500 placeholder:text-lg text-base font-normal w-full flex-1 p-3 outline-none ${className}`}
              disabled={disabled}
            />
          </>
        )}
      </div>
      <p className="text-black text-sm font-normal flex gap-1 items-center">
        {hint && (
          <span className={`flex-1 text-base ${destructive && "text-error-700"}`}>
            {hint}
          </span>
        )}
      </p>
    </div>
  );
};

export default JamTextInput;