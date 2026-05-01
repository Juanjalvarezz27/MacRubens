"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean; // Para cambiar el color a rojo si es una acción peligrosa
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
      
      {/* Caja del Modal */}
      <div className="bg-[#F6E4C9] w-full max-w-sm rounded-4xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-2 border-[#E7AF67]/30 overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* Botón superior de cerrar (X) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#294C29]/50 hover:text-[#9F280A] transition-colors focus:outline-none"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 md:p-8">
          {/* Icono y Textos */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`p-4 rounded-full mb-4 ${isDestructive ? 'bg-[#9F280A]/10 text-[#9F280A]' : 'bg-[#294C29]/10 text-[#294C29]'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-[#294C29] mb-2 tracking-wide">
              {title}
            </h3>
            <p className="text-[#294C29]/70 font-medium">
              {message}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl font-bold text-[#294C29] bg-[#EADDCA] hover:bg-[#D9C3A3] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E7AF67]"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 rounded-2xl font-black uppercase tracking-wider text-[#F6E4C9] shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all ${
                isDestructive 
                  ? 'bg-[#B43E17] hover:bg-[#9F280A] shadow-[0_4px_0_#6A1905]' 
                  : 'bg-[#294C29] hover:bg-[#1B361B] shadow-[0_4px_0_#1B361B]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}