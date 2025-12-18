import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Check if the current user is a developer
export function isDeveloperUser(userEmail?: string): boolean {
  return (
    userEmail === "atharkatheri@gmail.com" ||
    userEmail === "rs@shivaitech.com" ||
    userEmail === "demo@callshivai.com" || 
    userEmail === "demo@callshivai1.com"
  );
}
