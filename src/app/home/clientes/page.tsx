"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, User, Phone, ShoppingBag, X, Calendar, AlertCircle, CheckCircle2, Filter, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

interface Producto { nombre: string; }
interface SubDetalle { producto: Producto; cantidad: number; }
interface Detalle { id: string; cantidad: number; producto: Producto; subDetalles: SubDetalle[]; }

interface Pedido {
  id: string;
  totalUSD: number;
  totalVES: number;
  estadoPago: string;
  createdAt: string;
  detalles: Detalle[];
}

interface Cliente {
  id: string;
  cedula: string;
  nombre: string;
  telefono: string | null;
  totalGastadoUSD: number;
  totalGastadoVES: number;
  cantidadPedidos: number;
  pedidos: Pedido[];
}

const ITEMS_PER_PAGE = 30; // Límite por página

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  const [sortBy, setSortBy] = useState<"recientes" | "gasto" | "frecuentes">("recientes");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch("/api/clientes");
        if (!res.ok) throw new Error("Error fetching");
        const data = await res.json();
        setClientes(data);
      } catch (error) {
        toast.error("Error al cargar la lista de clientes");
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  // Si busca o filtra, volvemos a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  // 1. Filtrado
  let clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cedula.includes(searchTerm)
  );

  // 2. Ordenamiento
  if (sortBy === "gasto") {
    clientesFiltrados.sort((a, b) => b.totalGastadoUSD - a.totalGastadoUSD);
  } else if (sortBy === "frecuentes") {
    clientesFiltrados.sort((a, b) => b.cantidadPedidos - a.cantidadPedidos);
  } else {
    clientesFiltrados.sort((a, b) => {
      if (a.pedidos.length && b.pedidos.length) {
        return new Date(b.pedidos[0].createdAt).getTime() - new Date(a.pedidos[0].createdAt).getTime();
      }
      return 0;
    });
  }

  // 3. Cálculos de Paginación
  const totalPages = Math.ceil(clientesFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  // ESTA ES LA VARIABLE CLAVE QUE CORTA LA LISTA A 30
  const currentClientes = clientesFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatHora = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-VE', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const filterOptions = [
    { value: "recientes", label: "Más Recientes" },
    { value: "gasto", label: "Top Gasto ($)" },
    { value: "frecuentes", label: "Más Frecuentes" }
  ];

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#FDF8F1]">
        <Loader2 className="w-12 h-12 animate-spin text-[#B43E17]" />
        <p className="mt-4 font-black text-[#294C29] uppercase tracking-widest text-xs">Cargando Directorio...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex bg-[#FDF8F1] overflow-hidden relative">
      
      {/* PANEL PRINCIPAL */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-y-auto p-6 lg:p-10 pb-20">
        
        {/* HEADER, BUSCADOR Y FILTROS */}
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 z-10 relative">
          
          <div className="flex flex-col items-center lg:items-start space-y-2 w-full md:w-auto text-center md:text-left">
            <h1 className="text-5xl md:text-5xl font-black text-[#294C29] uppercase tracking-tighter leading-none">
              Directorio de <span className="text-[#B43E17]">Clientes</span>
            </h1>
            <div className="h-1.5 w-16 bg-[#B43E17] rounded-full mx-auto lg:mx-0"></div>
            <p className="text-[#294C29]/60 font-bold text-sm mt-3 flex items-center justify-center lg:justify-start gap-2 pt-2">
              <User className="w-4 h-4" /> {clientes.length} Clientes registrados
            </p>
          </div>
          
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-center">
            {/* Buscador */}
            <div className="w-full sm:w-72 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-[#294C29]/40" />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente o CI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-[#294C29] font-bold text-sm rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all shadow-sm"
              />
            </div>

            {/* FILTRO DROPDOWN PERSONALIZADO */}
            <div className="w-full sm:w-52 relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full bg-white text-[#B43E17] font-black uppercase tracking-widest text-xs rounded-2xl py-3.5 px-5 flex items-center justify-between border border-[#294C29]/10 hover:border-[#B43E17]/50 transition-all shadow-sm focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#B43E17]" />
                  {filterOptions.find(opt => opt.value === sortBy)?.label}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
              </button>

              {isFilterOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
              )}

              <div className={`absolute top-full left-0 right-0 mt-2 bg-white border border-[#294C29]/10 rounded-2xl shadow-xl overflow-hidden z-20 transition-all duration-200 origin-top ${isFilterOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value as any);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-widest transition-colors ${
                      sortBy === opt.value
                        ? "bg-[#B43E17]/10 text-[#B43E17]"
                        : "text-[#294C29]/60 hover:bg-[#FDF8F1] hover:text-[#294C29]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* GRID DE CLIENTES */}
        <div className="max-w-6xl mx-auto w-full z-0">
          {clientesFiltrados.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-[#294C29]/10 shadow-sm">
              <User className="w-16 h-16 text-[#294C29]/20 mx-auto mb-4" />
              <h2 className="text-xl font-black text-[#294C29] uppercase tracking-tighter">Sin resultados</h2>
              <p className="font-bold text-[#294C29]/50 text-sm mt-2">No se encontraron clientes con esos parámetros.</p>
            </div>
          ) : (
            <>
              {/* AQUÍ ESTABA EL ERROR: Aseguramos mapear currentClientes en vez de clientesFiltrados */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {currentClientes.map((cliente) => (
                  <div 
                    key={cliente.id}
                    onClick={() => setSelectedCliente(cliente)}
                    className="bg-white rounded-4xl p-6 border-2 border-[#294C29]/5 hover:border-[#294C29]/20 cursor-pointer transition-all shadow-sm flex flex-col group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#FDF8F1] rounded-xl flex items-center justify-center text-[#294C29] group-hover:bg-[#294C29] group-hover:text-[#F6E4C9] transition-colors">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-[#294C29] uppercase tracking-tighter leading-tight line-clamp-1">{cliente.nombre}</h3>
                          <span className="text-[11px] font-bold text-[#294C29]/50 uppercase tracking-widest">CI: {cliente.cedula}</span>
                        </div>
                      </div>
                    </div>

                    {cliente.telefono && (
                      <div className="flex items-center gap-2 text-[#294C29]/70 mb-4 bg-[#FDF8F1] w-fit px-3 py-1.5 rounded-lg border border-[#294C29]/5">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold tracking-widest">{cliente.telefono}</span>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-[#294C29]/5 flex justify-between items-end">
                      <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-[#294C29]/40 mb-1">Órdenes Totales</span>
                        <div className="flex items-center gap-1.5 text-[#294C29]">
                          <ShoppingBag className="w-4 h-4" />
                          <span className="font-black text-lg leading-none">{cliente.cantidadPedidos}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-[#B43E17]/60 mb-1">Total Gastado</span>
                        <div className="flex items-center justify-end gap-1 text-[#B43E17]">
                          <span className="font-black text-2xl leading-none">${cliente.totalGastadoUSD.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CONTROLES DE PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12 mb-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-3 bg-white border border-[#294C29]/10 text-[#294C29] rounded-2xl hover:bg-[#FDF8F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="bg-white border border-[#294C29]/10 px-6 py-3 rounded-2xl shadow-sm">
                    <span className="text-xs font-black text-[#294C29] uppercase tracking-widest">
                      Página <span className="text-[#B43E17] mx-1">{currentPage}</span> de {totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-3 bg-white border border-[#294C29]/10 text-[#294C29] rounded-2xl hover:bg-[#FDF8F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* PANEL LATERAL (HISTORIAL DEL CLIENTE) */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-112.5 bg-white border-l border-[#294C29]/10 shadow-[text-xl_0_40px_rgba(0,0,0,0.1)] transform transition-transform duration-300 ease-in-out flex flex-col ${selectedCliente ? "translate-x-0" : "translate-x-full"}`}>
        
        {selectedCliente && (
          <>
            <div className="p-6 md:p-8 border-b border-[#294C29]/10 bg-[#FDF8F1] flex justify-between items-start">
              <div>
                <div className="w-12 h-12 bg-[#294C29] text-[#F6E4C9] rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-[#294C29] uppercase tracking-tighter leading-none mb-1">{selectedCliente.nombre}</h2>
                <div className="flex flex-col gap-1 mt-3">
                  <span className="text-xs font-bold text-[#B43E17] uppercase tracking-widest">CI: {selectedCliente.cedula}</span>
                  {selectedCliente.telefono && <span className="text-xs font-bold text-[#294C29]/60 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedCliente.telefono}</span>}
                </div>
              </div>
              <button onClick={() => setSelectedCliente(null)} className="p-2 bg-white hover:bg-[#EADDCA] text-[#294C29] rounded-full transition-colors shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 bg-white border-b border-[#294C29]/10 flex justify-between items-center shadow-sm z-10">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-[#294C29]/40 mb-1">LTV (Lifetime Value)</span>
                <span className="text-3xl font-black text-[#294C29] leading-none">${selectedCliente.totalGastadoUSD.toFixed(2)}</span>
                <span className="block text-xs font-bold text-[#B43E17] mt-1">Bs. {selectedCliente.totalGastadoVES.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-black uppercase tracking-widest text-[#294C29]/40 mb-1">Tickets Totales</span>
                <span className="text-3xl font-black text-[#294C29] leading-none">{selectedCliente.cantidadPedidos}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FDF8F1]/50">
              <h3 className="text-sm font-black text-[#294C29] uppercase tracking-widest mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B43E17]" /> Historial de Órdenes
              </h3>
              
              {selectedCliente.pedidos.length === 0 ? (
                <p className="text-sm font-bold text-[#294C29]/40 text-center mt-10">Este cliente aún no tiene órdenes registradas.</p>
              ) : (
                <div className="space-y-5">
                  {selectedCliente.pedidos.map((pedido) => (
                    <div key={pedido.id} className="bg-white p-5 rounded-2xl border border-[#294C29]/10 shadow-sm flex flex-col hover:border-[#294C29]/20 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] font-black text-[#294C29]/40 uppercase tracking-widest block mb-1">Fecha y Hora</span>
                          <span className="text-xs font-bold text-[#294C29]">{formatHora(pedido.createdAt)}</span>
                        </div>
                        {pedido.estadoPago === "PAGADO" ? (
                          <span className="bg-[#294C29]/10 text-[#294C29] px-2.5 py-1 rounded-lg uppercase tracking-widest text-[9px] font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Pagado
                          </span>
                        ) : (
                          <span className="bg-[#B43E17]/10 text-[#B43E17] px-2.5 py-1 rounded-lg uppercase tracking-widest text-[9px] font-black flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                      </div>
                      
                      <div className="py-3 border-y border-[#294C29]/5 my-3">
                        <span className="text-[10px] font-black text-[#294C29]/40 uppercase tracking-widest block mb-2">Contenido de la orden</span>
                        <ul className="space-y-1.5">
                          {pedido.detalles?.map(detalle => (
                            <li key={detalle.id} className="text-[13px] font-bold text-[#294C29]/80 flex justify-between leading-tight">
                              <span>
                                <span className="text-[#B43E17] font-black mr-1">{detalle.cantidad}x</span> 
                                {detalle.producto?.nombre || "Producto"}
                                {detalle.subDetalles?.length > 0 && <span className="text-[#294C29]/40 text-[10px] uppercase ml-1">(+ Extras)</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between items-end mt-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#294C29]/40">Total Ticket</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-[#294C29]">${pedido.totalUSD.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedCliente && (
        <div 
          className="fixed inset-0 bg-[#1A301A]/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setSelectedCliente(null)}
        />
      )}

    </div>
  );
}