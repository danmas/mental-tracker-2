import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-slide-up border border-gray-700"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};