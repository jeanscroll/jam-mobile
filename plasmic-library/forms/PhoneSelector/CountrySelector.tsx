import * as React from "react";
import { CountryCode, countries } from "./countries";
import { useCountryFlag } from "./useCountryFlag";
import Image from "next/image";


interface CountrySelectorProps {
  onChange?: (dialCode: string, country: string) => void;
}

function CountrySelector({ onChange }: CountrySelectorProps) {
  // Par défaut France (+33)
  const defaultCountry = countries.find(c => c.dialCode === "+33") || countries[0];
  const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(defaultCountry);
  const flagUrl = useCountryFlag(selectedCountry.code === "UK" ? "gb" : selectedCountry.code);

  React.useEffect(() => {
    if (onChange) {
      onChange(selectedCountry.dialCode, selectedCountry.name);
    }
  }, [selectedCountry, onChange]);

  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="flex flex-1 gap-1 px-3.5 py-2.5 bg-white rounded-2xl size-full">
        <div className="flex gap-2 justify-center items-center h-full">
          <img
            src={flagUrl}
            alt={`Flag of ${selectedCountry.name}`}
            className="w-auto h-6"
            width={24}
            height={24}
          />
          <select
            aria-label="Select country code"
            value={selectedCountry.dialCode}
            onChange={(e) => {
              const found = countries.find((country) => country.dialCode === e.target.value);
              if (found) setSelectedCountry(found);
            }}
            className="self-stretch my-auto bg-transparent border-none text-black"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.dialCode}>
                {country.code} ({country.dialCode})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default CountrySelector;