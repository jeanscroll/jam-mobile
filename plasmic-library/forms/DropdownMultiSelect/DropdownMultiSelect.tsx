import React, { useState } from "react";
import { cn } from "../../../lib/utils";

interface DropdownMultiSelectProps {
  showLabel?: boolean;
  label?: string;
  type?: "default" | "icon" | "avatar" | "dot" | "search";
  state?: "placeholder" | "hover" | "default" | "focused" | "disabled";
  check?: boolean;
  options: Array<{
    id: string;
    label: string;
    icon?: string;
    avatar?: string;
    dotColor?: string;
  }> | string; // Accepte aussi un tableau en JSON sous forme de chaîne
  onChange?: (values: string[]) => void;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const DropdownMultiSelect = ({
  showLabel = true,
  label = "Multi Select",
  type = "default",
  state = "default",
  check = false,
  options = [],
  onChange,
}: DropdownMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Si options est une chaîne de caractères JSON, on la transforme en tableau d'objets
  const parsedOptions = typeof options === "string" ? JSON.parse(options) : options;

  const handleSelect = (optionId: string) => {
    const newSelected = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    
    setSelectedOptions(newSelected);
    onChange?.(newSelected);
  };

  interface Option {
    id: string;
    label: string;
    icon?: string;
    avatar?: string;
    dotColor?: string;
  }

  const filteredOptions: Option[] = type === "search"
    ? (parsedOptions as Option[]).filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : (parsedOptions as Option[]);

  return (
    <div className="relative w-full">
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative w-full",
          state === "disabled" && "opacity-50 pointer-events-none"
        )}
      >
        <button
          type="button"
          className={cn(
            "w-full px-4 py-2 text-left bg-white border rounded-lg",
            "flex items-center justify-between gap-2",
            state === "hover" && "border-gray-400",
            state === "focused" && "ring-2 ring-blue-500",
            !state.match(/hover|focused/) && "border-gray-300",
          )}
          onClick={() => setIsOpen(!isOpen)}
          disabled={state === "disabled"}
        >
          {type === "search" ? (
            <input
              type="text"
              className="w-full border-none focus:outline-none"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>
              {selectedOptions.length > 0
                ? `${selectedOptions.length} selected`
                : "Select options"}
            </span>
          )}
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                className={cn(
                  "w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2",
                  selectedOptions.includes(option.id) && "bg-gray-100"
                )}
                onClick={() => handleSelect(option.id)}
              >
                {type === "icon" && option.icon && (
                  <img src={option.icon} alt="" className="w-5 h-5" />
                )}
                {type === "avatar" && option.avatar && (
                  <img src={option.avatar} alt="" className="w-6 h-6 rounded-full" />
                )}
                {type === "dot" && option.dotColor && (
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: option.dotColor }}
                  />
                )}
                <span>{option.label}</span>
                {check && selectedOptions.includes(option.id) && (
                  <svg
                    className="w-5 h-5 text-blue-500 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropdownMultiSelect;
