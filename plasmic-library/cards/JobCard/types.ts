export interface JobMetric {
  icon: string;
  value: string;
  label: string;
}

export interface JobTag {
  icon: string;
  label: string;
}

export interface JobCardProps {
  companyLogo: string;
  title: string;
  location: string;
  companyName: string;
  metrics: JobMetric[];
  tags: JobTag[];
  isNew?: boolean;
  isFavorite?: boolean;
}