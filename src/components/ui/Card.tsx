import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
  const { isDark } = useTheme();
  
  return (
    <motion.div
      className={`
        backdrop-blur-xl rounded-2xl p-6 shadow-xl border transition-all duration-300
        ${isDark 
          ? 'bg-gray-900/40 border-green-500/20' 
          : 'bg-white/40 border-green-600/20'
        }
        ${hover 
          ? isDark
            ? 'hover:shadow-2xl hover:bg-gray-900/50 hover:border-green-500/30' 
            : 'hover:shadow-2xl hover:bg-white/50 hover:border-green-600/30'
          : ''
        }
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};