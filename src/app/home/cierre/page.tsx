"use client";

import { useState } from "react";
import { Banknote, Smartphone, CreditCard, Loader2, AlertCircle, Calendar, Clock, CheckCircle2, Play, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

interface Orden {
  id: string;
  cliente: string;
  totalUSD: number;
  totalVES: number;
  hora: string;
  metodo: string;
}

interface CierreData {
  fecha: string;
  totales: { totalUSD: number; totalVES: number };
  conteo: { pagados: number; pendientes: number };
  desgloseMetodos: Record<string, { usd: number; ves: number }>;
  ordenesPagadas: Orden[];
  ordenesPendientes: Orden[];
}

// Genera un string "YYYY-MM-DDTHH:mm" en hora local para datetime-local
function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getDefaultDesde(): string {
  const hoy = new Date();
  // Si estamos en la madrugada (antes de las 5 AM), consideramos que el "inicio de jornada"
  // corresponde al día de ayer a las 5:00 AM.
  // Si son las 5 AM o más, la jornada inicia hoy a las 5:00 AM.
  if (hoy.getHours() < 5) {
    hoy.setDate(hoy.getDate() - 1);
  }
  hoy.setHours(5, 0, 0, 0);
  return toLocalDatetimeValue(hoy);
}

function getDefaultHasta(): string {
  return toLocalDatetimeValue(new Date());
}

export default function CierreDiarioPage() {
  const [data, setData] = useState<CierreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [rangoDesde, setRangoDesde] = useState(getDefaultDesde);
  const [rangoHasta, setRangoHasta] = useState(getDefaultHasta);

  const fetchCierre = async () => {
    if (!rangoDesde || !rangoHasta) {
      toast.error("Define el rango de inicio y fin de la jornada");
      return;
    }

    const desde = new Date(rangoDesde);
    const hasta = new Date(rangoHasta);

    if (desde >= hasta) {
      toast.error("La fecha de inicio debe ser anterior al fin de la jornada");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
      });
      const res = await fetch(`/api/cierre-diario?${params}`);
      if (!res.ok) throw new Error("Error al obtener los datos");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("No se pudo cargar el cierre diario");
    } finally {
      setLoading(false);
    }
  };

  const getIconForMethod = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes("efectivo")) return <Banknote className="w-8 h-8 text-[#294C29]" />;
    if (n.includes("móvil") || n.includes("zelle")) return <Smartphone className="w-8 h-8 text-[#B43E17]" />;
    return <CreditCard className="w-8 h-8 text-[#294C29]" />;
  };

  const formatHora = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatFechaRango = (iso: string) => {
    return new Date(iso).toLocaleString('es-VE', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDF8F1] p-6 lg:p-10 overflow-y-auto">

      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex flex-col items-center lg:items-start space-y-2 text-center lg:text-left mb-8">
          <h1 className="text-5xl md:text-5xl font-black text-[#294C29] uppercase tracking-tighter leading-none">
            Cierre <span className="text-[#B43E17]">Diario</span>
          </h1>
          <div className="h-1.5 w-16 bg-[#B43E17] rounded-full mx-auto lg:mx-0"></div>
          <p className="text-[#294C29]/60 font-bold text-sm mt-3 pt-2">
            Define el rango de tu jornada y genera el cierre cuando lo necesites.
          </p>
        </div>

        {/* SELECTOR DE RANGO */}
        <div className="bg-white border border-[#294C29]/10 rounded-[2rem] p-6 shadow-sm">
          <h2 className="text-xs font-black text-[#294C29]/50 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Rango de la Jornada
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* DESDE */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-[#294C29]/60 uppercase tracking-widest">
                Inicio de Jornada
              </label>
              <input
                id="cierre-desde"
                type="datetime-local"
                value={rangoDesde}
                onChange={(e) => setRangoDesde(e.target.value)}
                className="bg-[#FDF8F1] border border-[#294C29]/15 rounded-xl px-4 py-3 font-bold text-[#294C29] text-sm focus:outline-none focus:border-[#294C29]/40 transition-colors"
              />
            </div>

            {/* HASTA */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-[#294C29]/60 uppercase tracking-widest">
                Fin de Jornada
              </label>
              <input
                id="cierre-hasta"
                type="datetime-local"
                value={rangoHasta}
                onChange={(e) => setRangoHasta(e.target.value)}
                className="bg-[#FDF8F1] border border-[#294C29]/15 rounded-xl px-4 py-3 font-bold text-[#294C29] text-sm focus:outline-none focus:border-[#294C29]/40 transition-colors"
              />
            </div>
          </div>

          <button
            id="btn-generar-cierre"
            onClick={fetchCierre}
            disabled={loading}
            className="w-full bg-[#294C29] hover:bg-[#1e3620] disabled:opacity-60 disabled:cursor-not-allowed text-[#F6E4C9] py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Calculando...</>
            ) : (
              <><Play className="w-5 h-5" /> Generar Cierre <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>

      {/* ESTADO VACÍO INICIAL */}
      {!loading && !data && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-[#294C29]/10 rounded-[2rem] p-16 text-center shadow-sm">
            <Calendar className="w-14 h-14 text-[#294C29]/15 mx-auto mb-4" />
            <p className="font-black text-[#294C29]/30 uppercase tracking-widest text-sm">
              Configura el rango y presiona "Generar Cierre"
            </p>
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-[#B43E17]" />
          <p className="mt-4 font-black text-[#294C29] uppercase tracking-widest text-xs">Calculando Cierre de Caja...</p>
        </div>
      )}

      {/* RESULTADOS */}
      {!loading && data && (
        <div className="max-w-5xl mx-auto space-y-10">

          {/* RANGO ACTIVO */}
          <div className="bg-[#294C29]/5 border border-[#294C29]/10 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Clock className="w-4 h-4 text-[#294C29]/50 shrink-0" />
            <p className="text-[#294C29]/70 font-bold text-xs">
              Jornada: <span className="text-[#294C29]">{formatFechaRango(rangoDesde)}</span>
              {" → "}
              <span className="text-[#294C29]">{formatFechaRango(rangoHasta)}</span>
            </p>
          </div>

          {/* AVISO DE ÓRDENES PENDIENTES */}
          {data.conteo.pendientes > 0 && (
            <div className="bg-[#B43E17]/10 border border-[#B43E17]/30 rounded-4xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 text-[#B43E17] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-[#B43E17] uppercase tracking-widest text-sm">¡Atención! Órdenes Pendientes</h3>
                <p className="text-[#B43E17]/80 text-sm font-medium mt-1">
                  Tienes <strong>{data.conteo.pendientes} orden(es)</strong> en este rango que aún no han sido cobradas.
                </p>
              </div>
            </div>
          )}

          {/* TARJETAS DE TOTALES GLOBALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#294C29] rounded-[2.5rem] p-8 text-[#F6E4C9] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-full -mr-10 -mt-10"></div>
              <span className="text-xs font-black uppercase tracking-widest text-[#F6E4C9]/60">Total Bruto Recaudado (USD)</span>
              <div className="flex items-start gap-1 mt-2">
                <span className="text-3xl font-black mt-2">$</span>
                <span className="text-7xl font-black tracking-tighter leading-none">{data.totales.totalUSD.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white border border-[#294C29]/10 rounded-[2.5rem] p-8 text-[#294C29] shadow-sm relative overflow-hidden">
              <span className="text-xs font-black uppercase tracking-widest text-[#294C29]/50">Total Bruto Equivalente (VES)</span>
              <div className="flex items-start gap-1 mt-2">
                <span className="text-xl font-black mt-2 text-[#B43E17]">Bs.</span>
                <span className="text-5xl font-black tracking-tighter leading-none">{data.totales.totalVES.toFixed(2)}</span>
              </div>
              <div className="mt-6 pt-6 border-t border-[#294C29]/10 flex items-center justify-between">
                <span className="text-xs font-bold text-[#294C29]/50 uppercase tracking-widest">Órdenes Pagadas</span>
                <span className="text-xl font-black text-[#294C29] bg-[#FDF8F1] px-4 py-1 rounded-xl">{data.conteo.pagados}</span>
              </div>
            </div>
          </div>

          {/* DESGLOSE POR MÉTODO DE PAGO */}
          <div>
            <h2 className="text-lg font-black text-[#294C29] uppercase tracking-widest mb-4 pl-2">Cuadre por Método de Pago</h2>

            {Object.keys(data.desgloseMetodos).length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#294C29]/10">
                <p className="font-bold text-[#294C29]/40 uppercase tracking-widest">No hay pagos en este rango</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(data.desgloseMetodos).map(([metodo, montos]) => (
                  <div key={metodo} className="bg-white rounded-3xl p-6 border border-[#294C29]/10 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-[#FDF8F1] rounded-2xl flex items-center justify-center border border-[#294C29]/5">
                        {getIconForMethod(metodo)}
                      </div>
                      <h3 className="font-black text-[#294C29] uppercase tracking-tighter text-lg leading-tight">{metodo}</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-[#294C29]/40 uppercase tracking-widest">Monto USD</span>
                        <span className="font-black text-2xl text-[#294C29]">${montos.usd.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end pt-3 border-t border-[#294C29]/5">
                        <span className="text-[10px] font-black text-[#B43E17]/60 uppercase tracking-widest">Monto VES</span>
                        <span className="font-bold text-base text-[#294C29]/60">Bs. {montos.ves.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECAP DE ÓRDENES */}
          <div className="pt-6 border-t-2 border-dashed border-[#294C29]/10">
            <h2 className="text-2xl font-black text-[#294C29] uppercase tracking-tighter mb-6 pl-2">Recap de Órdenes</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* COLUMNA PENDIENTES */}
              <div className="space-y-4">
                <h3 className="font-black text-[#B43E17] uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5" /> Por Cobrar ({data.conteo.pendientes})
                </h3>
                {data.ordenesPendientes.length === 0 ? (
                  <div className="bg-[#FDF8F1] border border-[#B43E17]/10 rounded-3xl p-6 text-center">
                    <p className="text-[#B43E17]/40 font-bold text-xs uppercase tracking-widest">Todo cobrado al día</p>
                  </div>
                ) : (
                  data.ordenesPendientes.map((orden) => (
                    <div key={orden.id} className="bg-white border-l-4 border-[#B43E17] rounded-r-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-[#294C29] text-base">{orden.cliente}</span>
                        <span className="text-[10px] font-bold text-[#294C29]/40">{formatHora(orden.hora)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#294C29]/5">
                        <span className="bg-[#B43E17]/10 text-[#B43E17] px-2 py-1 rounded uppercase tracking-widest text-[9px] font-black">Pendiente</span>
                        <span className="font-black text-[#294C29] text-lg">${orden.totalUSD.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* COLUMNA PAGADAS */}
              <div className="space-y-4">
                <h3 className="font-black text-[#294C29] uppercase tracking-widest flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5" /> Completadas ({data.conteo.pagados})
                </h3>
                {data.ordenesPagadas.length === 0 ? (
                  <div className="bg-[#FDF8F1] border border-[#294C29]/10 rounded-3xl p-6 text-center">
                    <p className="text-[#294C29]/40 font-bold text-xs uppercase tracking-widest">Aún no hay ventas</p>
                  </div>
                ) : (
                  data.ordenesPagadas.map((orden) => (
                    <div key={orden.id} className="bg-white border-l-4 border-[#294C29] rounded-r-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-[#294C29] text-base">{orden.cliente}</span>
                        <span className="text-[10px] font-bold text-[#294C29]/40">{formatHora(orden.hora)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#294C29]/5">
                        <span className="text-[#294C29]/60 font-bold text-xs">{orden.metodo}</span>
                        <span className="font-black text-[#294C29] text-lg">${orden.totalUSD.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}