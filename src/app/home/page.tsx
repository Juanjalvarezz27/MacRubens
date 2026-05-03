"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ClienteSetup, { DatosCliente } from "../components/ordenes/ClienteSetup";
import MenuSetup, { Producto, SubItem, CartItem } from "../components/ordenes/MenuSetup";
import PagoSetup from "../components/ordenes/PagoSetup";
import useTasaBCV from "../../hooks/useTasaBCV";
import { User, Pizza, CreditCard, ShoppingBag, ChevronUp, ChevronRight, X, Plus, Minus, Loader2, Edit3, Trash2 } from "lucide-react";
import ConfirmModal from "../components/ui/ConfirmModal";
import { toast } from "react-toastify";

function POSContent() {
  const { tasa, loading: loadingTasa } = useTasaBCV();
  const tasaActual = tasa || 600;

  const searchParams = useSearchParams();
  const pedidoPendienteId = searchParams.get("pedidoId");
  const actionType = searchParams.get("action");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cliente, setCliente] = useState<DatosCliente | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const initStarted = useRef(false);

  // Función para resetear localmente y en storage
  const resetCaja = () => {
    setCart([]);
    setCliente(null);
    setStep(1);
    setIsMobileCartOpen(false);
    setEditingItem(null);
    localStorage.removeItem("macrubens_cart");
    localStorage.removeItem("macrubens_cliente");
    localStorage.removeItem("macrubens_step");
    localStorage.removeItem("macrubens_pedido_activo");
  };

  useEffect(() => {
    const initPOS = async () => {
      if (initStarted.current) return;
      initStarted.current = true;

      if (pedidoPendienteId) {
        try {
          const res = await fetch(`/api/pedidos/${pedidoPendienteId}`);
          if (res.ok) {
            const data = await res.json();

            setCliente({ cedula: data.cliente.cedula, nombre: data.cliente.nombre, telefono: data.cliente.telefono || "" });

            const reconstruido: CartItem[] = data.detalles.map((d: any) => ({
              uniqueId: Math.random().toString(36).substring(7),
              producto: d.producto,
              cantidad: d.cantidad,
              esPequena: false,
              precioUnitario: d.precioUnitario,
              subItems: d.subDetalles.map((sub: any) => ({
                producto: sub.producto,
                cantidad: sub.cantidad / d.cantidad,
                precio: sub.precioUnitario
              })),
              subtotal: d.subtotal + d.subDetalles.reduce((acc: number, sub: any) => acc + sub.subtotal, 0)
            }));

            setCart(reconstruido);
            setStep(actionType === "edit" ? 2 : 3);

            localStorage.setItem("macrubens_pedido_activo", pedidoPendienteId);
            window.history.replaceState(null, "", "/home");

            toast.success(actionType === "edit" ? "Orden lista para ser editada" : "Orden recuperada correctamente");
          } else {
            toast.error("No se pudo cargar la orden");
          }
        } catch (error) {
          toast.error("Error de conexión al cargar la orden");
        }
      } else {
        try {
          const savedCart = localStorage.getItem("macrubens_cart");
          const savedCliente = localStorage.getItem("macrubens_cliente");
          const savedStep = localStorage.getItem("macrubens_step");

          if (savedCart) setCart(JSON.parse(savedCart));
          if (savedCliente) setCliente(JSON.parse(savedCliente));
          if (savedStep) setStep(Number(savedStep) as 1 | 2 | 3);
        } catch (e) {
          console.error("Error cargando el borrador", e);
        }
      }
      setIsHydrated(true);
    };

    if (!isHydrated) initPOS();

    /** 
     * LÓGICA SOLICITADA:
     * Al retornar una función en este useEffect, se ejecutará cuando el componente
     * se desmonte (al cambiar de ruta). Esto limpia el localStorage.
     */
    return () => {
      localStorage.removeItem("macrubens_cart");
      localStorage.removeItem("macrubens_cliente");
      localStorage.removeItem("macrubens_step");
      localStorage.removeItem("macrubens_pedido_activo");
    };
  }, [pedidoPendienteId, isHydrated, actionType]);

  useEffect(() => {
    if (isHydrated && !pedidoPendienteId) {
      localStorage.setItem("macrubens_cart", JSON.stringify(cart));
      localStorage.setItem("macrubens_step", step.toString());
      if (cliente) {
        localStorage.setItem("macrubens_cliente", JSON.stringify(cliente));
      } else {
        localStorage.removeItem("macrubens_cliente");
      }
    }
  }, [cart, cliente, step, isHydrated, pedidoPendienteId]);

  useEffect(() => {
    if (isMobileCartOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isMobileCartOpen]);

  const handleCancelOrderConfirm = () => {
    resetCaja();
    setIsCancelModalOpen(false);
    toast.info("La orden ha sido cancelada y borrada.");
  };

  const handleClientConfirmed = (datos: DatosCliente) => {
    setCliente(datos);
    setStep(2);
  };

  const calcularSubtotalItem = (precioUnitario: number, subItems: SubItem[], cantidad: number) => {
    const costoAdicionales = subItems.reduce((acc, sub) => acc + (sub.precio * sub.cantidad), 0);
    return (precioUnitario + costoAdicionales) * cantidad;
  };

  const addToCart = (producto: Producto, esPequena: boolean, subItems: SubItem[], editId?: string) => {
    const precioUnitario = esPequena && producto.precioPequena ? producto.precioPequena : producto.precioBase;

    if (editId) {
      setCart(cart.map(item => {
        if (item.uniqueId === editId) {
          return {
            ...item, producto, esPequena, subItems, precioUnitario,
            subtotal: calcularSubtotalItem(precioUnitario, subItems, item.cantidad)
          };
        }
        return item;
      }));
      setEditingItem(null);
      return;
    }

    const existingIndex = cart.findIndex(item =>
      item.producto.id === producto.id &&
      item.esPequena === esPequena &&
      JSON.stringify(item.subItems) === JSON.stringify(subItems)
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].cantidad += 1;
      newCart[existingIndex].subtotal = calcularSubtotalItem(newCart[existingIndex].precioUnitario, newCart[existingIndex].subItems, newCart[existingIndex].cantidad);
      setCart(newCart);
    } else {
      setCart([...cart, {
        uniqueId: Math.random().toString(36).substring(7),
        producto, cantidad: 1, esPequena, precioUnitario, subItems,
        subtotal: calcularSubtotalItem(precioUnitario, subItems, 1)
      }]);
    }
  };

  const updateQuantity = (uniqueId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.uniqueId === uniqueId) {
        const newQty = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newQty, subtotal: calcularSubtotalItem(item.precioUnitario, item.subItems, newQty) };
      }
      return item;
    }));
  };

  const handleConfirmDelete = () => {
    if (idToDelete) {
      setCart(cart.filter(item => item.uniqueId !== idToDelete));
      setIdToDelete(null);
    }
  };

  const totalUSD = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalVES = totalUSD * tasaActual;

  if (!isHydrated) return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#FDF8F1]">
      <Loader2 className="w-12 h-12 animate-spin text-[#B43E17]" />
      <p className="mt-4 font-black text-[#294C29] uppercase tracking-widest text-xs">Preparando caja...</p>
    </div>
  );

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-[#FDF8F1] overflow-hidden relative">
      <ConfirmModal
        isOpen={!!idToDelete}
        onClose={() => setIdToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Quitar producto?"
        message="¿Estás seguro de que deseas eliminar este ítem del ticket?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrderConfirm}
        title="¿Cancelar Orden?"
        message="¿Estás seguro de que deseas borrar toda la orden y los datos del cliente actual? Esta acción no se puede deshacer."
        confirmText="Cancelar"
        cancelText="Volver"
        isDestructive={true}
      />

      {/* LADO IZQUIERDO */}
      <div className="flex-1 flex flex-col h-full lg:h-[calc(100vh-80px)] overflow-y-auto p-4 lg:p-10 pb-28 lg:pb-10">
        <div className="mb-6 max-w-3xl mx-auto w-full flex justify-between items-center">
          <div>
            <h1 className="text-2xl lg:text-4xl font-black text-[#294C29] uppercase tracking-tighter leading-none">
              Caja <span className="text-[#B43E17]">Registradora</span>
            </h1>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-[#294C29]/10 shadow-sm flex items-center gap-2">
            {loadingTasa ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#B43E17]" />
            ) : (
              <span className="font-black text-sm text-[#B43E17]">Bs. {tasaActual.toFixed(2)}</span>
            )}
          </div>
        </div>

        <div className="mb-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between relative px-4 lg:px-10">
            <div className="absolute left-4 right-4 lg:left-10 lg:right-10 top-1/2 -translate-y-1/2 h-1 bg-[#294C29]/10 rounded-full z-0"></div>

            <div className="relative z-10 flex flex-col items-center gap-2 cursor-pointer" onClick={() => setStep(1)}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${step >= 1 ? "bg-[#294C29] text-[#F6E4C9] shadow-md" : "bg-white text-[#294C29]/30 border border-[#294C29]/10"}`}><User className="w-6 h-6" /></div>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2 cursor-pointer" onClick={() => cliente && setStep(2)}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${step >= 2 ? "bg-[#294C29] text-[#F6E4C9] shadow-md" : "bg-white text-[#294C29]/30 border border-[#294C29]/10"}`}><Pizza className="w-6 h-6" /></div>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2 cursor-pointer" onClick={() => cart.length > 0 && setStep(3)}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${step >= 3 ? "bg-[#B43E17] text-[#F6E4C9] shadow-md" : "bg-white text-[#294C29]/30 border border-[#294C29]/10"}`}><CreditCard className="w-6 h-6" /></div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {step === 1 && <ClienteSetup onClientConfirmed={handleClientConfirmed} clientePrevio={cliente} />}
          {step === 2 && (
            <>
              <MenuSetup onAddToCart={addToCart} itemToEdit={editingItem} onCancelEdit={() => setEditingItem(null)} />
              {cart.length > 0 && (
                <div className="hidden lg:flex justify-end mt-6 gap-3">
                  <button onClick={() => setIsCancelModalOpen(true)} className="bg-white hover:bg-[#B43E17]/10 text-[#B43E17] border border-[#B43E17]/30 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Cancelar
                  </button>
                  <button onClick={() => setStep(3)} className="bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-md flex items-center gap-3">
                    Ir a Pagar <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
          {step === 3 && cliente && (
            <PagoSetup
              cliente={cliente}
              cart={cart}
              tasaBCV={tasaActual}
              totalUSD={totalUSD}
              totalVES={totalVES}
              onVolver={() => setStep(2)}
              onSuccess={resetCaja}
              onCancelOrder={() => setIsCancelModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* BARRA FLOTANTE MOBILE */}
      {step > 1 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#294C29]/10 rounded-t-3xl p-3 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-40">
          <button onClick={() => setIsMobileCartOpen(true)} className="w-full bg-[#294C29] text-[#F6E4C9] py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm flex justify-between items-center">
            <div className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> <span>Ticket ({cart.length})</span></div>
            <div className="flex items-center gap-1"><span>${totalUSD.toFixed(2)}</span><ChevronUp className="w-5 h-5" /></div>
          </button>
        </div>
      )}

      {/* LADO DERECHO: TICKET */}
      <div className={`fixed inset-0 z-50 bg-[#FDF8F1] flex flex-col transition-transform duration-300 ease-in-out ${isMobileCartOpen ? "translate-y-0" : "translate-y-full"} lg:static lg:translate-y-0 lg:w-115 lg:bg-white lg:border-l lg:border-[#294C29]/10 lg:h-[calc(100vh-80px)] lg:z-auto ${step === 1 ? "lg:flex hidden" : "flex"}`}>
        <div className="p-6 border-b border-[#294C29]/10 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-[#294C29] uppercase tracking-tighter leading-none">Ticket</h2>
            <p className="text-[11px] font-bold text-[#B43E17] tracking-widest uppercase mt-1">{cliente ? cliente.nombre : "Sin cliente"}</p>
          </div>
          <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 bg-[#FDF8F1] hover:bg-[#EADDCA] text-[#294C29] rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-4 bg-[#FDF8F1]/50 lg:bg-transparent">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#294C29]/20">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold uppercase tracking-widest text-xs text-center">Ticket Vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const esPizza = ["base", "especial"].includes(item.producto.categoria?.nombre.toLowerCase() || "");
                return (
                  <div key={item.uniqueId} className="bg-white p-5 rounded-3xl border border-[#294C29]/10 shadow-sm relative group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-black text-[#294C29] text-lg leading-tight uppercase flex flex-wrap items-baseline gap-1">
                          <span className="text-[#B43E17]">{item.cantidad}x</span>
                          {item.producto.nombre}
                        </h4>
                        {item.esPequena && <span className="inline-block text-[10px] font-black bg-[#B43E17]/10 text-[#B43E17] px-2 py-0.5 rounded-md uppercase tracking-widest mt-2">Pequeña</span>}
                      </div>
                      <div className="flex items-center gap-1 bg-[#FDF8F1] rounded-lg p-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        {esPizza && (
                          <button onClick={() => setEditingItem(item)} className="p-1.5 text-[#294C29]/40 hover:text-[#294C29] hover:bg-white rounded-md transition-colors" title="Editar Pizza">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setIdToDelete(item.uniqueId)} className="p-1.5 text-[#294C29]/40 hover:text-[#B43E17] hover:bg-white rounded-md transition-colors" title="Eliminar Item">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {item.subItems.length > 0 && (
                      <div className="pl-3 border-l-2 border-[#294C29]/20 my-3 space-y-2">
                        {item.subItems.map((sub, idx) => (
                          <div key={idx} className="flex flex-col text-[15px] font-bold text-[#294C29]">
                            <span>+ {sub.cantidad}x {sub.producto.nombre}</span>
                            <span className="text-[12px] text-[#294C29]/70 font-semibold">
                              ${sub.precio.toFixed(2)} <span className="text-[#294C29]/30">|</span> Bs. {(sub.precio * tasaActual).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#294C29]/5">
                      <div className="flex items-center gap-3 bg-[#FDF8F1] rounded-xl p-1 border border-[#294C29]/5">
                        <button onClick={() => updateQuantity(item.uniqueId, -1)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-[#B43E17] hover:text-white shadow-sm transition-colors"><Minus className="w-4 h-4" /></button>
                        <span className="font-black text-[#294C29] text-base w-6 text-center">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.uniqueId, 1)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-[#294C29] hover:text-white shadow-sm transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-[#294C29] text-lg leading-none">${item.subtotal.toFixed(2)}</span>
                        <span className="text-sm font-bold text-[#B43E17] mt-1">Bs. {(item.subtotal * tasaActual).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-[#294C29]/10 pb-8 lg:pb-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="block text-[10px] font-black text-[#B43E17] uppercase tracking-widest">Total VES</span>
              <span className="text-lg font-black text-[#294C29]/60">Bs. {totalVES.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-black text-[#294C29]/50 uppercase tracking-widest">Total USD</span>
              <span className="text-4xl font-black text-[#294C29] tracking-tighter leading-none">${totalUSD.toFixed(2)}</span>
            </div>
          </div>

          <div className="lg:hidden">
            <button onClick={() => { setStep(3); setIsMobileCartOpen(false); }} disabled={cart.length === 0} className="w-full bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex justify-center items-center gap-2 disabled:opacity-50 shadow-md">
              Proceder al Pago <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#FDF8F1]">
        <Loader2 className="w-12 h-12 animate-spin text-[#B43E17]" />
        <p className="mt-4 font-black text-[#294C29] uppercase tracking-widest text-xs">Preparando sistema...</p>
      </div>
    }>
      <POSContent />
    </Suspense>
  );
}