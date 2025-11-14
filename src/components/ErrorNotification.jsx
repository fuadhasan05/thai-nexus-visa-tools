import React, { createContext, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const NotificationContext = createContext();

export function ErrorProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'error') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const addError = (message) => addNotification(message, 'error');
  const addSuccess = (message) => addNotification(message, 'success');

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addError, addSuccess }}>
      {children}
      <NotificationDisplay notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useError() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
}

function NotificationDisplay({ notifications, removeNotification }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification, index) => {
          const isSuccess = notification.type === 'success';
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{ marginTop: index * 8 }}
              className="pointer-events-auto"
            >
              <div className={`border-2 rounded-xl shadow-2xl p-4 flex items-start gap-3 backdrop-blur-sm bg-white/95 ${
                isSuccess ? 'border-green-300' : 'border-red-300'
              }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isSuccess ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium mb-1 ${
                    isSuccess ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {isSuccess ? 'Success' : 'Error'}
                  </p>
                  <p className="text-xs text-gray-600 break-words">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}