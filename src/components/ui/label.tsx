import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function Label({ 
  children, 
  className = '', 
  htmlFor,
  ...props 
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`
        text-sm font-medium leading-none text-gray-700
        peer-disabled:cursor-not-allowed peer-disabled:opacity-70
        ${className}
      `}
      {...props}
    >
      {children}
    </label>
  );
}