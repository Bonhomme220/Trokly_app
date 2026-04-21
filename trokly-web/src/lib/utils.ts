import { clsx, type ClassValue } from "clsx";
import { Condition } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "Neuf",
  like_new: "Comme neuf",
  good: "Bon état",
  fair: "État correct",
};

export const CONDITION_COLORS: Record<Condition, string> = {
  new: "badge-signal",
  like_new: "badge-signal",
  good: "badge-ink",
  fair: "badge-warning",
};

export const CAPACITY_OPTIONS = [64, 128, 256, 512, 1024] as const;
export const CONDITION_OPTIONS: Condition[] = ["new", "like_new", "good", "fair"];

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("trokly_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("trokly_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("trokly_token");
}
