import React, { useEffect } from 'react';

export interface ToastData {
  id: number;
  type: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  incidentId: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: number) => void;
  onFocus: (incidentId: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss, onFocus }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`toast toast-${toast.priority}`}
      onClick={() => {
        onFocus(toast.incidentId);
        onDismiss(toast.id);
      }}
    >
      <div className="toast-header">
        <span className="toast-icon">🚨</span>
        <span className="toast-priority">{toast.priority === 'high' ? 'DRINGEND' : toast.priority === 'medium' ? 'MITTEL' : 'NIEDRIG'}</span>
      </div>
      <div className="toast-body">
        <div className="toast-type">{toast.type}</div>
        <div className="toast-location">{toast.location}</div>
      </div>
      <button className="toast-close" onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}>✕</button>
    </div>
  );
};

export default Toast;
