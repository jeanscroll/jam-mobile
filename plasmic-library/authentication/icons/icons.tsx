// icons.tsx
import React from "react";

interface IconProps {
  color?: string;
}

export const EyeIcon: React.FC<IconProps> = ({ color = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <title>Icône d'œil</title>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ViewIcon: React.FC<IconProps> = ({ color = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <title>Icône de vue</title>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
