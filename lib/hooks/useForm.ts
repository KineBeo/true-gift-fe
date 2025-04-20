import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  validate: (value: any, formData: T) => boolean;
  message: string;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

interface UseFormReturn<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: Record<keyof T, boolean>;
  handleChange: (key: keyof T, value: any) => void;
  handleBlur: (key: keyof T) => void;
  validateField: (key: keyof T) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  setFieldValue: (key: keyof T, value: any) => void;
  setFieldError: (key: keyof T, error: string) => void;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T> = {}
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(() => {
    const initialTouched: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
    (Object.keys(initialValues) as Array<keyof T>).forEach(key => {
      initialTouched[key] = false;
    });
    return initialTouched;
  });

  // Handle input change
  const handleChange = useCallback((key: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  // Mark field as touched on blur
  const handleBlur = useCallback((key: keyof T) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    validateField(key);
  }, []);

  // Validate a single field
  const validateField = useCallback((key: keyof T) => {
    const fieldRules = validationRules[key];
    
    if (!fieldRules) return;
    
    for (const rule of fieldRules) {
      const isValid = rule.validate(values[key], values);
      
      if (!isValid) {
        setErrors(prev => ({ ...prev, [key]: rule.message }));
        return;
      }
    }
    
    // If field passes all validations, clear any errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, [values, validationRules]);

  // Validate all form fields
  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors<T> = {};
    const allTouched: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
    
    // Mark all fields as touched
    (Object.keys(values) as Array<keyof T>).forEach(key => {
      allTouched[key] = true;
    });
    
    setTouched(allTouched);
    
    // Check each field with validation rules
    for (const key in validationRules) {
      const typedKey = key as keyof T;
      const fieldRules = validationRules[typedKey];
      
      if (!fieldRules) continue;
      
      for (const rule of fieldRules) {
        const isFieldValid = rule.validate(values[typedKey], values);
        
        if (!isFieldValid) {
          newErrors[typedKey] = rule.message;
          isValid = false;
          break;
        }
      }
    }
    
    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched(() => {
      const resetTouched: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
      (Object.keys(initialValues) as Array<keyof T>).forEach(key => {
        resetTouched[key] = false;
      });
      return resetTouched;
    });
  }, [initialValues]);

  // Manually set a field value
  const setFieldValue = useCallback((key: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  // Manually set a field error
  const setFieldError = useCallback((key: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    resetForm,
    setFieldValue,
    setFieldError
  };
} 