import * as React from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

let Image: any = (props: any) => <img {...props} />; // Fallback par défaut

if (typeof window !== "undefined") {
  try {
    const dynamicRequire = eval("require"); // Empêche Webpack d'analyser `require`
    Image = dynamicRequire("next/image").default;
  } catch (error) {
    console.warn("⚠️ next/image non disponible, fallback sur <img>");
  }
}


export type HTMLButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "disabled">;

export interface ButtonProps extends HTMLButtonProps {
  label?: string,
  icon?: "start" | "end" | "only" | "none",
  destructive?: boolean,
  hierarchy?: "primary" | "secondary",
  size?: "small" | "large",
  state?: "default" | "hover" | "focused" | "disabled",
  disabled?: boolean,
  iconImage?: string,
  className?: string,
  type?: "button" | "submit" | "reset";
}

const SitexButton = ({
  label = "Button",
  icon = "none",
  destructive = false,
  hierarchy = "primary",
  size = "large",
  state = "default",
  disabled,
  onClick,
  iconImage,
  className,
  type = "button",
}: ButtonProps) => {
  const variants = cva(
    "flex items-center justify-center gap-3 rounded transition-all outline-none group",
    {
      variants: {
        destructive: {
          true: "bg-red-500 text-white",
          false: "bg-blue-500 text-white",
        },
        disabled: {
          true: "bg-slate-300",
          false: ""
        },
        hierarchy: {
          primary: "bg-blue-500 text-white",
          secondary: "bg-gray-300 text-black",
        },
        size: {
          small: "py-2 px-4 text-sm",
          large: "py-3 px-6 text-lg",
        },
        state: {
          default: "",
          hover: "hover:opacity-90",
          focused: "focus:ring-2 focus:ring-blue-500",
          disabled: "opacity-50 cursor-not-allowed",
        },
      },
      compoundVariants: [
        {
          destructive: true,
          hierarchy: "primary",
          className: "bg-red-500 text-white",
        },
        {
          destructive: false,
          hierarchy: "secondary",
          className: "bg-gray-300 text-black",
        },
      ],
    }
  );

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        variants({ destructive, disabled, hierarchy, size, state }),
        className || "",
      )}
      type={type}
    >
      {icon === "start" && iconImage && (
        <Image src={iconImage} alt="Icon" className="w-5" />
      )}
      {icon !== "only" && <span>{label}</span>}
      {icon === "end" && iconImage && (
        <Image src={iconImage} alt="Icon" className="w-5" />
      )}
      {icon === "only" && iconImage && (
        <Image src={iconImage} alt="Icon" className="w-5" />
      )}
    </button>
  );
};

export default SitexButton;