import * as React from "react";
import CountrySelector from "./CountrySelector";

interface PhoneSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onDialCodeChange?: (dialCode: string, country: string) => void;
}

const PhoneSelector: React.FC<PhoneSelectorProps> = ({ className, onDialCodeChange, ...props }) => {
  return (
    <div
      className={`flex items-center h-full ${className ?? ""}`}
      {...props}
    >
      <CountrySelector onChange={onDialCodeChange} />
    </div>
  );
};

export default PhoneSelector;
