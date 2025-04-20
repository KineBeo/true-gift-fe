/**
 * Collection of validation rules for form fields
 */

// Validate required fields
export const required = (message = 'This field is required') => ({
  validate: (value: any) => {
    if (value === null || value === undefined) return false;
    
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    
    return true;
  },
  message,
});

// Validate email format
export const isEmail = (message = 'Please enter a valid email address') => ({
  validate: (value: string) => {
    if (!value) return true; // Skip validation if empty (should be caught by required)
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  message,
});

// Validate minimum length
export const minLength = (min: number, message = `Must be at least ${min} characters`) => ({
  validate: (value: string) => {
    if (!value) return true; // Skip validation if empty
    
    return value.length >= min;
  },
  message,
});

// Validate maximum length
export const maxLength = (max: number, message = `Must be no more than ${max} characters`) => ({
  validate: (value: string) => {
    if (!value) return true; // Skip validation if empty
    
    return value.length <= max;
  },
  message,
});

// Validate passwords match
export const passwordsMatch = (message = 'Passwords must match') => ({
  validate: (_: any, formData: any) => {
    return formData.password === formData.confirmPassword;
  },
  message,
});

// Validate password complexity
export const passwordComplexity = (
  message = 'Password must have at least 8 characters, including uppercase, lowercase, and numbers'
) => ({
  validate: (value: string) => {
    if (!value) return true; // Skip validation if empty
    
    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers;
  },
  message,
}); 