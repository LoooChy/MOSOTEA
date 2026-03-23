export type ValidationResult = {
  valid: boolean;
  message: string;
};

export const INPUT_NEUTRAL_CLASS =
  "w-full bg-surface-container-low border-0 border-b-2 border-outline-variant/20 focus:ring-0 focus:border-primary-container p-4 rounded-lg font-body text-on-surface transition-all duration-300";
export const INPUT_VALID_CLASS =
  "w-full bg-surface-container-low border-0 border-b-2 border-primary-fixed-dim focus:ring-0 focus:border-primary-container p-4 rounded-lg font-body text-on-surface transition-all duration-300";
export const INPUT_ERROR_CLASS =
  "w-full bg-surface-container-low border-0 border-b-2 border-error/30 focus:ring-0 focus:border-error p-4 rounded-lg font-body text-on-surface transition-all duration-300";

export function sanitizeFullName(value: string): string {
  return value.replace(/[^A-Za-z ]+/g, "").replace(/\s{2,}/g, " ").slice(0, 30);
}

export function sanitizePhone(value: string): string {
  return value.replace(/\D+/g, "").slice(0, 11);
}

export function sanitizeEmail(value: string): string {
  return value.replace(/\s+/g, "");
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidNzPhone(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }
  return /^(02\d{7,9}|0[34679]\d{7}|0800\d{5,7}|0508\d{5,7})$/.test(value);
}

export function validateFullName(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: "This field is required" };
  }
  if (!/^[A-Za-z ]+$/.test(trimmed)) {
    return { valid: false, message: "Use letters and spaces only" };
  }
  if (trimmed.length > 30) {
    return { valid: false, message: "Maximum 30 characters" };
  }
  return { valid: true, message: "" };
}

export function validateEmail(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: "This field is required" };
  }
  if (!isValidEmail(trimmed)) {
    return { valid: false, message: "Please enter a valid email address" };
  }
  return { valid: true, message: "" };
}

export function validatePhone(value: string): ValidationResult {
  if (value.length === 0) {
    return { valid: false, message: "This field is required" };
  }
  if (!isValidNzPhone(value)) {
    return { valid: false, message: "Enter a valid New Zealand phone number" };
  }
  return { valid: true, message: "" };
}
