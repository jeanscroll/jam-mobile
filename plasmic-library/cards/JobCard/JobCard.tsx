import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { cva, VariantProps } from "class-variance-authority";
import cn from "classnames";
import Image from 'next/image';

interface JobCardProps extends VariantProps<typeof cardVariant> {
  state?: "default" | "liked" | "applied" | "new" | "lastMin";
  title: string;
  city: string;
  companyName: string;
  logo: string;
  domain?: {
    icon: string;
    text: string;
  };
  contractType?: {
    icon: string;
    text: string;
  };
  availability?: {
    icon: string;
    text: string;
  };
  workingTime?: {
    icon: string;
    text: string;
  };
  salary?: {
    icon: string;
    text: string;
  };
  workMode?: {
    icon: string;
    text: string;
  };
  tags?: string[];
  customIcons?: {
    mapPin?: string;
    car?: string;
    bus?: string;
    bicycle?: string;
    walk?: string;
  };
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onFavoriteClick?: () => void;
}

export interface JobCardActions {
  click(): void;
}

const cardVariant = cva(
  "w-full max-w-[400px] flex flex-col bg-white shadow-lg rounded-[24px] p-6 relative",
  {
    variants: {
      state: {
        default: "",
        liked: "",
        applied: "",
        new: "",
        lastMin: "",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

const JobCard = forwardRef<JobCardActions, JobCardProps>(({
  state = "default",
  title,
  city,
  companyName,
  logo = "/favicon.ico",
  domain,
  contractType,
  availability,
  workingTime,
  salary,
  workMode,
  tags = [],
  customIcons = {},
  className,
  onClick,
  onFavoriteClick,
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    click() {
      cardRef.current?.click();
    },
  }));

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteClick?.();
  };

  return (
    <div
      ref={cardRef}
      className={cn(cardVariant({ state }), className)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(e as any)}
    >
      {/* Badges d'état */}
      {state === "lastMin" && (
        <div className="absolute top-4 right-4 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
          LAST MINUTE
        </div>
      )}
      
      {state === "new" && (
        <div className="absolute top-4 right-4 bg-[#BAFE68] text-green-900 text-xs font-bold px-3 py-1 rounded-full uppercase">
          NOUVEAU
        </div>
      )}
      
      {state === "applied" && (
        <div className="absolute top-4 left-4 bg-[#2D5016] text-white text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1">
          <span>✓</span>
          POSTULÉ
        </div>
      )}

      {/* Coeur de favoris */}
      {(state === "liked" || state === "applied") && (
        <button
          className="absolute top-4 right-4 text-[#FF4D84] text-xl"
          onClick={handleFavoriteClick}
          aria-label="Retirer des favoris"
        >
          ♥
        </button>
      )}

      {/* Logo */}
      <div className="mb-4">
        <Image
          src={logo && logo !== "" ? logo : "/favicon.ico"}
          alt={`${companyName} logo`}
          width={120}
          height={32}
          className="object-contain"
        />
      </div>

      {/* Titre du poste */}
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>

      {/* Localisation */}
      <div className="flex items-center mb-4">
        <div className="flex items-center gap-1">
          {customIcons.mapPin && (
            <Image
              src={customIcons.mapPin}
              alt="Location"
              width={16}
              height={16}
              className="text-gray-500"
            />
          )}
          <span className="text-gray-600 text-sm">{city} ({companyName})</span>
        </div>
      </div>

      {/* Tags d'informations */}
      <div className="flex flex-col gap-2">
        {/* Première ligne */}
        <div className="flex gap-2 flex-wrap">
          {domain && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full flex-shrink-0">
              <Image src={domain.icon} alt="Domain" width={14} height={14} />
              <span className="text-xs font-medium text-gray-900">{domain.text}</span>
            </div>
          )}
          {contractType && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full flex-shrink-0">
              <Image src={contractType.icon} alt="Contract type" width={14} height={14} />
              <span className="text-xs font-medium text-gray-900">{contractType.text}</span>
            </div>
          )}
          {availability && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full flex-shrink-0">
              <Image src={availability.icon} alt="Availability" width={14} height={14} />
              <span className="text-xs font-medium text-gray-900">{availability.text}</span>
            </div>
          )}
        </div>

        {/* Deuxième ligne */}
        <div className="flex gap-2 flex-wrap">
          {workingTime && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full flex-shrink-0">
              <Image src={workingTime.icon} alt="Working time" width={14} height={14} />
              <span className="text-xs font-medium text-gray-900">{workingTime.text}</span>
            </div>
          )}
          {salary && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full flex-shrink-0">
              <Image src={salary.icon} alt="Salary" width={14} height={14} />
              <span className="text-xs font-medium text-gray-900">{salary.text}</span>
            </div>
          )}
          {workMode && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full flex-shrink-0">
              <Image src={workMode.icon} alt="Work mode" width={14} height={14} />
              <span className="text-xs font-medium text-gray-900">{workMode.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

JobCard.displayName = "JobCard";
export default JobCard;