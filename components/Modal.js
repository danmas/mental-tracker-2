import React, { useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return html`
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-700"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-100">${title}</h3>
          <button 
            onClick=${onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          ${children}
        </div>
      </div>
    </div>
  `;
};

