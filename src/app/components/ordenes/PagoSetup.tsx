"use client";

import { useState, useEffect } from "react";
import { CreditCard, Banknote, Smartphone, CheckCircle2, ChevronLeft, Loader2, Trash2, Clock } from "lucide-react";
import { toast } from "react-toastify";
import { DatosCliente } from "./ClienteSetup";
import { CartItem } from "./MenuSetup";

interface MetodoPago { id: string; nombre: string; }

interface PagoSetupProps {
  cliente: DatosCliente;
  cart: CartItem[];
  tasaBCV: number;
  totalUSD: number;
  totalVES: number;
  onVolver: () => void;
  onSuccess: () => void;
  onCancelOrder: () => void;
}

export default function PagoSetup({ cliente, cart, tasaBCV, totalUSD, totalVES, onVolver, onSuccess, onCancelOrder }: PagoSetupProps) {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loadingMetodos, setLoadingMetodos] = useState(true);
  
  const [selectedMetodo, setSelectedMetodo] = useState<MetodoPago | null>(null);
  const [referencia, setReferencia] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [esPagado, setEsPagado] = useState(true);

  useEffect(() => {
    const fetchMetodos = async () => {
      try {
        const res = await fetch("/api/pedidos");
        const data = await res.json();
        setMetodos(data);
        if (data.length > 0) setSelectedMetodo(data[0]); 
      } catch (error) {
        toast.error("Error cargando métodos de pago");
      } finally {
        setLoadingMetodos(false);
      }
    };
    fetchMetodos();
  }, []);

  const requiresReference = selectedMetodo && ["pago móvil", "punto de venta", "zelle"].some(m => selectedMetodo.nombre.toLowerCase().includes(m));

  const handleProcesar = async () => {
    if (esPagado) {
      if (!selectedMetodo) return toast.error("Seleccione un método de pago");
      if (requiresReference && referencia.trim().length < 4) return toast.error("Ingrese una referencia válida");
    }

    setIsProcessing(true);
    try {
      const payload = {
        cliente,
        cart,
        tasaBCV,
        totalUSD,
        totalVES,
        estadoPago: esPagado ? "PAGADO" : "PENDIENTE",
        metodoPagoId: esPagado ? selectedMetodo?.id : null,
        referencia: (esPagado && requiresReference) ? referencia.trim() : null
      };

      // MAGIA: Detectamos si estamos creando o editando
      const pedidoActivoId = localStorage.getItem("macrubens_pedido_activo");
      const url = pedidoActivoId ? `/api/pedidos/${pedidoActivoId}` : "/api/pedidos";
      const method = pedidoActivoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Mensajes dinámicos según la acción
      if (pedidoActivoId) {
        toast.success("¡Orden Actualizada Exitosamente!");
      } else {
        toast.success(esPagado ? "¡Orden Procesada Exitosamente!" : "¡Orden Pendiente Registrada!");
      }
      
      onSuccess(); 
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la orden");
    } finally {
      setIsProcessing(false);
    }
  };

  const getIconForMethod = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes("efectivo")) return <Banknote className="w-6 h-6" />;
    if (n.includes("móvil") || n.includes("zelle")) return <Smartphone className="w-6 h-6" />;
    return <CreditCard className="w-6 h-6" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-4xl p-8 lg:p-10 shadow-sm border border-[#294C29]/10 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onVolver} className="p-3 bg-[#FDF8F1] hover:bg-[#EADDCA] text-[#294C29] rounded-2xl transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-[#294C29] uppercase tracking-tighter">Facturación</h2>
            <p className="text-[#294C29]/60 font-medium text-sm mt-1">Procesar orden de <strong className="text-[#B43E17]">{cliente.nombre}</strong></p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex bg-[#FDF8F1] rounded-2xl p-1.5 border border-[#294C29]/10">
        <button 
          onClick={() => setEsPagado(true)}
          className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 ${esPagado ? "bg-[#294C29] text-[#F6E4C9] shadow-sm" : "text-[#294C29]/50 hover:text-[#294C29]"}`}
        >
          <CheckCircle2 className="w-4 h-4" /> Pagada Ahora
        </button>
        <button 
          onClick={() => setEsPagado(false)}
          className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 ${!esPagado ? "bg-[#B43E17] text-[#F6E4C9] shadow-sm" : "text-[#294C29]/50 hover:text-[#B43E17]"}`}
        >
          <Clock className="w-4 h-4" /> Cobrar Después
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className={`rounded-3xl p-6 text-[#F6E4C9] flex flex-col justify-center relative overflow-hidden shadow-lg transition-colors duration-500 ${esPagado ? "bg-[#294C29]" : "bg-[#B43E17]"}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10"></div>
          
          <span className="text-xs font-black uppercase tracking-widest text-[#F6E4C9]/60 mb-2">Total de la Orden</span>
          <div className="flex items-start gap-1 mb-4">
            <span className="text-2xl font-black mt-2">$</span>
            <span className="text-6xl font-black tracking-tighter leading-none">{totalUSD.toFixed(2)}</span>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F6E4C9]/60">Equivalente VES</span>
            <span className="text-lg font-bold">Bs. {totalVES.toFixed(2)}</span>
          </div>
        </div>

        {esPagado ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#294C29]/70 uppercase tracking-[0.15em] pl-1">Método de Pago</label>
              {loadingMetodos ? (
                <div className="flex items-center justify-center h-24 bg-[#FDF8F1] rounded-2xl border border-[#294C29]/10"><Loader2 className="w-6 h-6 animate-spin text-[#B43E17]" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {metodos.map(metodo => (
                    <button
                      key={metodo.id}
                      onClick={() => { setSelectedMetodo(metodo); setReferencia(""); }}
                      className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${selectedMetodo?.id === metodo.id ? "bg-[#B43E17]/10 border-[#B43E17] text-[#B43E17] shadow-sm" : "bg-white border-[#294C29]/10 text-[#294C29]/60 hover:border-[#294C29]/30"}`}
                    >
                      {getIconForMethod(metodo.nombre)}
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">{metodo.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {requiresReference && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-semibold text-[#294C29]/70 uppercase tracking-[0.15em] pl-1">Número de Referencia</label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value.replace(/\D/g, ""))}
                  placeholder="Últimos dígitos"
                  className="w-full bg-[#FDF8F1] text-[#294C29] font-bold text-lg rounded-2xl py-4 px-5 focus:outline-none border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center text-center p-6 border-2 border-dashed border-[#B43E17]/20 rounded-3xl animate-in slide-in-from-left-4 duration-300">
            <Clock className="w-12 h-12 text-[#B43E17]/40 mb-4" />
            <h3 className="text-lg font-black text-[#294C29] uppercase tracking-tighter">Pago por Confirmar</h3>
            <p className="text-xs font-bold text-[#294C29]/50 mt-2">La orden se enviará a cocina y el estado de la cuenta quedará por cobrar.</p>
          </div>
        )}

      </div>

      <div className="mt-8 pt-6 border-t border-[#294C29]/10 flex flex-col gap-3">
        <button
          onClick={handleProcesar}
          disabled={isProcessing || (esPagado && !selectedMetodo)}
          className={`w-full py-5 px-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-md flex justify-center items-center gap-3 disabled:opacity-50 ${esPagado ? "bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9]" : "bg-[#294C29] hover:bg-[#1B361B] text-[#F6E4C9]"}`}
        >
          {isProcessing ? (
            <><Loader2 className="w-6 h-6 animate-spin shrink-0" /><span className="text-center leading-tight">Procesando...</span></>
          ) : (
            <>
              {esPagado ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <Clock className="w-6 h-6 shrink-0" />}
              <span className="text-center leading-tight">
                {/* Texto dinámico si estamos editando o creando */}
                {localStorage.getItem("macrubens_pedido_activo") 
                  ? "Guardar Cambios" 
                  : (esPagado ? "Confirmar y Facturar" : "Registrar Orden Pendiente")}
              </span>
            </>
          )}
        </button>

        <button
          onClick={onCancelOrder}
          disabled={isProcessing}
          className="w-full bg-transparent hover:bg-[#B43E17]/10 text-[#B43E17] py-4 px-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex justify-center items-center gap-2"
        >
          <Trash2 className="w-4 h-4 shrink-0" /> Cancelar Orden por Completo
        </button>
      </div>

    </div>
  );
}