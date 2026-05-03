"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Calendar, ChevronDown, DollarSign, ShoppingBag, Users, TrendingUp, PieChart, Award, Banknote, CreditCard, Smartphone, Clock, Search, Filter, X, ChevronLeft, ChevronRight, FileText, CheckCircle2, User } from "lucide-react";
import { toast } from "react-toastify";

interface MetodoData { nombre: string; usd: number; ves: number; }
interface ProductoData { nombre: string; cantidad: number; ingresos: number; }

interface OrdenHistorial {
  id: string;
  fecha: string;
  totalUSD: number;
  totalVES: number;
  estado: string;
  productos: string;
}

interface ClienteHistorial {
  id: string;
  nombre: string;
  cedula: string;
  totalUSD: number;
  totalVES: number;
  cantidadOrdenes: number;
  ordenes: OrdenHistorial[];
}

interface GeneralStats {
  totalUSD: number;
  totalVES: number;
  montoPendienteUSD: number;
  totalPedidosPagados: number;
  totalClientes: number;
  metodos: MetodoData[];
  topProductos: ProductoData[];
  historial: ClienteHistorial[];
}

const ITEMS_PER_PAGE = 30;

export default function EstadisticasGeneralesPage() {
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"hoy" | "semana" | "mes" | "ano" | "todo" | "custom">("todo");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [expandedClienteId, setExpandedClienteId] = useState<string | null>(null);

  const fetchData = useCallback(async (periodoToFetch: string, start?: string, end?: string) => {
    if (periodoToFetch === "custom" && (!start || !end)) return;
    setLoading(true);
    try {
      let url = `/api/estadisticas-generales?periodo=${periodoToFetch}`;
      if (periodoToFetch === "custom") url += `&startDate=${start}&endDate=${end}`;
      const res = await fetch(url);
      const data = await res.json();
      setStats(data);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Error cargando estadísticas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData("todo"); }, [fetchData]);

  const handleSelectPeriod = (nuevoPeriodo: any) => {
    setPeriodo(nuevoPeriodo);
    setIsFilterOpen(false);
    if (nuevoPeriodo !== "custom") fetchData(nuevoPeriodo);
  };

  const handleCustomSearch = () => {
    if (!startDate || !endDate) return toast.warning("Selecciona fechas");
    fetchData("custom", startDate, endDate);
  };

  const periodOptions = [
    { value: "hoy", label: "Solo Hoy" },
    { value: "semana", label: "Esta Semana" },
    { value: "mes", label: "Este Mes" },
    { value: "ano", label: "Este Año" },
    { value: "todo", label: "Histórico Completo" }
  ];

  const getIconForMethod = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes("efectivo")) return <Banknote className="w-5 h-5" />;
    if (n.includes("móvil") || n.includes("zelle")) return <Smartphone className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  const formatFecha = (iso: string) => new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

  const totalPages = Math.ceil((stats?.historial.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentHistorial = stats?.historial.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [];
  const maxProductoCantidad = stats?.topProductos.length ? Math.max(...stats.topProductos.map(p => p.cantidad)) : 1;

  if (loading && !stats) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#FDF8F1]">
        <Loader2 className="w-12 h-12 animate-spin text-[#B43E17]" />
        <p className="mt-4 font-black text-[#294C29] uppercase tracking-widest text-sm">Calculando Métricas...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDF8F1] p-4 sm:p-6 lg:p-10 overflow-y-auto pb-24">
      
      {/* HEADER Y FILTROS */}
      <div className="max-w-6xl mx-auto flex flex-col xl:flex-row justify-between items-center xl:items-end mb-8 sm:mb-10 gap-6 z-20 relative">
        <div className="flex flex-col items-center xl:items-start space-y-2 w-full xl:w-auto text-center xl:text-left">
          <h1 className="text-4xl sm:text-5xl md:text-5xl font-black text-[#294C29] uppercase tracking-tighter leading-none">
            Estadísticas <span className="text-[#B43E17]">Generales</span>
          </h1>
          <div className="h-1.5 w-16 bg-[#B43E17] rounded-full mx-auto xl:mx-0"></div>
          <p className="text-[#294C29]/60 font-bold text-sm mt-3 flex items-center justify-center xl:justify-start gap-2 pt-2">
            <TrendingUp className="w-4 h-4" /> Resumen Gerencial
          </p>
        </div>
        
        <div className="w-full xl:w-auto flex flex-col md:flex-row items-center gap-4">
          {periodo === "custom" && (
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2 rounded-[1.25rem] border border-[#294C29]/10 shadow-sm animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 w-full sm:w-auto bg-[#FDF8F1] sm:bg-transparent rounded-xl p-2 sm:p-0">
                {/* rounded-4xlAumentado de text-[11px] a text-xs sm:text-sm */}
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[#294C29] font-bold text-xs sm:text-sm uppercase tracking-widest focus:outline-none w-full" />
                <span className="font-black text-[#294C29]/20">-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[#294C29] font-bold text-xs sm:text-sm uppercase tracking-widest focus:outline-none w-full" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button onClick={handleCustomSearch} className="flex-1 sm:flex-none flex justify-center bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] p-3 rounded-xl transition-colors shadow-sm"><Search className="w-5 h-5" /></button>
                <button onClick={() => {setStartDate(""); setEndDate(""); handleSelectPeriod("todo");}} className="flex-1 sm:flex-none flex justify-center bg-[#FDF8F1] hover:bg-[#EADDCA] text-[#294C29] p-3 rounded-xl transition-colors shadow-sm"><X className="w-5 h-5" /></button>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64 relative">
              {/* rounded-4xlAumentado de text-[10px]/text-xs a text-xs sm:text-sm */}
              <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="w-full bg-white text-[#B43E17] font-black uppercase tracking-widest text-xs sm:text-sm rounded-[1.25rem] py-4 px-4 sm:px-5 flex items-center justify-between border border-[#294C29]/10 hover:border-[#B43E17]/50 transition-all shadow-sm focus:outline-none">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-[#B43E17] shrink-0" /> <span className="truncate">{periodOptions.find(opt => opt.value === periodo)?.label}</span></div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 shrink-0 ${isFilterOpen ? "rotate-180" : ""}`} />
              </button>
              {isFilterOpen && <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>}
              <div className={`absolute top-full right-0 mt-2 w-full bg-white border border-[#294C29]/10 rounded-2xl shadow-xl overflow-hidden z-20 transition-all duration-200 origin-top ${isFilterOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                {periodOptions.map((opt) => (
                  <button key={opt.value} onClick={() => handleSelectPeriod(opt.value)} className={`w-full text-left px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-colors ${periodo === opt.value ? "bg-[#B43E17]/10 text-[#B43E17]" : "text-[#294C29]/60 hover:bg-[#FDF8F1] hover:text-[#294C29]"}`}>{opt.label}</button>
                ))}
              </div>
            </div>
            <button onClick={() => handleSelectPeriod("custom")} className="bg-white text-[#294C29]/60 hover:text-[#B43E17] hover:border-[#B43E17]/30 font-black uppercase tracking-widest text-xs sm:text-sm rounded-[1.25rem] py-4 px-4 sm:px-5 flex items-center justify-center gap-2 border border-[#294C29]/10 transition-all shadow-sm focus:outline-none shrink-0"><Filter className="w-5 h-5" /><span className="hidden sm:inline">Fechas</span></button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6 z-10 relative">
        {/* FILA DE 4 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#294C29] p-5 sm:p-6 rounded-4xl shadow-lg relative overflow-hidden text-[#F6E4C9]">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-bl-full -mr-4 -mt-4"></div>
            {/* rounded-4xlTextos de las tarjetas de arriba más grandes */}
            <div className="flex justify-between items-start mb-4 relative z-10"><span className="text-xs font-black uppercase tracking-widest text-[#F6E4C9]/60">Ingresos Reales</span><DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#EADDCA]" /></div>
            <div className="relative z-10"><div className="flex items-baseline gap-1"><span className="text-xl font-bold">$</span><span className="text-4xl font-black tracking-tighter leading-none">{stats?.totalUSD.toFixed(2)}</span></div><span className="block text-sm font-bold text-[#EADDCA] mt-2">Bs. {stats?.totalVES.toFixed(2)}</span></div>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-4xl shadow-sm border border-[#294C29]/10">
            <div className="flex justify-between items-start mb-4"><span className="text-xs font-black uppercase tracking-widest text-[#294C29]/50">Órdenes Pagadas</span><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FDF8F1] flex items-center justify-center text-[#B43E17]"><ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" /></div></div>
            <div><span className="text-4xl font-black text-[#294C29] tracking-tighter leading-none">{stats?.totalPedidosPagados}</span><span className="block text-xs font-bold text-[#294C29]/40 mt-2 uppercase tracking-widest">Tickets procesados</span></div>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-4xl shadow-sm border border-red-500/20">
            <div className="flex justify-between items-start mb-4"><span className="text-xs font-black uppercase tracking-widest text-red-500/70">Por Cobrar</span><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500"><Clock className="w-4 h-4 sm:w-5 sm:h-5" /></div></div>
            <div><div className="flex items-baseline gap-1"><span className="text-xl font-bold text-red-500">$</span><span className="text-4xl font-black text-red-500 tracking-tighter leading-none">{stats?.montoPendienteUSD.toFixed(2)}</span></div><span className="block text-xs font-bold text-red-500/50 mt-2 uppercase tracking-widest">Órdenes pendientes</span></div>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-4xl shadow-sm border border-[#294C29]/10">
            <div className="flex justify-between items-start mb-4"><span className="text-xs font-black uppercase tracking-widest text-[#294C29]/50">Clientes Atendidos</span><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FDF8F1] flex items-center justify-center text-[#B43E17]"><Users className="w-4 h-4 sm:w-5 sm:h-5" /></div></div>
            <div><span className="text-4xl font-black text-[#294C29] tracking-tighter leading-none">{stats?.totalClientes}</span><span className="block text-xs font-bold text-[#294C29]/40 mt-2 uppercase tracking-widest">En el lapso</span></div>
          </div>
        </div>

        {/* MÉTODOS Y TOP PRODUCTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
          <div className="bg-white rounded-4xl p-5 sm:p-6 lg:p-8 border border-[#294C29]/10 shadow-sm">
            <h3 className="font-black text-[#294C29] uppercase tracking-tighter text-xl flex items-center gap-2 mb-6"><PieChart className="w-6 h-6 text-[#B43E17]" /> Desglose de Pagos</h3>
            {stats?.metodos.length === 0 ? <p className="text-sm font-bold text-[#294C29]/40 text-center py-10">Sin pagos.</p> : (
              <div className="space-y-3 sm:space-y-4">{stats?.metodos.map((metodo, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-[#FDF8F1] rounded-2xl border border-[#294C29]/5 hover:border-[#294C29]/20 transition-colors gap-2">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#294C29] shrink-0">
                      {getIconForMethod(metodo.nombre)}
                    </div>
                    <div className="min-w-0">
                      {/* rounded-4xlNombre de método y Bs más grandes */}
                      <span className="font-black text-[#294C29] uppercase tracking-widest text-xs sm:text-sm block mb-1 truncate">{metodo.nombre}</span>
                      <span className="font-bold text-[#B43E17] text-[11px] sm:text-xs">Bs. {metodo.ves.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {/* rounded-4xlDólares del método más grandes */}
                    <span className="font-black text-[#294C29] text-xl sm:text-2xl block leading-none">${metodo.usd.toFixed(2)}</span>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
          <div className="bg-[#B43E17] rounded-4xl p-5 sm:p-6 lg:p-8 text-[#F6E4C9] shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10"></div>
            <div className="flex justify-between items-start mb-6 relative z-10"><h3 className="font-black uppercase tracking-tighter text-xl flex items-center gap-2"><Award className="w-6 h-6 text-[#EADDCA]" /> Top 5 Productos</h3></div>
            {stats?.topProductos.length === 0 ? <p className="text-sm font-bold text-[#F6E4C9]/60 text-center py-10 relative z-10">Sin ventas.</p> : (
              <div className="space-y-5 relative z-10">{stats?.topProductos.map((prod, index) => {
                const widthPercentage = Math.max((prod.cantidad / maxProductoCantidad) * 100, 10);
                return (
                  <div key={index}><div className="flex justify-between items-end mb-2"><div><span className="text-[11px] font-black uppercase tracking-widest text-[#EADDCA] mr-2">#{index + 1}</span><span className="font-black text-xs sm:text-sm uppercase tracking-widest">{prod.nombre}</span></div><div className="text-right"><span className="font-black text-lg sm:text-xl leading-none block">${prod.ingresos.toFixed(2)}</span><span className="text-[10px] sm:text-[11px] font-bold text-[#EADDCA] uppercase tracking-widest">{prod.cantidad} uds</span></div></div><div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${widthPercentage}%` }}></div></div></div>
                );
              })}</div>
            )}
          </div>
        </div>

        {/* rounded-4xlLIBRO MAYOR DE CLIENTES */}
        {stats?.historial && stats.historial.length > 0 && (
          <div className="bg-white rounded-4xl border border-[#294C29]/10 shadow-sm mt-8 overflow-hidden transition-all">
            <button onClick={() => setIsLedgerOpen(!isLedgerOpen)} className="w-full flex flex-col md:flex-row justify-between items-start md:items-center p-5 sm:p-6 lg:p-8 bg-white hover:bg-[#FDF8F1] transition-colors focus:outline-none gap-4">
              <h3 className="font-black text-[#294C29] uppercase tracking-tighter text-xl sm:text-2xl flex items-center gap-2"><FileText className="w-6 h-6 text-[#B43E17]" /> Actividad por Cliente</h3>
              <div className="flex items-center justify-between w-full md:w-auto gap-4"><span className="text-xs sm:text-sm font-bold text-[#294C29]/50 uppercase tracking-widest bg-[#FDF8F1] px-4 py-2 rounded-lg border border-[#294C29]/10">{stats.historial.length} Clientes</span><div className={`w-10 h-10 rounded-full bg-[#FDF8F1] flex items-center justify-center text-[#B43E17] transition-transform duration-300 shrink-0 ${isLedgerOpen ? 'rotate-180' : ''}`}><ChevronDown className="w-6 h-6" /></div></div>
            </button>

            {isLedgerOpen && (
              <div className="p-4 sm:p-6 lg:p-8 pt-0 border-t border-[#294C29]/5 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-4 mt-4 sm:mt-6">
                  {currentHistorial.map((cliente) => {
                    const isExpanded = expandedClienteId === cliente.id;
                    return (
                      <div key={cliente.id} className="border border-[#294C29]/10 rounded-2xl overflow-hidden bg-white shadow-sm">
                        
                        <div 
                          onClick={() => setExpandedClienteId(isExpanded ? null : cliente.id)}
                          className={`p-4 sm:p-5 flex flex-col md:flex-row justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-[#294C29]/5' : 'hover:bg-[#FDF8F1]'}`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4 mb-3 md:mb-0">
                            <div className="w-12 h-12 rounded-xl bg-[#FDF8F1] flex items-center justify-center text-[#294C29] shrink-0"><User className="w-6 h-6" /></div>
                            <div className="min-w-0">
                              {/* rounded-4xlLetras del nombre más grandes y legibles */}
                              <h4 className="font-black text-[#294C29] uppercase tracking-tighter leading-none mb-1.5 truncate text-lg sm:text-xl">{cliente.nombre}</h4>
                              <span className="text-xs sm:text-sm font-bold text-[#294C29]/50 uppercase tracking-widest block truncate">CI: {cliente.cedula} | {cliente.cantidadOrdenes} órdenes</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between w-full md:w-auto gap-4 mt-1 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#294C29]/5">
                            <div className="text-left md:text-right">
                              {/* rounded-4xlDólares del cliente super claros */}
                              <span className="text-xl sm:text-2xl font-black text-[#294C29] block leading-none">${cliente.totalUSD.toFixed(2)}</span>
                              <span className="text-[11px] sm:text-xs font-bold text-[#B43E17] uppercase tracking-widest mt-1.5 block">Bs. {cliente.totalVES.toFixed(2)}</span>
                            </div>
                            <ChevronDown className={`w-6 h-6 text-[#B43E17] transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-3 sm:p-5 bg-[#FDF8F1]/50 border-t border-[#294C29]/5 space-y-3 sm:space-y-4 animate-in slide-in-from-top-2">
                            {cliente.ordenes.map((orden) => (
                              <div key={orden.id} className="bg-white p-4 sm:p-5 rounded-xl border border-[#294C29]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <span className="text-[11px] sm:text-xs font-black text-[#294C29]/60 uppercase tracking-widest">{formatFecha(orden.fecha)}</span>
                                    {orden.estado === "PAGADO" ? (
                                      <span className="text-[10px] font-black bg-[#294C29]/10 text-[#294C29] px-2 py-1 rounded uppercase">Pagado</span>
                                    ) : (
                                      <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded uppercase">Pendiente</span>
                                    )}
                                  </div>
                                  {/* rounded-4xlLetra de la descripción de la orden más grande */}
                                  <p className="text-xs sm:text-sm font-bold text-[#B43E17] uppercase tracking-tight leading-snug">{orden.productos}</p>
                                </div>
                                <div className="text-right mt-2 sm:mt-0 sm:shrink-0 flex justify-end">
                                  {/* rounded-4xlMonto individual de la orden legible */}
                                  <span className="font-black text-[#294C29] text-lg sm:text-xl leading-none">${orden.totalUSD.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6 sm:mt-8">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-3 sm:p-4 bg-white border border-[#294C29]/10 text-[#294C29] rounded-xl sm:rounded-2xl disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="bg-[#FDF8F1] border border-[#294C29]/10 px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-sm"><span className="text-xs sm:text-sm font-black text-[#294C29] uppercase tracking-widest">Página <span className="text-[#B43E17] mx-1">{currentPage}</span> de {totalPages}</span></div>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-3 sm:p-4 bg-white border border-[#294C29]/10 text-[#294C29] rounded-xl sm:rounded-2xl disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}