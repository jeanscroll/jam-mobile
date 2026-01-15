import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Import dynamique d'Ant Design pour éviter les problèmes SSR
const DatePicker = dynamic(() => import("antd").then(mod => ({ default: mod.DatePicker })), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-10 rounded-2xl" />
});

const TimePicker = dynamic(() => import("antd").then(mod => ({ default: mod.TimePicker })), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-10 rounded-2xl" />
});
import "tailwindcss/tailwind.css";

interface JamDatePickerProps {
    type?: "date" | "time" | "datetime";
    label?: string;
    placeholder?: string;
    hint?: string;
    destructive?: boolean;
    disabled?: boolean;
    className?: string;
    // value can be provided as ISO string, Date, or Dayjs (to support form libs)
    value?: string | Date | Dayjs | null;
    // onDateChange: Plasmic-style callback with both string and Dayjs
    onDateChange?: (value: string | null, dayjs: Dayjs | null) => void;
    // onChange: simplified callback for form libraries (stores primitive string or null)
    onChange?: (value: string | null) => void;
    format?: string;
    showTime?: boolean;
    size?: "small" | "middle" | "large";
    allowClear?: boolean;
}

const JamDatePicker = ({
    type = "date",
    label,
    placeholder,
    hint,
    destructive = false,
    disabled = false,
    className,
    value,
    onDateChange,
    onChange,
    format,
    showTime = false,
    size = "middle",
    allowClear = true,
}: JamDatePickerProps) => {
    const [focus, setFocus] = useState(false);
    const [dateValue, setDateValue] = useState<Dayjs | null>(null);

    // Conversion de la valeur d'entrée en Dayjs
    useEffect(() => {
        if (value) {
            // dayjs can parse Date, string, or Dayjs instances
            const dayjsValue = dayjs(value as any);
            setDateValue(dayjsValue.isValid() ? dayjsValue : null);
        } else {
            setDateValue(null);
        }
    }, [value]);

    const handleDateChange = (date: any, dateString: string | string[]) => {
        const dayjsDate = date as Dayjs | null;
        setDateValue(dayjsDate);

        // prefer an ISO string for simple storage/submit; fallback to dateString when absent
    const formattedFromAntd = Array.isArray(dateString) ? dateString[0] : dateString;
    // Return a local date-only string (YYYY-MM-DD) to avoid timezone shifts when
    // converting to ISO (toISOString uses UTC and can roll the date back).
    const isoString = dayjsDate ? dayjsDate.format("YYYY-MM-DD") : (formattedFromAntd || null);

        // Call Plasmic prop if provided (ISO string + Dayjs)
        if (onDateChange) {
            onDateChange(isoString, dayjsDate);
        }

        // Call simplified onChange for forms (string or null) — ISO string preferred
        if (onChange) {
            onChange(isoString);
        }
    };

    // Configuration du format selon le type
    const getFormat = () => {
        if (format) return format;
        switch (type) {
            case "time":
                return "HH:mm";
            case "datetime":
                return "DD/MM/YYYY HH:mm";
            default:
                return "DD/MM/YYYY";
        }
    };

    // Configuration du placeholder selon le type
    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        switch (type) {
            case "time":
                return "Sélectionner une heure";
            case "datetime":
                return "Sélectionner une date et heure";
            default:
                return "Sélectionner une date";
        }
    };

    // Styles pour le container
    const containerVariant = cva(
        "flex flex-col w-full max-w-md max-h-20",
        {
            variants: {
                disabled: {
                    true: "opacity-50 cursor-not-allowed",
                    false: "",
                },
            },
        }
    );

    // Styles pour le DatePicker
    const pickerClassName = cn(
        "w-full max-w-md h-12 transition-all rounded-2xl border border-solid",
        {
            "border-error-700": destructive,
            "border-[#C8C8C8]": !destructive,
            "shadow-[0_0_0_4px_#D92D20]": destructive && focus,
            "shadow-[0_0_0_4px_#E8FFCC]": !destructive && focus,
        },
        // ensure container className is applied only once; pass remaining classes to picker
        className
    );

    const customStyles = {
        control: (provided: any) => ({
            ...provided,
            borderRadius: "1rem",
            border: destructive ? "1px solid #D92D20" : "1px solid #C8C8C8",
            maxWidth: "28rem",
            height: "3rem",
            boxShadow: focus
                ? destructive
                    ? "0 0 0 4px #D92D20"
                    : "0 0 0 4px #E8FFCC"
                : "none",
            "&:hover": {
                border: destructive ? "1px solid #D92D20" : "1px solid #C8C8C8",
            },
        }),
    };

    const containerClassName = cn(containerVariant({ disabled }), className);

    return (
        <div className={containerClassName}>
            {label && (
                <label className="text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                {type === "time" ? (
                    <TimePicker
                        value={dateValue}
                        onChange={handleDateChange}
                        placeholder={getPlaceholder()}
                        format={getFormat()}
                        disabled={disabled}
                        size={size}
                        allowClear={allowClear}
                        className={pickerClassName}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        style={{ width: "100%" }}
                    />
                ) : (
                    <DatePicker
                        value={dateValue}
                        onChange={handleDateChange}
                        placeholder={getPlaceholder()}
                        format={getFormat()}
                        showTime={type === "datetime" || showTime}
                        disabled={disabled}
                        size={size}
                        allowClear={allowClear}
                        className={pickerClassName}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        style={{ width: "100%" }}
                    />
                )}
            </div>

            {hint && (
                <div className={cn(
                    "text-xs mt-1",
                    destructive ? "text-error-600" : "text-gray-500"
                )}>
                    {hint}
                </div>
            )}
        </div>
    );
};

export default JamDatePicker;