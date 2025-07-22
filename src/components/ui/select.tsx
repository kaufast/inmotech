import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedLabel?: string;
  setSelectedLabel: (label: string) => void;
} | null>(null);

export function Select({ children, value, onValueChange }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  return (
    <SelectContext.Provider value={{ 
      value, 
      onValueChange, 
      isOpen, 
      setIsOpen, 
      selectedLabel, 
      setSelectedLabel 
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');
  
  const { isOpen, setIsOpen } = context;

  return (
    <button
      type="button"
      className={`
        flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
        bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none 
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed 
        disabled:opacity-50
        ${className}
      `}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder = '', className = '' }: SelectValueProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');
  
  const { selectedLabel } = context;

  return (
    <span className={className}>
      {selectedLabel || placeholder}
    </span>
  );
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');
  
  const { isOpen, setIsOpen } = context;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={`
        absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-gray-200 
        bg-white shadow-lg
        ${className}
      `}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
}

export function SelectItem({ children, value, className = '' }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');
  
  const { value: selectedValue, onValueChange, setIsOpen, setSelectedLabel } = context;
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (onValueChange) {
      onValueChange(value);
    }
    setSelectedLabel(children as string);
    setIsOpen(false);
  };

  return (
    <button
      type="button"
      className={`
        w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 
        focus:outline-none
        ${isSelected ? 'bg-gray-100 font-medium' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}