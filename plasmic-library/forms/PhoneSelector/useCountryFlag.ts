import { useState, useEffect } from "react";

export function useCountryFlag(countryCode: string): string {
    const [flagUrl, setFlagUrl] = useState("");

    useEffect(() => {
        if (countryCode) {
            setFlagUrl(`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`);
        }
    }, [countryCode]);

    return flagUrl;
}