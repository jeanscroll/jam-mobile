import * as React from "react";
import { cn } from "../../../lib/utils";

interface JamBadgeProps {
  size?: "small" | "medium" | "large";
  icon?: string;
  color?: "gray" | "red" | "yellow" | "green" | "blue" | "purple";
  instance?: number;
  label?: string;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const JamBadge = ({
  size = "medium",
  icon,
  color = "gray",
  instance,
  label,
}: JamBadgeProps) => {
  const baseStyles = "inline-flex items-center rounded-full font-medium";
  
  const sizeStyles = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-2.5 py-0.5 text-sm",
    large: "px-3 py-1 text-base",
  };

  const colorStyles = {
    gray: "bg-gray-100 text-gray-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  };

  return (
    <span className={cn(
      baseStyles,
      sizeStyles[size],
      colorStyles[color],
      "gap-1"
    )}>
      {icon && <img src={icon} alt="" className="w-4 h-4" />}
      {label}
      {instance !== undefined && (
        <span className="ml-1 text-xs">{instance}</span>
      )}
    </span>
  );
};

export default JamBadge;