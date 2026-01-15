import React, { useEffect } from "react";
import { cn } from "../../../lib/utils";

interface ToastProps {
  badge?: string;
  icon?: string;
  size?: "small" | "medium" | "large";
  color?: "success" | "error" | "warning" | "info";
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

const Toast = ({
  badge,
  icon,
  size = "medium",
  color = "info",
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: ToastProps) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const sizeStyles = {
    small: "p-2 text-sm",
    medium: "p-3 text-base",
    large: "p-4 text-lg",
  };

  const colorStyles = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg shadow-lg",
        sizeStyles[size],
        colorStyles[color]
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <img src={icon} alt="" className="w-5 h-5" />}
        <span>{message}</span>
        {badge && (
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full",
            "bg-white bg-opacity-25"
          )}>
            {badge}
          </span>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 hover:opacity-75"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Toast;