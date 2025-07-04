import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Trash2, Gift, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { 
    notifications, 
    unreadCount, 
    loading,
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications,
    refreshNotifications
  } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    if (notification.actionUrl) {
      // Parse the hash-based routing
      const url = notification.actionUrl.replace('#', '');
      
      // If it's claim-ownership, we need to set the active feature
      if (url === 'claim-ownership') {
        // Trigger navigation to user page with claim ownership feature
        window.dispatchEvent(new CustomEvent('navigate-to-feature', {
          detail: { page: 'user', feature: 'claim-ownership' }
        }));
        onClose();
      }
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ownership_transfer':
        return Gift;
      default:
        return Bell;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Notification Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-96 z-50 shadow-2xl border-l ${
              isDark 
                ? 'bg-gray-900/95 border-green-500/20' 
                : 'bg-white/95 border-green-600/20'
            } backdrop-blur-xl`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className={`p-6 border-b ${
                isDark ? 'border-green-500/20' : 'border-green-600/20'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Notifications
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={refreshNotifications}
                      disabled={loading}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10' 
                          : 'text-gray-600 hover:text-green-600 hover:bg-green-600/10'
                      } ${loading ? 'animate-spin' : ''}`}
                      title="Refresh notifications"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onClose}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10' 
                          : 'text-gray-600 hover:text-green-600 hover:bg-green-600/10'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <Button
                        onClick={markAllAsRead}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={loading}
                      >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark All Read
                      </Button>
                    )}
                    <Button
                      onClick={clearAllNotifications}
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className={`w-8 h-8 animate-spin ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <Bell className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No notifications yet
                    </p>
                    <p className={`text-sm text-center mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      You'll see ownership transfers and other updates here
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`
                            relative p-4 rounded-xl border cursor-pointer transition-all duration-300
                            ${!notification.read 
                              ? isDark
                                ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15' 
                                : 'bg-green-50 border-green-200 hover:bg-green-100'
                              : isDark
                                ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }
                          `}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {/* Unread indicator */}
                          {!notification.read && (
                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                              isDark ? 'bg-green-400' : 'bg-green-600'
                            }`} />
                          )}

                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              notification.type === 'ownership_transfer'
                                ? isDark
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-green-100 text-green-600'
                                : isDark
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-blue-100 text-blue-600'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {notification.message}
                              </p>
                              
                              {notification.data?.itemName && (
                                <p className={`text-xs mt-2 font-medium ${
                                  isDark ? 'text-green-400' : 'text-green-600'
                                }`}>
                                  Item: {notification.data.itemName}
                                </p>
                              )}

                              {notification.data?.transferCode && (
                                <p className={`text-xs mt-1 font-mono ${
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  Code: {notification.data.transferCode.slice(0, 10)}...
                                </p>
                              )}

                              <div className="flex items-center justify-between mt-3">
                                <div className={`flex items-center text-xs ${
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTimestamp(notification.timestamp)}
                                </div>

                                {notification.actionLabel && (
                                  <div className={`flex items-center text-xs font-medium ${
                                    isDark ? 'text-green-400' : 'text-green-600'
                                  }`}>
                                    {notification.actionLabel}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center justify-end space-x-2 mt-3">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  isDark 
                                    ? 'text-gray-400 hover:text-green-400' 
                                    : 'text-gray-500 hover:text-green-600'
                                }`}
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className={`p-1 rounded transition-colors ${
                                isDark 
                                  ? 'text-gray-400 hover:text-red-400' 
                                  : 'text-gray-500 hover:text-red-600'
                              }`}
                              title="Remove notification"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};