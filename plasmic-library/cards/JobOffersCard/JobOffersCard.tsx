import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { cva, VariantProps } from "class-variance-authority";
import cn from "classnames";
import Image from 'next/image';

interface JobOffersCardProps extends VariantProps<typeof cardVariant> {
  status?: "default" | "boosted" | "archived" | "new";
  title: string;
  location: string;
  publishDate?: string;
  contractDuration?: {
    icon?: string;
    text: string;
  };
  contractType?: {
    icon?: string;
    text: string;
  };
  immediateStart?: {
    icon?: string;
    text: string;
  };
  workingHours?: {
    icon?: string;
    text: string;
  };
  salary?: {
    icon?: string;
    text: string;
  };
  remotePercentage?: {
    icon?: string;
    text: string;
  };
  applicationCount?: number;
  customIcons?: {
    location?: string;
    delete?: string;
    edit?: string;
  };
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBoostClick?: () => void;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  headerSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  formMethod?: string;
  formAction?: string;
  formId?: string;
}

export interface JobOffersCardActions {
  click(): void;
  submit(): void;
}

const cardVariant = cva(
  "w-full max-w-[500px] flex flex-col bg-white shadow-md rounded-[16px] p-6 relative",
  {
    variants: {
      status: {
        default: "",
        boosted: "border-2 border-green-400",
        archived: "opacity-70",
        new: "before:content-['NEW'] before:absolute before:top-2 before:right-2 before:bg-blue-500 before:text-white before:px-2 before:py-1 before:rounded-md before:text-xs before:font-bold",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

const JobOffersCard = forwardRef<JobOffersCardActions, JobOffersCardProps>(({
  status = "default",
  title,
  location,
  publishDate,
  contractDuration,
  contractType,
  immediateStart,
  workingHours,
  salary,
  remotePercentage,
  applicationCount,
  customIcons = {},
  className,
  onClick,
  onBoostClick,
  onDeleteClick,
  onEditClick,
  onSubmit,
  headerSlot,
  contentSlot,
  footerSlot,
  formMethod = "post",
  formAction = "#",
  formId,
}, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    click() {
      cardRef.current?.click();
    },
    submit() {
      formRef.current?.requestSubmit();
    }
  }));

  const handleBoostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBoostClick?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick?.();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick?.();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      onSubmit(e);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      method={formMethod}
      action={formAction}
      id={formId}
      className={cn(cardVariant({ status }), className)}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={cardRef}
        onClick={handleCardClick}
        className="w-full h-full"
      >
        {/* En-tête avec titre et status */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              {status === "boosted" && (
                <div className="text-xs font-medium text-white bg-green-400 px-2 py-1 rounded">BOOST</div>
              )}
            </div>
            
            {/* Localisation et date */}
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <div className="flex items-center">
                {customIcons.location ? (
                  <Image
                    src={customIcons.location}
                    alt="Location"
                    width={16}
                    height={16}
                    className="mr-1"
                  />
                ) : location && !customIcons.hasOwnProperty("location") ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : null}
                <span>{location}</span>
              </div>
              {publishDate && (
                <div className="ml-4 text-sm text-gray-500">
                  Publié le {publishDate}
                </div>
              )}
            </div>
          </div>
          
          {/* Actions rapides */}
          <div className="flex gap-2">
            {onDeleteClick && (
              <button
                type="button"
                onClick={handleDeleteClick}
                aria-label="Supprimer"
                className="text-red-500 hover:text-red-700"
              >
                {customIcons.delete ? (
                  <Image
                    src={customIcons.delete}
                    alt="Delete"
                    width={20}
                    height={20}
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
            {onEditClick && (
              <button
                type="button"
                onClick={handleEditClick}
                aria-label="Modifier"
                className="text-gray-500 hover:text-gray-700"
              >
                {customIcons.edit ? (
                  <Image
                    src={customIcons.edit}
                    alt="Edit"
                    width={20}
                    height={20}
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </button>
            )}
            {onBoostClick && (
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={status === "boosted"} 
                    onChange={(e) => {
                      e.stopPropagation();
                      onBoostClick?.();
                    }}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-400"></div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Slot personnalisable pour l'en-tête */}
        {headerSlot && (
          <div className="mb-4" onClick={(e) => e.stopPropagation()}>
            {headerSlot}
          </div>
        )}

        {/* Métriques */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {contractDuration && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                {contractDuration.icon ? (
                  <Image src={contractDuration.icon} alt="Duration" width={16} height={16} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="text-xs font-medium">{contractDuration.text}</span>
              </div>
            )}
            
            {contractType && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                {contractType.icon ? (
                  <Image src={contractType.icon} alt="Contract type" width={16} height={16} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span className="text-xs font-medium">{contractType.text}</span>
              </div>
            )}
            
            {immediateStart && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                {immediateStart.icon ? (
                  <Image src={immediateStart.icon} alt="Immediate" width={16} height={16} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                <span className="text-xs font-medium">{immediateStart.text}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {workingHours && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                {workingHours.icon ? (
                  <Image src={workingHours.icon} alt="Working hours" width={16} height={16} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-xs font-medium">{workingHours.text}</span>
              </div>
            )}
            
            {salary && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                {salary.icon ? (
                  <Image src={salary.icon} alt="Salary" width={16} height={16} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-xs font-medium">{salary.text}</span>
              </div>
            )}
            
            {remotePercentage && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                {remotePercentage.icon ? (
                  <Image src={remotePercentage.icon} alt="Remote" width={16} height={16} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                <span className="text-xs font-medium">{remotePercentage.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Slot personnalisable pour le contenu */}
        {contentSlot && (
          <div className="mb-6" onClick={(e) => e.stopPropagation()}>
            {contentSlot}
          </div>
        )}

        {/* Slot personnalisable pour le pied de page */}
        {footerSlot && (
          <div onClick={(e) => e.stopPropagation()}>
            {footerSlot}
          </div>
        )}
      </div>
    </form>
  );
});

JobOffersCard.displayName = "JobOffersCard";
export default JobOffersCard; 