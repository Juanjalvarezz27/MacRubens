"use client";

import { useState, useEffect } from "react";
import { Truck, X } from "lucide-react";
import { toast } from "react-toastify";

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (precio: number) => void;
}

export default function DeliveryModal({ isOpen, onClose, onConfirm }: DeliveryModalProps) {
  const [deliveryPrice, setDeliveryPrice] = useState("");

  // Limpiar el input cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) setDeliveryPrice("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const precioNumerico = parseFloat(deliveryPrice);
    if (isNaN(precioNumerico) || precioNumerico < 0) {
      toast.error("Ingrese un precio válido para el delivery");
      return;
    }
    onConfirm(precioNumerico);
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-[#1B361B]/80 animate-in fade-in duration-200 px-4">
      <div className="bg-white w-full max-w-sm rounded-4xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-[#FDF8F1] hover:bg-[#EADDCA] text-[#294C29] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-6 mt-2">
          <div className="w-12 h-12 bg-[#B43E17]/10 text-[#B43E17] rounded-2xl flex items-center justify-center mb-4">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-[#294C29] uppercase tracking-tighter leading-none mb-2">Precio de Delivery</h2>
          <p className="text-sm font-medium text-[#294C29]/60">Ingresa el costo del viaje cobrado por el conductor.</p>
        </div>
        
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#294C29]/50 font-black">$</span>
          <input 
            type="number"
            placeholder="0.00"
            value={deliveryPrice}
            onChange={(e) => setDeliveryPrice(e.target.value)}
            autoFocus
            className="w-full bg-[#FDF8F1] text-[#294C29] font-black text-2xl rounded-2xl py-4 pl-10 pr-4 border-2 border-[#294C29]/10 focus:outline-none focus:border-[#B43E17] shadow-sm transition-colors"
          />
        </div>
        
        <button 
          onClick={handleConfirm} 
          className="w-full bg-[#294C29] hover:bg-[#1B361B] text-[#F6E4C9] py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-md flex justify-center items-center gap-2"
        >
          Confirmar Costo
        </button>
      </div>
    </div>
  );
}