import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  accept?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
  accept
}) => {
  const { isDark } = useTheme();
  
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      accept={accept}
      className={`
        w-full p-4 rounded-xl border transition-all duration-300
        ${isDark 
          ? 'bg-gray-800/50 border-green-500/20 text-white placeholder-gray-400 focus:ring-green-500/50 focus:border-green-500/50' 
          : 'bg-white/50 border-green-600/20 text-gray-800 placeholder-gray-500 focus:ring-green-600/50 focus:border-green-600/50'
        }
        focus:outline-none focus:ring-2
        ${className}
      `}
    />
  );
};