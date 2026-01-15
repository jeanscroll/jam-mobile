import { ReactNode } from "react";

export type JobOffersCardStatus = "default" | "boosted" | "archived" | "new";

export interface CustomIcons {
  location?: string;
  duration?: string;
  contractType?: string;
  clock?: string;
  salary?: string;
  remote?: string;
  applications?: string;
  boost?: string;
  delete?: string;
  edit?: string;
}

export interface JobOffersCardProps {
  status?: JobOffersCardStatus;
  title: string;
  location: string;
  publishDate?: string;
  contractDuration?: string;
  contractType?: string;
  immediateStart?: boolean;
  workingHours?: string;
  salary?: string;
  remotePercentage?: string;
  applicationCount?: number;
  customButtons?: ReactNode[];
  customIcons?: CustomIcons;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBoostClick?: () => void;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  showDetailButton?: boolean;
  showApplicationsButton?: boolean;
  detailButtonText?: string;
  applicationsButtonText?: string;
  onDetailClick?: () => void;
  onViewApplicationsClick?: () => void;
}

export interface JobOffersCardActions {
  click(): void;
} 