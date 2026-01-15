import React, { useState } from "react";
import { cn } from "../../../lib/utils";

interface DropDownProps {
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
  }>;
  onChange?: (value: string) => void;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const DropDown = ({
  showLabel = true,
  label = "DropDown",
  type = "default",
  state = "default",
  check = false,
  options = [],
  onChange,
}: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    onChange?.(optionId);
    setIsOpen(false);
  };

  const filteredOptions = type === "search" 
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

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
              {selectedOption 
                ? options.find(opt => opt.id === selectedOption)?.label 
                : "Select an option"}
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
                  selectedOption === option.id && "bg-gray-100"
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
                {check && selectedOption === option.id && (
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

export default DropDown;