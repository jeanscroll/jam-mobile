import * as React from "react";
import type { ReactNode } from "react";

interface FormProps {
  children: ReactNode,
  className?: string 
}

const SitexForm: React.FC<FormProps> = ({ children, className }) => {    

  return (
    <form className={ className }>
      { children }
    </form>
  );
};

export default SitexForm; 
     