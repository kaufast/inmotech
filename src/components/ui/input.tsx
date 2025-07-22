import React from 'react';

interface InputProps {
  className?: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  id?: string;
  disabled?: boolean;
}

export function Input({ 
  className = '', 
  type = 'text',
  ...props 
}: InputProps) {
  return (
    <input
      type={type}
      className={`
        flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
        placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 
        focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
      {...props}
    />
  );
}