import React, { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

export const Toast = () => {
  const { toastMessage, hideToast } = useStore();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      hideToast?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, hideToast]);

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
    <div className="toast-container" onClick={hideToast} style={{ cursor: 'pointer' }} title="Clique para fechar">
      <div className={`toast toast-${toastMessage.type}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {getIcon()}
        <span style={{ flex: 1 }}>{toastMessage.message}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            hideToast?.();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px'
          }}
          title="Fechar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
