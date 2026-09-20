import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export const Toast = () => {
  const { toastMessage } = useStore();

  if (!toastMessage) return null;

  const getIcon = () => {
    switch (toastMessage.type) {
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <CheckCircle2 size={20} color="#10b981" />;
    }
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${toastMessage.type}`}>
        {getIcon()}
        <span>{toastMessage.message}</span>
      </div>
    </div>
  );
};
