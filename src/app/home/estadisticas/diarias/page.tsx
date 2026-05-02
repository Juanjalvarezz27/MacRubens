"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, ChevronDown, ChevronUp, Pizza, User, Clock, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import ResumenGraficoDia from "../../../components/estadisticas/ResumenGraficoDia";

interface Categoria { nombre: string; }
interface Producto { nombre: string; categoria: Categoria; }
interface SubDetalle { id: string; cantidad: number; precioUnitario: number; subtotal: number; producto: Producto; }
interface Detalle { id: string; cantidad: number; precioUnitario: number; subtotal: number; producto: Producto; subDetalles: SubDetalle[]; }
interface Pago { metodo: { nombre: string }; montoUSD: number; montoVES: number; }
interface Cliente { nombre: string; cedula: string; telefono: string | null; }

interface Pedido {
  id: string;
  totalUSD: number;
  totalVES: number;
  tasaBCV: number;
  estadoPago: "PAGADO" | "PENDIENTE";
  createdAt: string;
  cliente: Cliente;
  detalles: Detalle[];
  pagos: Pago[];
}

export default function EstadisticasDiariasPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para expandir la orden completa
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Estado para expandir los toppings de cada pizza individualmente
  const [expandedDetalles, setExpandedDetalles] = useState<Record<string, boolean>>({});

  const fetchEstadisticas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/estadisticas-diarias");
      if (!res.ok) throw new Error("Error al obtener los datos");
      const json = await res.json();
      setPedidos(json.pedidos);
    } catch (error) {
      toast.error("No se pudieron cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const formatHora = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const fechaHoy = new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const toggleDetalle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se cierre la orden completa al hacer clic aquí
    setExpandedDetalles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ALGORITMO RETROACTIVO: Agrupa órdenes viejas planas simulando la jerarquía Padre-Hijo
  const agruparDetalles = (detallesPlano: Detalle[]) => {
    const agrupados: Detalle[] = [];
    let ultimaPizza: Detalle | null = null;

    detallesPlano.forEach(detalle => {
      const nombreCat = detalle.producto.categoria.nombre.toLowerCase();
      const isPizza = ["base", "especial", "pizza"].some(c => nombreCat.includes(c));
      const isTopping = ["topping", "extra", "adicional", "ingrediente"].some(c => nombreCat.includes(c));

      // 1. Si la orden es NUEVA y ya viene agrupada desde la BD
      if (detalle.subDetalles && detalle.subDetalles.length > 0) {
        agrupados.push(detalle);
        ultimaPizza = null;
      } 
      // 2. Si es una Pizza, creamos la tarjeta padre y la guardamos en memoria
      else if (isPizza) {
        const nuevaPizza = { ...detalle, subDetalles: [] };
        agrupados.push(nuevaPizza);
        ultimaPizza = nuevaPizza;
      }
      // 3. Si es un Topping huérfano (Órdenes Viejas) y tenemos una pizza activa arriba
      else if (isTopping && ultimaPizza) {
        ultimaPizza.subDetalles.push({
          id: detalle.id,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.subtotal,
          producto: detalle.producto
        });
      }
      // 4. Si es Bebida, Caja, u otra cosa
      else {
        agrupados.push({ ...detalle, subDetalles: [] });
        ultimaPizza = null;
      }
    });

    return agrupados;
  };

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#FDF8F1]">
        <Loader2 className="w-12 h-12 animate-spin text-[#B43E17]" />
        <p className="mt-4 font-black text-[#294C29] uppercase tracking-widest text-xs">Cargando Actividad del Día...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDF8F1] p-6 lg:p-10 overflow-y-auto">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex flex-col items-center lg:items-start space-y-2 w-full md:w-auto text-center md:text-left">
          <h1 className="text-5xl md:text-5xl font-black text-[#294C29] uppercase tracking-tighter leading-none">
            Estadísticas <span className="text-[#B43E17]">Diarias</span>
          </h1>
          <div className="h-1.5 w-16 bg-[#B43E17] rounded-full mx-auto lg:mx-0"></div>
          <p className="text-[#294C29]/60 font-bold text-sm mt-3 capitalize flex items-center justify-center lg:justify-start gap-2 pt-2">
            <Calendar className="w-4 h-4" /> {fechaHoy}
          </p>
        </div>
        
        <div className="bg-white px-6 py-4 rounded-4xl border border-[#294C29]/10 shadow-sm flex items-center gap-4 w-full md:w-auto justify-center">
          <div className="text-center px-4 border-r border-[#294C29]/10">
            <span className="block text-[10px] font-black uppercase tracking-widest text-[#294C29]/50">Órdenes Hoy</span>
            <span className="text-2xl font-black text-[#294C29]">{pedidos.length}</span>
          </div>
          <div className="text-center px-4">
            <span className="block text-[10px] font-black uppercase tracking-widest text-[#B43E17]/60">Pendientes</span>
            <span className="text-2xl font-black text-[#B43E17]">{pedidos.filter(p => p.estadoPago === "PENDIENTE").length}</span>
          </div>
        </div>
      </div>

      {/* COMPONENTE DE GRÁFICAS */}
      <div className="max-w-5xl mx-auto">
         <ResumenGraficoDia pedidos={pedidos} />
      </div>

      {/* LISTA DE ÓRDENES */}
      <div className="max-w-5xl mx-auto">
        {pedidos.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[#294C29]/10 shadow-sm">
            <Pizza className="w-16 h-16 text-[#294C29]/20 mx-auto mb-4" />
            <h2 className="text-xl font-black text-[#294C29] uppercase tracking-tighter">Sin movimientos</h2>
            <p className="font-bold text-[#294C29]/50 text-sm mt-2">Aún no se han registrado órdenes en el día de hoy.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const isExpanded = expandedId === pedido.id;
              const isPendiente = pedido.estadoPago === "PENDIENTE";
              
              const detallesOrganizados = agruparDetalles(pedido.detalles);

              return (
                <div key={pedido.id} className={`bg-white rounded-4xl border-2 transition-all shadow-sm overflow-hidden ${isPendiente ? "border-[#B43E17]/30" : "border-[#294C29]/5 hover:border-[#294C29]/20"}`}>
                  
                  {/* BARRA SUPERIOR DE LA ORDEN */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    className="p-5 lg:p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isPendiente ? "bg-[#B43E17]/10 text-[#B43E17]" : "bg-[#FDF8F1] text-[#294C29]"}`}>
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-[#294C29] uppercase tracking-tighter leading-none mb-1">{pedido.cliente.nombre}</h3>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-[#294C29]/50 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatHora(pedido.createdAt)}</span>
                          <span className="flex items-center gap-1">CI: {pedido.cliente.cedula}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 border-[#294C29]/10 pt-4 lg:pt-0">
                      <div className="text-left lg:text-right">
                        <span className="block text-2xl font-black text-[#294C29] leading-none">${pedido.totalUSD.toFixed(2)}</span>
                        <span className="text-[10px] font-black text-[#B43E17] uppercase tracking-widest mt-1">Bs. {pedido.totalVES.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isPendiente ? (
                          // AQUÍ ESTÁ EL BOTÓN DE REDIRECCIÓN A LA CAJA
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Evita que se abra/cierre el acordeón al darle clic
                              router.push(`/home?pedidoId=${pedido.id}`); // Lanza al usuario a la caja
                            }}
                            className="bg-[#B43E17] hover:bg-[#9F280A] text-white px-4 py-2 rounded-xl uppercase tracking-widest text-[10px] font-black flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <CreditCard className="w-4 h-4" /> Pagar Orden
                          </button>
                        ) : (
                          <span className="bg-[#294C29]/10 text-[#294C29] px-3 py-1.5 rounded-xl uppercase tracking-widest text-[10px] font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {pedido.pagos[0]?.metodo.nombre || "Pagado"}
                          </span>
                        )}
                        <div className="w-8 h-8 bg-[#FDF8F1] rounded-full flex items-center justify-center text-[#294C29]">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DETALLE DE LA ORDEN */}
                  {isExpanded && (
                    <div className="bg-[#FDF8F1]/50 border-t border-[#294C29]/10 p-6 lg:p-8 animate-in slide-in-from-top-4 duration-300">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {detallesOrganizados.map(detalle => {
                          
                          const itemTotalUSD = detalle.subtotal + (detalle.subDetalles?.reduce((acc, sub) => acc + sub.subtotal, 0) || 0);
                          const itemTotalVES = itemTotalUSD * pedido.tasaBCV;
                          
                          const tieneExtras = detalle.subDetalles && detalle.subDetalles.length > 0;
                          const isItemExpanded = expandedDetalles[detalle.id] || false;

                          return (
                            <div key={detalle.id} className="bg-white p-6 rounded-4xl border border-[#294C29]/10 shadow-sm flex flex-col h-fit">
                              
                              {/* PRODUCTO PRINCIPAL Y BOTÓN DE DESPLEGAR */}
                              <div className="mb-4 flex justify-between items-start gap-4">
                                <h4 className="font-black text-[#294C29] text-[17px] uppercase tracking-tighter flex items-baseline gap-1.5">
                                  <span className="text-[#B43E17] text-lg">{detalle.cantidad}X</span> {detalle.producto.nombre}
                                </h4>
                                
                                {tieneExtras && (
                                  <button 
                                    onClick={(e) => toggleDetalle(detalle.id, e)}
                                    className="w-8 h-8 rounded-full bg-[#FDF8F1] flex items-center justify-center text-[#294C29] hover:bg-[#EADDCA] transition-colors shrink-0"
                                  >
                                    {isItemExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                )}
                              </div>
                              
                              {/* TOPPINGS / EXTRAS (DESPLEGABLES) */}
                              {tieneExtras && isItemExpanded && (
                                <div className="mb-4 pl-4 border-l-[3px] border-[#B43E17]/20 space-y-4 animate-in slide-in-from-top-2">
                                  {detalle.subDetalles.map((sub, idx) => (
                                    <div key={`${sub.id}-${idx}`} className="flex flex-col">
                                      <span className="font-bold text-[#294C29] text-[15px] tracking-tight">
                                        + {sub.cantidad}x {sub.producto.nombre}
                                      </span>
                                      <span className="text-[12px] font-bold text-gray-400 mt-1 tracking-wide">
                                        ${sub.precioUnitario.toFixed(2)} <span className="text-gray-300 mx-1">|</span> Bs. {(sub.precioUnitario * pedido.tasaBCV).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* PIE DE TARJETA (CANTIDAD Y TOTALES) */}
                              <div className="flex justify-between items-end pt-5 border-t border-gray-100 mt-2">
                                <div className="bg-[#FDF8F1] px-4 py-2 rounded-xl flex items-center justify-center border border-[#294C29]/5">
                                   <span className="font-black text-sm uppercase tracking-widest text-[#294C29]/60">Cant: <span className="text-lg text-[#294C29] ml-1">{detalle.cantidad}</span></span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="font-black text-[#294C29] text-[22px] leading-none">${itemTotalUSD.toFixed(2)}</span>
                                  <span className="text-[13px] font-black text-[#B43E17] mt-1.5 tracking-tight">Bs. {itemTotalVES.toFixed(2)}</span>
                                </div>
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

    </div>
  );
}