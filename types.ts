import type { LiquidConnection, ResolvedBadge } from "./constants";

export type { LiquidConnection, ResolvedBadge };

export interface LiquidProfile {
  userId: string;
  badges: ResolvedBadge[] | string[];
  customUsername?: string;
  registrationDate?: string;
  connections?: LiquidConnection[];
  nitroMonths?: number;
  nitroSinceDate?: string;
}

export interface AuthState {
  token: string | null;
  userId: string | null;
}

export interface ApiConfig {
  baseUrl: string;
}
