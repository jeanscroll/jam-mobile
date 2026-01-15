import * as React from "react";
import CountrySelector from "./CountrySelector";
import { useState } from "react";

interface PhoneSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onDialCodeChange?: (dialCode: string, country: string) => void;
}

const PhoneSelector: React.FC<PhoneSelectorProps> = ({ className, onDialCodeChange, ...props }) => {
  const [dialCode, setDialCode] = useState("");
  const [country, setCountry] = useState("");

  const handleCountryChange = (dialCode: string, country: string) => {
    setDialCode(dialCode);
    setCountry(country);
    if (onDialCodeChange) {
      onDialCodeChange(dialCode, country);
    }
  };

  return (
    <main
      role="main"
      className={`flex flex-col text-base font-medium text-black max-w-[147px] ${className}`}
      {...props}
    >
      <CountrySelector onChange={handleCountryChange} />
    </main>
  );
}

export default PhoneSelector;