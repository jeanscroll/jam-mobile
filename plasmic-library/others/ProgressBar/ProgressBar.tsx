import React from "react";
import { cn } from "../../../lib/utils";

interface ProgressBarProps {
  label?: string;
  progress: number;
  showPercentage?: boolean;
  color?: "blue" | "green" | "red" | "yellow";
  size?: "small" | "medium" | "large";
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const ProgressBar = ({
  label,
  progress,
  showPercentage = true,
  color = "blue",
  size = "medium",
}: ProgressBarProps) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  const colorStyles = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
    yellow: "bg-yellow-600",
  };

  const sizeStyles = {
    small: "h-1",
    medium: "h-2",
    large: "h-3",
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">
              {normalizedProgress}%
            </span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-gray-200 rounded-full", sizeStyles[size])}>
        <div
          className={cn(
            "rounded-full transition-all duration-300",
            colorStyles[color],
            sizeStyles[size]
          )}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;