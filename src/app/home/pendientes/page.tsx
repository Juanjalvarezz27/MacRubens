"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock, CheckCircle2, Trash2, Edit, ChevronDown, User, AlertCircle, Banknote, Smartphone, CreditCard, X } from "lucide-react";
import { toast } from "react-toastify";

// Usamos tu ConfirmModal existente (ajusta la ruta si es necesario)
import ConfirmModal from "../../components/ui/ConfirmModal";

interface Producto { nombre: string; }
interface SubDetalle { producto: Producto; cantidad: number; precioUnitario: number; subtotal: number; }
interface Detalle { id: string; cantidad: number; precioUnitario: number; subtotal: number; producto: Producto; subDetalles: SubDetalle[]; }
interface Cliente { nombre: string; cedula: string; telefono: string | null; }
interface MetodoPago { id: string; nombre: string; }

interface PedidoPendiente {
  id: string;
  totalUSD: number;
  totalVES: number;
  createdAt: string;
  cliente: Cliente;
  detalles: Detalle[];
}

export default function OrdenesPendientesPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoPendiente[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  // Estados para el Modal de Pago
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [orderToPay, setOrderToPay] = useState<PedidoPendiente | null>(null);
  const [selectedMetodo, setSelectedMetodo] = useState<MetodoPago | null>(null);
  const [referencia, setReferencia] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ordenes-pendientes");
      if (!res.ok) throw new Error("Error fetching pendientes");
      const data = await res.json();
      setPedidos(data);

      // Traemos métodos de pago para el modal
      const resMetodos = await fetch("/api/pedidos");
      const metodosData = await resMetodos.json();
      if (Array.isArray(metodosData)) {
        setMetodosPago(metodosData);
        if (metodosData.length > 0) setSelectedMetodo(metodosData[0]);
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      const res = await fetch(`/api/pedidos/${orderToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Error");
      toast.success("Orden eliminada correctamente");
      setOrderToDelete(null);
      fetchData(); 
    } catch (error) {
      toast.error("Hubo un problema al eliminar la orden");
    }
  };

  const handleCobrarSubmit = async () => {
    if (!orderToPay || !selectedMetodo) return;
    const requiresRef = ["pago móvil", "punto de venta", "zelle"].some(m => selectedMetodo.nombre.toLowerCase().includes(m));
    if (requiresRef && referencia.trim().length < 4) return toast.warning("Ingresa una referencia válida");

    setIsProcessingPayment(true);
    try {
      const res = await fetch(`/api/ordenes-pendientes/${orderToPay.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodoPagoId: selectedMetodo.id, referencia })
      });
      if (!res.ok) throw new Error("Error");
      
      toast.success(`Orden cobrada con éxito. Pago por $${orderToPay.totalUSD.toFixed(2)} registrado.`);
      setPayModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al procesar el cobro");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openPayModal = (pedido: PedidoPendiente) => {
    setOrderToPay(pedido);
    setReferencia("");
    setPayModalOpen(true);
  };

  const formatHora = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getIconForMethod = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes("efectivo")) return <Banknote className="w-5 h-5" />;
    if (n.includes("móvil") || n.includes("zelle")) return <Smartphone className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  const totalDeudaUSD = pedidos.reduce((acc, p) => acc + p.totalUSD, 0);
  const totalDeudaVES = pedidos.reduce((acc, p) => acc + p.totalVES, 0);

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#FDF8F1]">
        <Loader2 className="w-12 h-12 animate-spin text-[#B43E17]" />
        <p className="mt-4 font-black text-[#294C29] uppercase tracking-widest text-xs">Buscando Cuentas por Cobrar...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDF8F1] p-4 sm:p-6 lg:p-10 overflow-y-auto pb-24">
      
      {/* MODAL DE CONFIRMACIÓN DE ELIMINADO */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar Orden Pendiente?"
        message="¿Estás seguro de que deseas eliminar esta cuenta? Los productos registrados no se cobrarán. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
      />

      {/* HEADER */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sm:mb-10 gap-6">
        <div className="flex flex-col items-center lg:items-start space-y-2 w-full md:w-auto text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl md:text-5xl font-black text-[#294C29] uppercase tracking-tighter leading-none">
            Órdenes <span className="text-[#B43E17]">Pendientes</span>
          </h1>
          <div className="h-1.5 w-16 bg-[#B43E17] rounded-full mx-auto lg:mx-0"></div>
          <p className="text-[#294C29]/60 font-bold text-xs sm:text-sm mt-3 flex items-center justify-center lg:justify-start gap-2 pt-2 uppercase tracking-widest">
            <Clock className="w-4 h-4" /> Cuentas por Cobrar
          </p>
        </div>
        
        <div className="bg-red-50 px-6 py-4 rounded-4xl border border-red-500/20 shadow-sm flex items-center gap-4 w-full md:w-auto justify-center">
          <div className="text-center px-4 border-r border-red-500/20">
            <span className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-red-500/70">Tickets Pendientes</span>
            <span className="text-2xl sm:text-3xl font-black text-red-600 leading-none">{pedidos.length}</span>
          </div>
          <div className="text-center px-4">
            <span className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-red-500/70">Total Deuda</span>
            <span className="text-2xl sm:text-3xl font-black text-red-600 leading-none">${totalDeudaUSD.toFixed(2)}</span>
            <span className="block text-[9px] sm:text-[10px] font-bold text-red-500 uppercase tracking-widest">Bs. {totalDeudaVES.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {pedidos.length === 0 ? (
          <div className="bg-white rounded-4xl p-16 text-center border border-[#294C29]/10 shadow-sm">
            <CheckCircle2 className="w-16 h-16 text-[#294C29]/20 mx-auto mb-4" />
            <h2 className="text-xl font-black text-[#294C29] uppercase tracking-tighter">Todo bajo control</h2>
            <p className="font-bold text-[#294C29]/50 text-sm mt-2">No hay ninguna orden pendiente de cobro en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {pedidos.map((pedido) => {
              const isExpanded = expandedId === pedido.id;

              return (
                <div key={pedido.id} className="bg-white rounded-4xl border-2 border-red-500/20 shadow-sm overflow-hidden flex flex-col hover:border-red-500/40 transition-colors">
                  
                  {/* CABECERA DE LA TARJETA */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 bg-red-50 text-red-500">
                        <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-lg sm:text-xl text-[#294C29] uppercase tracking-tighter leading-none mb-1.5 truncate">{pedido.cliente?.nombre || "Cliente"}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-bold text-[#294C29]/50 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-red-500" /> {formatHora(pedido.createdAt)}</span>
                          <span className="flex items-center gap-1">CI: {pedido.cliente?.cedula || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-4 sm:gap-6 w-full lg:w-auto border-t lg:border-t-0 border-[#294C29]/5 pt-4 lg:pt-0">
                      <div className="text-left lg:text-right">
                        <span className="block text-2xl sm:text-3xl font-black text-red-600 leading-none">${pedido.totalUSD.toFixed(2)}</span>
                        <span className="text-[10px] sm:text-[11px] font-black text-red-500 uppercase tracking-widest mt-1 block">Bs. {pedido.totalVES.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* BOTÓN COBRAR RÁPIDO */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); openPayModal(pedido); }}
                          className="bg-[#B43E17] hover:bg-[#9F280A] text-white px-4 sm:px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] sm:text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Cobrar</span>
                        </button>

                        <div className="flex items-center gap-1 bg-[#FDF8F1] rounded-xl p-1 border border-[#294C29]/5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/home?pedidoId=${pedido.id}&action=edit`); }}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#294C29]/50 hover:text-[#294C29] hover:bg-white transition-colors"
                            title="Editar Orden"
                          >
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOrderToDelete(pedido.id); }}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#294C29]/50 hover:text-red-500 hover:bg-white transition-colors"
                            title="Eliminar Orden"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                        <div className={`w-8 h-8 rounded-full bg-[#FDF8F1] flex items-center justify-center text-[#B43E17] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DESPLEGABLE: DETALLES DE LA ORDEN */}
                  {isExpanded && (
                    <div className="bg-[#FDF8F1]/50 border-t border-red-500/20 p-5 sm:p-6 lg:p-8 animate-in slide-in-from-top-4 duration-300">
                      <h4 className="text-xs sm:text-sm font-black text-[#294C29] uppercase tracking-widest mb-4">Contenido del Ticket</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {pedido.detalles.map(detalle => {
                          const itemTotalUSD = detalle.subtotal + (detalle.subDetalles?.reduce((acc, sub) => acc + sub.subtotal, 0) || 0);
                          const tieneExtras = detalle.subDetalles && detalle.subDetalles.length > 0;

                          return (
                            <div key={detalle.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-[#294C29]/10 shadow-sm flex flex-col">
                              <h4 className="font-black text-[#294C29] text-sm sm:text-base uppercase tracking-tighter flex items-baseline gap-1.5 mb-2">
                                <span className="text-[#B43E17] text-base sm:text-lg">{detalle.cantidad}X</span> {detalle.producto?.nombre}
                              </h4>
                              {tieneExtras && (
                                <div className="mb-4 pl-3 border-l-2 border-[#B43E17]/20 space-y-2">
                                  {detalle.subDetalles.map((sub, idx) => (
                                    <div key={idx} className="flex flex-col">
                                      <span className="font-bold text-[#294C29] text-[11px] sm:text-xs tracking-tight">+ {sub.cantidad}x {sub.producto?.nombre}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex justify-end items-end pt-3 border-t border-[#294C29]/5 mt-auto">
                                <span className="font-black text-[#294C29] text-xl leading-none">${itemTotalUSD.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE COBRO RÁPIDO */}
      {payModalOpen && orderToPay && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A301A]/60" onClick={() => setPayModalOpen(false)}></div>
          
          <div className="bg-white rounded-4xl w-full max-w-lg shadow-2xl z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-6 bg-[#294C29] text-[#F6E4C9] flex justify-between items-center">
              <div>
                <h3 className="font-black uppercase tracking-tighter text-xl">Procesar Pago</h3>
                <p className="text-xs font-bold text-[#F6E4C9]/60 mt-1 uppercase tracking-widest">{orderToPay.cliente?.nombre}</p>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center p-6 bg-[#FDF8F1] rounded-2xl border border-[#294C29]/10">
                <span className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#294C29]/50 mb-1">Monto a Cobrar</span>
                <span className="text-4xl sm:text-5xl font-black text-[#B43E17] leading-none block">${orderToPay.totalUSD.toFixed(2)}</span>
                <span className="text-sm font-bold text-[#294C29] mt-2 block">Bs. {orderToPay.totalVES.toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[#294C29]/70 uppercase tracking-widest">Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  {metodosPago.map(metodo => (
                    <button
                      key={metodo.id}
                      onClick={() => { setSelectedMetodo(metodo); setReferencia(""); }}
                      className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${selectedMetodo?.id === metodo.id ? "bg-[#B43E17]/10 border-[#B43E17] text-[#B43E17] shadow-sm" : "bg-white border-[#294C29]/10 text-[#294C29]/60 hover:border-[#294C29]/30"}`}
                    >
                      {getIconForMethod(metodo.nombre)}
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-center truncate w-full">{metodo.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedMetodo && ["pago móvil", "punto de venta", "zelle"].some(m => selectedMetodo.nombre.toLowerCase().includes(m)) && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-xs font-black text-[#294C29]/70 uppercase tracking-widest">Número de Referencia</label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej: 1234"
                    className="w-full bg-[#FDF8F1] text-[#294C29] font-bold text-sm sm:text-base rounded-2xl py-4 px-5 focus:outline-none border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-[#FDF8F1] border-t border-[#294C29]/5">
              <button
                onClick={handleCobrarSubmit}
                disabled={isProcessingPayment}
                className="w-full bg-[#B43E17] hover:bg-[#9F280A] text-white py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all shadow-md flex justify-center items-center gap-3 disabled:opacity-50"
              >
                {isProcessingPayment ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><CheckCircle2 className="w-5 h-5" /> Confirmar Pago Exitoso</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}