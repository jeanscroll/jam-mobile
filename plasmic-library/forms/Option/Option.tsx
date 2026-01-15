// Option.tsx
import React from "react";

interface OptionProps {
  value: string;
  children: React.ReactNode;
}
const Option: React.FC<OptionProps> = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

export default Option;