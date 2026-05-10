"use client";

import { useState, useEffect } from "react";
import { Loader2, ChefHat, Clock, MessageSquare, CheckCircle2, RefreshCcw } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ui/ConfirmModal"; 

interface Producto { nombre: string; }
interface SubDetalle { producto: Producto; cantidad: number; }
interface Detalle { id: string; cantidad: number; producto: Producto; subDetalles: SubDetalle[]; }

interface PedidoCocina {
  id: string;
  cliente: { nombre: string };
  createdAt: string;
  nota: string | null;
  detalles: Detalle[];
}

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState<PedidoCocina[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const [idToComplete, setIdToComplete] = useState<string | null>(null);

  const fetchCocina = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch("/api/cocina");
      if (res.ok) {
        const data = await res.json();
        setPedidos(data);
        setLastRefresh(new Date()); 
      }
    } catch (error) {
      toast.error("Error de conexión al cargar la cocina");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCocina();
  }, []);

  const handleMarcarListo = async () => {
    if (!idToComplete) return;
    
    setPedidos(prev => prev.filter(p => p.id !== idToComplete));
    const ordenId = idToComplete;
    setIdToComplete(null);

    try {
      const res = await fetch("/api/cocina", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ordenId })
      });

      if (!res.ok) throw new Error();
      toast.success("¡Orden marcada como LISTA!");
    } catch (error) {
      toast.error("Hubo un error, la orden volverá a aparecer.");
      fetchCocina(true); 
    }
  };

  const formatHora = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getMinutosEspera = (isoString: string) => {
    const ahora = new Date();
    const orden = new Date(isoString);
    return Math.floor((ahora.getTime() - orden.getTime()) / 60000);
  };

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#FDF8F1]">
        <Loader2 className="w-12 h-12 animate-spin text-[#B43E17]" />
        <p className="mt-4 font-black text-[#294C29] uppercase tracking-widest text-xs">Preparando Cocina...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDF8F1] p-4 lg:p-10 overflow-y-auto">
      
      <ConfirmModal
        isOpen={!!idToComplete}
        onClose={() => setIdToComplete(null)}
        onConfirm={handleMarcarListo}
        title="¿Marcar como Listo?"
        message="Esta orden se enviará a despacho y desaparecerá de la pantalla de cocina."
        confirmText="Sí, está lista"
        cancelText="Volver"
        isDestructive={false}
      />

      {/* HEADER DE LA VISTA DE COCINA (Adaptado al estilo de la app) */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex flex-col items-start space-y-2 w-full md:w-auto">
          <h1 className="text-3xl md:text-5xl font-black text-[#294C29] uppercase tracking-tighter leading-none flex items-center gap-3">
            <ChefHat className="w-8 h-8 md:w-12 md:h-12 text-[#B43E17]" />
            <span>Visor de <span className="text-[#B43E17]">Cocina</span></span>
          </h1>
          <div className="h-1.5 w-16 bg-[#B43E17] rounded-full"></div>
          <div className="flex items-center gap-3 mt-3 pt-2">
            <p className="text-[#294C29]/60 font-bold text-sm uppercase tracking-widest">
              {pedidos.length} Órdenes en Cola
            </p>
            <span className="text-[#294C29]/30 text-xs font-bold">|</span>
            <p className="text-[#B43E17]/80 font-bold text-xs uppercase tracking-widest">
              Actualizado: {formatHora(lastRefresh.toISOString())}
            </p>
          </div>
        </div>
        
        {/* BOTÓN DE ACTUALIZAR (Estilo blanco/borde limpio para desktop, Full width en mobile) */}
        <button
          onClick={() => fetchCocina(true)}
          disabled={isRefreshing}
          className="w-full md:w-auto bg-white hover:bg-[#EADDCA] text-[#294C29] border border-[#294C29]/10 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin text-[#B43E17]" /> : <RefreshCcw className="w-4 h-4 text-[#B43E17]" />}
          {isRefreshing ? "Buscando..." : "Actualizar Órdenes"}
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="max-w-2xl mx-auto mt-10 bg-white rounded-3xl p-16 text-center border border-[#294C29]/10 shadow-sm">
          <ChefHat className="w-20 h-20 text-[#294C29]/20 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-[#294C29] uppercase tracking-tighter">Cocina Limpia</h2>
          <p className="font-bold text-[#294C29]/50 text-sm mt-2">No hay órdenes pendientes en este momento.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pedidos.map((pedido) => {
            const minutos = getMinutosEspera(pedido.createdAt);
            const isDelayed = minutos > 25; // Si se retrasa, el encabezado se vuelve naranja/rojo

            return (
              <div key={pedido.id} className="bg-white rounded-3xl overflow-hidden flex flex-col shadow-sm border border-[#294C29]/10 transition-all hover:shadow-md hover:border-[#294C29]/20 animate-in fade-in zoom-in-95">
                
                {/* CABECERA DEL TICKET */}
                <div className={`p-5 flex justify-between items-center text-[#F6E4C9] ${isDelayed ? "bg-[#B43E17]" : "bg-[#294C29]"}`}>
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-0.5">Cliente</span>
                    <span className="font-black text-lg truncate block leading-none">{pedido.cliente.nombre}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end font-black text-2xl leading-none">
                      <Clock className="w-4 h-4 opacity-80" /> {minutos}m
                    </div>
                    <span className="text-[10px] font-bold uppercase opacity-80 mt-1 block">{formatHora(pedido.createdAt)}</span>
                  </div>
                </div>

                {/* NOTAS RESALTADAS (Estilo elegante integrado al diseño) */}
                {pedido.nota && (
                  <div className="bg-[#B43E17]/10 p-4 border-b border-[#B43E17]/20 flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-[#B43E17] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#B43E17] block mb-0.5">Requerimiento Especial</span>
                      <span className="font-bold text-[#294C29] text-sm leading-snug block">{pedido.nota}</span>
                    </div>
                  </div>
                )}

                {/* PRODUCTOS */}
                <div className="flex-1 p-5 space-y-4 bg-white">
                  {pedido.detalles.map((detalle) => (
                    <div key={detalle.id} className="border-b border-[#294C29]/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span className="font-black text-xl text-[#B43E17] bg-[#FDF8F1] border border-[#B43E17]/10 px-2.5 py-1 rounded-xl shadow-sm">{detalle.cantidad}x</span>
                        <div className="mt-1">
                          <span className="font-black text-[#294C29] text-lg uppercase leading-tight block">{detalle.producto.nombre}</span>
                          
                          {/* SUB-ITEMS / TOPPINGS */}
                          {detalle.subDetalles.length > 0 && (
                            <ul className="mt-2 space-y-1.5 border-l-2 border-[#294C29]/10 pl-3 ml-1">
                              {detalle.subDetalles.map(sub => (
                                <li key={sub.producto.nombre} className="text-sm font-bold text-[#294C29]/70 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#B43E17]/50"></span>
                                  {sub.cantidad > 1 ? <span className="text-[#B43E17] font-black">{sub.cantidad}x</span> : ""}{sub.producto.nombre}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* BOTÓN LISTO */}
                <div className="p-4 border-t border-[#294C29]/5 bg-[#FDF8F1] mt-auto">
                  <button
                    onClick={() => setIdToComplete(pedido.id)}
                    className="w-full bg-[#294C29] hover:bg-[#1B361B] text-[#F6E4C9] py-4 rounded-xl font-black uppercase tracking-widest text-sm flex justify-center items-center gap-2 transition-all shadow-md active:translate-y-1"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#E7AF67]" /> Marcar como Listo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}