"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import { toast } from "react-toastify";

interface Pago { metodo: { id?: string; nombre: string }; montoUSD: number; montoVES: number; }
interface Pedido { id: string; estadoPago: "PAGADO" | "PENDIENTE"; pagos: Pago[]; }
interface MetodoPago { id: string; nombre: string; }

interface EditPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pedido: Pedido | null;
}

export default function EditPedidoModal({ isOpen, onClose, onSuccess, pedido }: EditPedidoModalProps) {
  const [loading, setLoading] = useState(false);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  
  const [estadoPago, setEstadoPago] = useState<"PAGADO" | "PENDIENTE">("PENDIENTE");
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Cargar métodos de pago
      fetch("/api/pedidos")
        .then(res => res.json())
        .then(data => setMetodos(data))
        .catch(() => toast.error("Error cargando métodos de pago"));

      // Inicializar estado con los datos del pedido
      if (pedido) {
        setEstadoPago(pedido.estadoPago);
        // Intentamos preseleccionar el método si lo tiene
        if (pedido.pagos && pedido.pagos.length > 0) {
           const metodoId = metodos.find(m => m.nombre === pedido.pagos[0].metodo.nombre)?.id;
           if (metodoId) setMetodoSeleccionado(metodoId);
        }
      }
    }
  }, [isOpen, pedido, metodos.length]);

  const handleSave = async () => {
    if (!pedido) return;
    if (estadoPago === "PAGADO" && !metodoSeleccionado) {
      toast.error("Selecciona un método de pago");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estadoPago,
          metodoPagoId: estadoPago === "PAGADO" ? metodoSeleccionado : null
        })
      });

      if (!res.ok) throw new Error("Error al guardar");
      
      toast.success("Orden actualizada correctamente");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Hubo un problema actualizando la orden");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !pedido) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#294C29]/40  animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-[#294C29]/10">
          <h2 className="text-xl font-black text-[#294C29] uppercase tracking-tighter">Editar Orden</h2>
          <button onClick={onClose} className="p-2 bg-[#FDF8F1] hover:bg-[#EADDCA] text-[#294C29] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selector de Estado */}
          <div>
            <label className="block text-xs font-black text-[#294C29]/60 uppercase tracking-widest mb-3">Estado de la Orden</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setEstadoPago("PAGADO")}
                className={`py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors border-2 ${estadoPago === "PAGADO" ? "bg-[#294C29] text-[#F6E4C9] border-[#294C29]" : "bg-white text-[#294C29]/50 border-[#294C29]/10 hover:border-[#294C29]/30"}`}
              >
                Pagado
              </button>
              <button 
                onClick={() => { setEstadoPago("PENDIENTE"); setMetodoSeleccionado(""); }}
                className={`py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors border-2 ${estadoPago === "PENDIENTE" ? "bg-[#B43E17] text-[#F6E4C9] border-[#B43E17]" : "bg-white text-[#B43E17]/50 border-[#B43E17]/10 hover:border-[#B43E17]/30"}`}
              >
                Pendiente
              </button>
            </div>
          </div>

          {/* Selector de Método (Solo si está pagado) */}
          {estadoPago === "PAGADO" && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-black text-[#294C29]/60 uppercase tracking-widest mb-3">Método de Pago</label>
              <div className="grid grid-cols-2 gap-3">
                {metodos.map((metodo) => (
                  <button
                    key={metodo.id}
                    onClick={() => setMetodoSeleccionado(metodo.id)}
                    className={`py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all border-2 ${metodoSeleccionado === metodo.id ? "bg-[#EADDCA] text-[#294C29] border-[#294C29]/20" : "bg-white text-[#294C29]/60 border-[#294C29]/5 hover:border-[#294C29]/20"}`}
                  >
                    {metodo.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#FDF8F1] flex justify-end gap-3 border-t border-[#294C29]/10">
          <button onClick={onClose} className="px-6 py-3 font-bold text-[#294C29]/60 hover:text-[#294C29] transition-colors">Cancelar</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-[#294C29] hover:bg-[#1A301A] text-[#F6E4C9] px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </button>
        </div>

      </div>
    </div>
  );
}