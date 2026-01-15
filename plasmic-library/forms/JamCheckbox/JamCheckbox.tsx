import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import React, { useState } from "react";

interface CheckboxProps {
  checked?: boolean;
  type?: "Checkbox" | "Check circle";
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

//l'icone dans le composant ne fonctionne pas, il faut l'importer sur plasmic et gérer l'apparition de l'icone en fonction de la valeur de checked

const Checkbox: React.FC<CheckboxProps> = ({ checked, type = "Checkbox", disabled, onChange }) => {
  const [internalChecked, setInternalChecked] = useState(checked ?? false);
  const isChecked = checked ?? internalChecked;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const newChecked = event.target.checked;

    if (checked === undefined) {
      setInternalChecked(newChecked);
    }

    onChange?.(newChecked);
  };

  const handleClick = () => {
    if (disabled) return;

    const newChecked = !isChecked;

    if (checked === undefined) {
      setInternalChecked(newChecked);
    }

    onChange?.(newChecked);
  };

  const variants = cva(
    "peer p-[3px] size-5 cursor-pointer transition-all appearance-none rounded border enabled:group-hover:border-[#002400]  border-[#D0D5DD] outline-none shrink-0 disabled:opacity-30 focus:shadow-[0_0_0_4px_rgba(232,255,204,1)] flex items-center justify-center",
    {
      variants: {
        type: {
          Checkbox: "rounded-md checked:border-[#002400] focus:outline-none checked:bg-white",
          "Check circle": "rounded-full checked:bg-[#002400] checked:border-transparent",
        },
      },
      defaultVariants: {
        type: "Checkbox",
      },
    }
  );

  return (
    <div className={cn("inline-flex items-center group")}>
      <label className="flex items-center cursor-pointer relative">
        <input
          type="checkbox"
          className={cn(variants({ type }), "relative")}
          disabled={disabled}
          checked={isChecked}
          onChange={handleChange}
          onClick={handleClick}
        />
      </label>
    </div>
  );
};

export default Checkbox;