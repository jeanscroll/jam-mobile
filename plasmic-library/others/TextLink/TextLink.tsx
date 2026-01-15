import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import React from "react";

interface TextLinkProps {
  label: string;
  size?: "Small" | "Large";
  icon?: "Start" | "None" | "End";
  destructive?: boolean;
  uppercase?: boolean;
  iconImage?: string;
  disabled?: boolean;
}

const TextLink = ({ label, size, destructive, uppercase, disabled }: TextLinkProps) => {
  const containerVariants = cva("inline-flex items-start rounded-2xl", {
    variants: {
      size: {
        Small: "gap-2",
        Large: "gap-3",
      },
    },
  });

  const textLinkVariants = cva(
    "flex justify-center font-bold text-pine-500 hover:text-lime-800 transition-all border-b border-b-transparent focus:border-pine-500 outline-none disabled:text-[#D0D5DD]",
    {
      variants: {
        size: {
          Small: "text-sm",
          Large: "text-base",
        },
        uppercase: {
          true: "uppercase",
          false: "normal-case",
        },
        destructive: {
          true: "text-error-700 hover:text-error-700 focus:border-b-error-700 disabled:text-[#FDA29Bs]",
          false: "",
        },
      },
      defaultVariants: {
        size: "Small",
        uppercase: false,
      },
    }
  );

  return (
    <div className={cn(containerVariants({ size }))}>
      <a href="#" aria-disabled={disabled} className={cn(textLinkVariants({ size, uppercase, destructive }))}>
        {label}
      </a>
    </div>
  );
};

export default TextLink;