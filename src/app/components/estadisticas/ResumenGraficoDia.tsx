"use client";

import { PieChart, TrendingUp, Award } from "lucide-react";

interface Categoria { nombre: string; }
interface Producto { nombre: string; categoria: Categoria; }
interface Detalle { id: string; cantidad: number; subtotal: number; producto: Producto; }
interface Pago { metodo: { nombre: string }; montoUSD: number; montoVES: number | null; }
interface Pedido { totalUSD: number; estadoPago: string; detalles: Detalle[]; pagos: Pago[]; }

export default function ResumenGraficoDia({ pedidos }: { pedidos: Pedido[] }) {
  const pedidosPagados = pedidos.filter(p => p.estadoPago === "PAGADO");
  
  if (pedidosPagados.length === 0) return null;

  const totalGeneralUSD = pedidosPagados.reduce((acc, p) => acc + p.totalUSD, 0);
  const metodosData: Record<string, { usd: number; ves: number }> = {};
  
  pedidosPagados.forEach(pedido => {
    pedido.pagos.forEach(pago => {
      // Blindaje: Si no hay nombre de método, le ponemos "Otro"
      const nombre = pago.metodo?.nombre || "Otro";
      if (!metodosData[nombre]) metodosData[nombre] = { usd: 0, ves: 0 };
      metodosData[nombre].usd += pago.montoUSD;
      metodosData[nombre].ves += pago.montoVES || 0; 
    });
  });

  const colors = ["bg-[#294C29]", "bg-[#B43E17]", "bg-[#EADDCA]", "bg-[#FDF8F1]"];
  const metodosArray = Object.entries(metodosData)
    .sort((a, b) => b[1].usd - a[1].usd)
    .map(([nombre, montos], index) => ({
      nombre,
      usd: montos.usd,
      ves: montos.ves,
      porcentaje: totalGeneralUSD > 0 ? ((montos.usd / totalGeneralUSD) * 100).toFixed(0) : "0", // Blindaje: Evita dividir por cero
      color: colors[index % colors.length]
    }));

  const productosData: Record<string, { cantidad: number, ingresos: number }> = {};
  
  pedidosPagados.forEach(pedido => {
    pedido.detalles.forEach(detalle => {
      // Blindaje: Si el producto fue borrado, muestra "Desconocido"
      const nombre = detalle.producto?.nombre || "Desconocido";
      if (!productosData[nombre]) productosData[nombre] = { cantidad: 0, ingresos: 0 };
      productosData[nombre].cantidad += detalle.cantidad;
      productosData[nombre].ingresos += detalle.subtotal;
    });
  });

  const topProductos = Object.entries(productosData)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 3)
    .map(([nombre, data]) => ({ nombre, ...data }));

  const maxCantidad = topProductos.length > 0 ? Math.max(...topProductos.map(p => p.cantidad)) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
      
      {/* GRÁFICA 1: INGRESOS POR MÉTODO */}
      <div className="bg-white rounded-4xl text-center p-6 lg:p-8 border border-[#294C29]/10 shadow-sm flex flex-col justify-between">
        <h3 className="font-black text-[#294C29] uppercase tracking-tighter text-lg flex items-center justify-center sm:justify-start gap-2 mb-6">
          <PieChart className="w-5 h-5 text-[#B43E17]" /> Ingresos por Método
        </h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 lg:gap-10">
          <div className="relative w-32 h-32 rounded-full flex items-center justify-center shrink-0 shadow-inner" 
               style={{
                 background: `conic-gradient(${metodosArray.map((m, i, arr) => {
                   const prevTotal = arr.slice(0, i).reduce((acc, curr) => acc + Number(curr.porcentaje), 0);
                   return `${m.color.replace('bg-[', '').replace(']', '')} ${prevTotal}% ${prevTotal + Number(m.porcentaje)}%`;
                 }).join(', ')})`
               }}>
            <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
              <span className="text-[10px] font-bold text-[#294C29]/40 uppercase">Total</span>
              <span className="font-black text-[#294C29] text-sm">${totalGeneralUSD.toFixed(0)}</span>
            </div>
          </div>

          <div className="w-full flex flex-wrap gap-x-8 gap-y-6 justify-center sm:justify-start mt-2">
            {metodosArray.map((m) => (
              <div key={m.nombre} className="flex flex-col items-center min-w-25">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${m.color}`}></span>
                  <span className="font-bold text-[#294C29] text-xs uppercase leading-tight">{m.nombre}</span>
                </div>
                <div className="text-center mt-1">
                  <span className="font-black text-[#294C29] text-xl block leading-none">${m.usd.toFixed(2)}</span>
                  <span className="text-[14px] font-black text-[#B43E17] mt-1.5 block tracking-tight">Bs. {m.ves.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRÁFICA 2: TOP PRODUCTOS */}
      <div className="bg-[#294C29] rounded-4xl p-6 lg:p-8 text-[#FDF8F1] shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10"></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <h3 className="font-black uppercase tracking-tighter text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#EADDCA]" /> Productos Estrella
          </h3>
          <Award className="w-8 h-8 text-[#EADDCA]/20" />
        </div>

        <div className="space-y-5 relative z-10">
          {topProductos.map((prod, index) => {
            const widthPercentage = Math.max((prod.cantidad / maxCantidad) * 100, 15);
            return (
              <div key={prod.nombre}>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest mb-1.5">
                  <span className="truncate pr-4">#{index + 1} {prod.nombre}</span>
                  <span className="shrink-0 text-[#EADDCA]">{prod.cantidad} uds</span>
                </div>
                <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#B43E17] rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${widthPercentage}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 rounded-r-full"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}