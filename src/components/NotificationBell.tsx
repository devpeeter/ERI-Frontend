import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';

export const NotificationBell: React.FC = () => {
  const { isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-lg transition-all duration-300 ${
          isDark 
            ? 'text-gray-300 hover:text-green-400 hover:bg-green-500/10' 
            : 'text-gray-600 hover:text-green-600 hover:bg-green-600/10'
        }`}
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold text-white ${
              isDark ? 'bg-green-500' : 'bg-green-600'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <motion.div
            className={`absolute inset-0 rounded-lg ${
              isDark ? 'bg-green-500/20' : 'bg-green-600/20'
            }`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </button>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};