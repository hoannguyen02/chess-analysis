// ToastContainer.tsx
import { useToast } from '@/contexts/ToastContext';
import React from 'react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-2 right-2 space-y-3 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-500 text-white'
              : toast.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-500 text-white'
          }  flex items-center justify-between`}
        >
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-4">
            ✖
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
