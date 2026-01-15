import * as React from "react";
import { cn } from '@/lib/utils';

export interface PasswordCheckIndicatorProps {
  numberOfChecksToMake: number,
  numberOfChecksValidated: number,
  colorUnchecked: string,
  colorChecked: string,
  className?: string
}

const PasswordCheckIndicator = ({
  numberOfChecksToMake = 4,
  numberOfChecksValidated,
  colorUnchecked,
  colorChecked,
  className
}: PasswordCheckIndicatorProps) => {
  return (
    <div className={cn("flex flex-row gap-2 pt-2 pb-2", className || "")}>

      {[...Array(numberOfChecksToMake)].map((_, index) => (
        <div
          key={index}
          className="flex-grow h-1 rounded-full" style={{backgroundColor: numberOfChecksValidated > index ? colorChecked : colorUnchecked}}
        />
      ))}
    </div>
  );
};

export default PasswordCheckIndicator;