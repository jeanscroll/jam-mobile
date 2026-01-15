import * as React from "react";
import { cn } from "../../../lib/utils";

interface CheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  state?: "default" | "focused" | "disabled";
  onChange?: (checked: boolean) => void;
  label?: string;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const Checkbox = ({
  checked = false,
  disabled = false,
  state = "default",
  onChange,
  label,
}: CheckboxProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label className={cn(
      "inline-flex items-center",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <input
        type="checkbox"
        className={cn(
          "form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out",
          state === "focused" && "ring-2 ring-offset-2 ring-blue-500",
          disabled && "bg-gray-100"
        )}
        checked={checked}
        disabled={disabled || state === "disabled"}
        onChange={handleChange}
      />
      {label && (
        <span className="ml-2 text-gray-700">{label}</span>
      )}
    </label>
  );
};

export default Checkbox;