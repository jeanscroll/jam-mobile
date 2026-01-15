import React from "react";
import { cn } from "../../../lib/utils";

interface ToggleProps {
  disabled?: boolean;
  selected?: boolean;
  state?: "default" | "focused" | "disabled";
  onChange?: (selected: boolean) => void;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const Toggle = ({
  disabled = false,
  selected = false,
  state = "default",
  onChange,
}: ToggleProps) => {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!selected);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        selected ? "bg-blue-600" : "bg-gray-200",
        state === "focused" && "ring-2 ring-offset-2 ring-blue-500",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      disabled={disabled || state === "disabled"}
      onClick={handleClick}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          selected ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
};

export default Toggle;