'use client';

import React, { useState, useCallback } from 'react';
import { validateUzbekPhoneNumber, formatUzbekPhoneNumber, getPhoneNumberError } from '@/lib/phoneValidator';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = '+998 90 123 45 67',
  label = 'Telefon',
  error,
  disabled = false,
  required = false,
}) => {
  const [touched, setTouched] = useState(false);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUzbekPhoneNumber(e.target.value);
    onChange(formatted);
  }, [onChange]);
  
  const handleBlur = useCallback(() => {
    setTouched(true);
    onBlur?.();
  }, [onBlur]);
  
  const validationError = touched && !error ? getPhoneNumberError(value) : error;
  const isValid = value && validateUzbekPhoneNumber(value);
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors backdrop-blur-sm ${
            disabled
              ? 'bg-white/5 text-gray-500 cursor-not-allowed border-white/10'
              : isValid
              ? 'bg-white/10 border-green-500/50 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-500'
              : validationError
              ? 'bg-white/10 border-red-500/50 focus:ring-red-500 focus:border-red-500 text-white placeholder-gray-500'
              : 'bg-white/10 border-white/20 focus:ring-teal-500 focus:border-teal-500 text-white placeholder-gray-500'
          }`}
        />
        {isValid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400">
            ✓
          </div>
        )}
      </div>
      {validationError && (
        <p className="mt-1 text-sm text-red-400">{validationError}</p>
      )}
    </div>
  );
};
