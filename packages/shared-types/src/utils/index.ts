export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageUpload {
  file: any; // File object from browser or file data
  preview?: string;
}

export interface ImageResponse {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

export interface BaseFilter {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface RangeFilter {
  min?: number;
  max?: number;
}

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

export type Theme = "light" | "dark" | "system";

export type Language = "en" | "es" | "fr" | "de" | "ja" | "ko" | "zh";

export type Device = "mobile" | "tablet" | "desktop";

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
  options?: {
    closable?: boolean;
    backdrop?: boolean;
    size?: "sm" | "md" | "lg" | "xl";
  };
}
