import React, {
  ButtonHTMLAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Image from "next/image";

type HTMLButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "disabled"
>;

interface ButtonProps extends HTMLButtonProps {
  label?: string;
  icon?: "start" | "end" | "only" | "none";
  destructive?: boolean;
  hierarchy?: "primary" | "secondary";
  size?: "small" | "large";
  state?: "default" | "hover" | "focused" | "disabled";
  iconImage?: string;
  className?: string;
}

export interface ButtonActions {
  click(): void;
}

const Button = forwardRef<ButtonActions, ButtonProps>(
  (
    {
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
    },
    ref
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => ({
      click() {
        buttonRef.current?.click();
      },
    }));

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(event);
      }
    };

    const variants = cva(
      "flex items-center justify-center gap-3 rounded transition-all outline-none group",
      {
        variants: {
          destructive: {
            true: "bg-red-500 text-white",
            false: "bg-blue-500 text-white",
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
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled}
        className={cn(variants({ destructive, hierarchy, size, state }), className)}
      >
        {icon === "start" && iconImage && (
          <Image src={iconImage} alt="Icon" width={20} height={20} />
        )}
        {icon !== "only" && <span>{label}</span>}
        {icon === "end" && iconImage && (
          <Image src={iconImage} alt="Icon" width={20} height={20} />
        )}
        {icon === "only" && iconImage && (
          <Image src={iconImage} alt="Icon" width={20} height={20} />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;