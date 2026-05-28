import * as React from "react";
import { CountryCode, countries } from "./countries";
import { useCountryFlag } from "./useCountryFlag";
import { ChevronDownIcon } from "@/plasmic-library/icons/icons";


interface CountrySelectorProps {
  onChange?: (dialCode: string, country: string) => void;
}

function CountrySelector({ onChange }: CountrySelectorProps) {
  const defaultCountry = countries.find(c => c.dialCode === "+33") || countries[0];
  const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(defaultCountry);
  const flagUrl = useCountryFlag(selectedCountry.code === "UK" ? "gb" : selectedCountry.code);

  React.useEffect(() => {
    if (onChange) {
      onChange(selectedCountry.dialCode, selectedCountry.name);
    }
  }, [selectedCountry, onChange]);

  return (
    <div className="relative flex items-center gap-1.5 sm:gap-2 h-full select-none">
      <img
        src={flagUrl}
        alt={`Drapeau ${selectedCountry.name}`}
        className="h-5 sm:h-6 w-auto shrink-0 rounded-sm"
        width={24}
        height={24}
      />
      <span className="text-sm sm:text-base font-medium text-black tabular-nums whitespace-nowrap">
        {selectedCountry.dialCode}
      </span>
      <ChevronDownIcon color="#666" />
      <select
        aria-label="Sélectionner l'indicatif pays"
        value={selectedCountry.dialCode}
        onChange={(e) => {
          const found = countries.find((country) => country.dialCode === e.target.value);
          if (found) setSelectedCountry(found);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
      >
        {countries.map((country) => (
          <option key={country.code} value={country.dialCode}>
            {country.code} ({country.dialCode})
          </option>
        ))}
      </select>
    </div>
  );
}

export default CountrySelector;
