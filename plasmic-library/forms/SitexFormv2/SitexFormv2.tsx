import * as React from "react";
import type { ReactNode, FormEvent } from "react";

interface FormProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  autoComplete?: "on" | "off";
  noValidate?: boolean;
}

const SitexFormv2: React.FC<FormProps> = ({ 
  children, 
  className, 
  onSubmit,
  autoComplete = "off",
  noValidate = false
}) => {    
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form 
      className={className} 
      onSubmit={handleSubmit}
      autoComplete={autoComplete}
      noValidate={noValidate}
    >
      {children}
    </form>
  );
};

export default SitexFormv2; 