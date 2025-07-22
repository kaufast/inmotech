import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
  outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
  ghost: 'hover:bg-gray-100 text-gray-700 border-transparent',
  destructive: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-transparent'
};

const sizeStyles = {
  default: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2'
};

export function Button({ 
  children, 
  className = '', 
  variant = 'default', 
  size = 'default',
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center rounded-md font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}