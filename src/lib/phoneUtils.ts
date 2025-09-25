/**
 * Utility functions for phone number formatting and validation
 */

export interface PhoneValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Removes all non-digit characters from a phone number
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, "");
}

/**
 * Formats a phone number for display (US format)
 * @param phoneNumber - Raw phone number string
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const digits = cleanPhoneNumber(phoneNumber);
  
  if (digits.length === 0) return "";
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length >= 10) {
    const areaCode = digits.slice(0, 3);
    const exchange = digits.slice(3, 6);
    const number = digits.slice(6, 10);
    const extension = digits.slice(10);
    
    return `(${areaCode}) ${exchange}-${number}${extension ? ` ${extension}` : ""}`;
  } else if (digits.length >= 6) {
    const areaCode = digits.slice(0, 3);
    const exchange = digits.slice(3, 6);
    const number = digits.slice(6);
    
    return `(${areaCode}) ${exchange}-${number}`;
  } else if (digits.length >= 3) {
    const areaCode = digits.slice(0, 3);
    const rest = digits.slice(3);
    
    return `(${areaCode}) ${rest}`;
  }
  
  return digits;
}

/**
 * Validates a phone number
 * @param phoneNumber - Phone number to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validatePhoneNumber(phoneNumber: string): PhoneValidationResult {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return {
      isValid: false,
      message: "Phone number is required",
    };
  }
  
  const digits = cleanPhoneNumber(phoneNumber);
  
  if (digits.length < 10) {
    return {
      isValid: false,
      message: "Phone number must be at least 10 digits",
    };
  }
  
  if (digits.length > 15) {
    return {
      isValid: false,
      message: "Phone number must not exceed 15 digits",
    };
  }
  
  // Additional validation for US numbers
  if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const exchange = digits.slice(3, 6);
    
    // Area code cannot start with 0 or 1
    if (areaCode.startsWith("0") || areaCode.startsWith("1")) {
      return {
        isValid: false,
        message: "Invalid area code",
      };
    }
    
    // Exchange cannot start with 0 or 1
    if (exchange.startsWith("0") || exchange.startsWith("1")) {
      return {
        isValid: false,
        message: "Invalid phone number format",
      };
    }
  }
  
  return {
    isValid: true,
  };
}

/**
 * Gets the international format of a US phone number
 * @param phoneNumber - US phone number
 * @returns International format (+1XXXXXXXXXX)
 */
export function getInternationalFormat(phoneNumber: string): string {
  const digits = cleanPhoneNumber(phoneNumber);
  
  if (digits.length >= 10) {
    const mainNumber = digits.slice(0, 10);
    return `+1${mainNumber}`;
  }
  
  return phoneNumber;
}