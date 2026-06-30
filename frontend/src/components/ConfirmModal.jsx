import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isDanger = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#1C2028] border border-slate-700/50 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col scale-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground tracking-wide text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-5 pb-6">
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {message}
          </p>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }} 
              className={`px-4 py-2 text-sm font-medium rounded-lg shadow-md transition-colors ${
                isDanger 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
