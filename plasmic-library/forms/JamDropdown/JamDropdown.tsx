import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";

export interface DropdownProps {
    label: string;
    iconeUrl?: string;
    className?: string;
    options: { key: string; value: string }[];
    iconSize?: { width: string; height: string };
    onOptionChange?: (selectedOption: string) => void;
    value?: string;
    selectedOptionVar?: (selectedOption: string) => void; // Variable pour Plasmic
}

export default function DropDown({ label, iconeUrl, className, options, iconSize, onOptionChange, value, selectedOptionVar }: DropdownProps) {
    const [selectedOption, setSelectedOption] = useState<string>(value || "");

    const memoizedOptions = useMemo(() => Array.isArray(options) ? options : [], [options]);

    useEffect(() => {
        if (memoizedOptions.length > 0 && !value) {
            setSelectedOption(memoizedOptions[0].value);
            onOptionChange?.(memoizedOptions[0].value);
            selectedOptionVar?.(memoizedOptions[0].value); // Mise à jour de la variable Plasmic
        }
    }, [memoizedOptions, value, onOptionChange, selectedOptionVar]);

    useEffect(() => {
        if (value !== undefined) {
            setSelectedOption(value);
            selectedOptionVar?.(value); // Mise à jour de la variable Plasmic
        }
    }, [value, selectedOptionVar]);

    useEffect(() => {
        selectedOptionVar?.(selectedOption); // Mise à jour de la variable Plasmic
    }, [selectedOption, selectedOptionVar]);

    const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setSelectedOption(newValue);
        onOptionChange?.(newValue);
        selectedOptionVar?.(newValue); // Mise à jour de la variable Plasmic
    };

    return (
        <label className={className} style={{ border: "none" }}>
            {label}
            {iconeUrl && (
                <Image
                    src={iconeUrl}
                    alt="icon"
                    width={parseInt(iconSize?.width || "16", 10)}
                    height={parseInt(iconSize?.height || "16", 10)}
                />
            )}
            <select name="selectedOption" value={selectedOption} onChange={handleOptionChange}>
                {memoizedOptions.length === 0 ? (
                    <option value="" disabled>Aucune option disponible</option>
                ) : (
                    memoizedOptions.map((option) => (
                        <option key={option.key} value={option.value}>{option.value}</option>
                    ))
                )}
            </select>
        </label>
    );
}