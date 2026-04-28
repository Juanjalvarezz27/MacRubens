"use client";

import { useState } from 'react';
import useTasaBCV from '../hooks/useTasaBCV';
import { 
  Pizza, 
  CupSoda, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ClipboardList, 
  CheckCircle2,
  UtensilsCrossed,
  Flame,
  ArrowLeft // Agregamos la flecha aquí
} from 'lucide-react';

// ==========================================
// DATA DEL MENÚ
// ==========================================
const BASES = [
  { id: 'pequena', nombre: 'Pequeña', desc: '6 porciones', precio: 6 },
  { id: 'mediana', nombre: 'Mediana', desc: '8 porciones', precio: 8 },
  { id: 'familiar', nombre: 'Familiar', desc: '12 porciones', precio: 11 },
  { id: '4estaciones', nombre: '4 Estaciones', desc: '4 adicionales', precio: 19.99 },
  { id: 'fiesta', nombre: 'Fiesta', desc: 'Doble ingredientes', precio: 24.00 },
];

const ADICIONALES = [
  { id: 'jamon', nombre: 'Jamón', precio: 2.50 },
  { id: 'maiz', nombre: 'Maíz', precio: 2.50 },
  { id: 'champinones', nombre: 'Champiñones', precio: 2.50 },
  { id: 'tocineta', nombre: 'Tocineta', precio: 2.75 },
  { id: 'pepperoni', nombre: 'Pepperoni', precio: 2.75 },
  { id: 'salami', nombre: 'Salami', precio: 2.75 },
  { id: 'aceitunas', nombre: 'Aceitunas Negras', precio: 2.75 },
  { id: 'salchichon', nombre: 'Salchichón', precio: 3.00 },
  { id: 'chuleta', nombre: 'Chuleta Ahumada', precio: 3.00 },
  { id: 'anchoas', nombre: 'Anchoas', precio: 3.00 },
  { id: 'camarones', nombre: 'Camarones', precio: 3.50 },
];

const EXTRAS = [
  { id: 'caja', nombre: 'Caja para llevar', precio: 1.00 },
  { id: 'borde', nombre: 'Borde de queso', precio: 3.50 },
  { id: 'fullqueso', nombre: 'Full queso', precio: 3.50 },
];

const BEBIDAS = [
  { id: 'ref15', nombre: 'Refresco 1.5 lts', precio: 3.00 },
  { id: 'ref125', nombre: 'Refresco 1.25 lts', precio: 2.50 },
  { id: 'ref1', nombre: 'Refresco 1 lts', precio: 2.00 },
  { id: 'te', nombre: 'Té', precio: 1.50 },
  { id: 'vaso', nombre: 'Refresco Vaso', precio: 1.00 },
];

interface PedidoGuardado {
  id: string;
  fecha: Date;
  totalUSD: number;
  totalVES: number;
  resumen: string;
}

export default function PizzeriaRetroPOS() {
  const { tasa, loading } = useTasaBCV();
  
  const [base, setBase] = useState(BASES[1]);
  const [adicionales, setAdicionales] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>(['caja']);
  const [bebidas, setBebidas] = useState<Record<string, number>>({});
  
  const [vistaMobile, setVistaMobile] = useState<'menu' | 'carrito'>('menu');
  const [historial, setHistorial] = useState<PedidoGuardado[]>([]);
  const [tabActiva, setTabActiva] = useState<'nuevo' | 'historial'>('nuevo');

  const toggleAdicional = (id: string) => {
    setAdicionales(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleExtra = (id: string) => {
    setExtras(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const updateBebida = (id: string, delta: number) => {
    setBebidas(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const totalAdicionales = adicionales.reduce((acc, id) => acc + (ADICIONALES.find(a => a.id === id)?.precio || 0), 0);
  const totalExtras = extras.reduce((acc, id) => acc + (EXTRAS.find(e => e.id === id)?.precio || 0), 0);
  const totalBebidas = Object.entries(bebidas).reduce((acc, [id, qty]) => acc + (BEBIDAS.find(b => b.id === id)?.precio || 0) * qty, 0);
  
  const totalUSD = base.precio + totalAdicionales + totalExtras + totalBebidas;
  const totalVES = tasa ? totalUSD * tasa : 0;

  const confirmarPedido = () => {
    const nuevoPedido: PedidoGuardado = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      fecha: new Date(),
      totalUSD,
      totalVES,
      resumen: `1x Pizza ${base.nombre} ${adicionales.length > 0 ? `con ${adicionales.length} adic.` : ''} + ${Object.values(bebidas).reduce((a,b)=>a+b,0)} bebidas.`
    };

    setHistorial([nuevoPedido, ...historial]);
    
    setBase(BASES[1]);
    setAdicionales([]);
    setExtras(['caja']);
    setBebidas({});
    setTabActiva('historial');
    setVistaMobile('menu'); 
  };

  return (
    <div className="min-h-screen bg-[#F6E4C9] text-[#294C29] font-sans selection:bg-[#E7AF67] selection:text-[#294C29]">
      
      <header className="bg-[#294C29] text-[#F6E4C9] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#9F280A] p-2 rounded-full">
              <Pizza className="w-6 h-6 text-[#F6E4C9]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider uppercase leading-none" style={{ fontFamily: 'Impact, sans-serif' }}>
                MacRubens
              </h1>
              <p className="text-xs text-[#E7AF67] tracking-widest uppercase mt-1">Punto de Venta</p>
            </div>
          </div>
          <div className="text-right bg-[#1B361B] px-3 py-1.5 rounded-lg border border-[#E7AF67]/30">
            <p className="text-[10px] text-[#E7AF67] uppercase tracking-wider">Tasa BCV</p>
            <p className="text-sm font-bold text-white">
              {loading ? 'Cargando...' : `Bs. ${tasa?.toFixed(2)}`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* COLUMNA IZQUIERDA: MENÚ */}
        <div className={`flex-1 space-y-8 ${vistaMobile === 'carrito' ? 'hidden lg:block' : 'block pb-32 lg:pb-0'}`}>
          
          <section className="bg-white rounded-3xl p-5 shadow-sm border-2 border-[#294C29]/10">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-[#B43E17]" />
              <h2 className="text-xl font-bold uppercase tracking-wide text-[#9F280A]">1. La Base</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BASES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBase(item)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between min-h-[110px] ${
                    base.id === item.id 
                      ? 'border-[#9F280A] bg-[#9F280A] text-[#F6E4C9] shadow-md' 
                      : 'border-[#294C29]/20 bg-white hover:border-[#E7AF67]'
                  }`}
                >
                  <div>
                    <p className="font-bold">{item.nombre}</p>
                    <p className={`text-xs mt-1 ${base.id === item.id ? 'text-[#F6E4C9]/80' : 'text-[#294C29]/60'}`}>{item.desc}</p>
                  </div>
                  <p className="font-bold text-lg mt-2">${item.precio.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <section className="bg-white rounded-3xl p-5 shadow-sm border-2 border-[#294C29]/10">
              <div className="flex items-center gap-2 mb-4">
                <UtensilsCrossed className="w-5 h-5 text-[#B43E17]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[#9F280A]">2. Toppings</h2>
              </div>
              <div className="space-y-2">
                {ADICIONALES.map((item) => (
                  <div 
                    key={item.id} 
                    role="button"
                    onClick={() => toggleAdicional(item.id)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F6E4C9]/50 cursor-pointer transition-colors border border-transparent hover:border-[#E7AF67]/50 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${adicionales.includes(item.id) ? 'bg-[#294C29] border-[#294C29]' : 'border-[#294C29]/30 bg-white'}`}>
                        {adicionales.includes(item.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-medium">{item.nombre}</span>
                    </div>
                    <span className="font-bold text-[#B43E17]">+${item.precio.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-6">
              
              <section className="bg-white rounded-3xl p-5 shadow-sm border-2 border-[#294C29]/10">
                 <h2 className="text-xl font-bold uppercase tracking-wide text-[#9F280A] mb-4">3. Extras</h2>
                 <div className="space-y-2">
                  {EXTRAS.map((item) => (
                    <div 
                      key={item.id} 
                      role="button"
                      onClick={() => toggleExtra(item.id)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F6E4C9]/50 cursor-pointer transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${extras.includes(item.id) ? 'bg-[#9F280A] border-[#9F280A]' : 'border-[#294C29]/30 bg-white'}`}>
                          {extras.includes(item.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className={item.id === 'caja' ? 'font-bold text-[#B43E17]' : 'font-medium'}>{item.nombre}</span>
                      </div>
                      <span className="font-bold text-[#294C29]/60">+${item.precio.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#E7AF67]/30 rounded-3xl p-5 border-2 border-[#E7AF67]">
                <div className="flex items-center gap-2 mb-4">
                  <CupSoda className="w-5 h-5 text-[#9F280A]" />
                  <h2 className="text-xl font-bold uppercase tracking-wide text-[#9F280A]">4. Bebidas</h2>
                </div>
                <div className="space-y-3">
                  {BEBIDAS.map((item) => {
                    const qty = bebidas[item.id] || 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-white p-2 px-3 rounded-xl shadow-sm">
                        <div>
                          <p className="font-bold text-sm">{item.nombre}</p>
                          <p className="text-xs text-[#294C29]/70">${item.precio.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-3 bg-[#F6E4C9] rounded-lg p-1 border border-[#E7AF67]/50">
                          <button 
                            type="button"
                            onClick={() => updateBebida(item.id, -1)} 
                            disabled={qty === 0} 
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-[#9F280A] shadow-sm disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-4 text-center">{qty}</span>
                          <button 
                            type="button"
                            onClick={() => updateBebida(item.id, 1)} 
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-[#294C29] text-white shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* SIDEBAR TICKET */}
        <div className={`w-full lg:w-[400px] flex-shrink-0 ${vistaMobile === 'menu' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-[#294C29] rounded-3xl overflow-hidden shadow-xl lg:sticky lg:top-24 border-4 border-[#1B361B]">
            
            {/* NUEVO BOTÓN VOLVER (Visible solo en móvil) */}
            <div className="lg:hidden bg-[#1B361B] px-4 py-3 border-b border-[#294C29]">
              <button 
                onClick={() => setVistaMobile('menu')}
                className="flex items-center gap-2 text-[#E7AF67] font-bold uppercase tracking-wider text-sm active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
                Regresar al Menú
              </button>
            </div>

            <div className="flex bg-[#1B361B] p-1">
              <button 
                onClick={() => setTabActiva('nuevo')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-tl-2xl rounded-tr-md transition-colors flex items-center justify-center gap-2 ${tabActiva === 'nuevo' ? 'bg-[#294C29] text-[#E7AF67]' : 'text-white/50 hover:text-white'}`}
              >
                <ShoppingCart className="w-4 h-4" />
                Ticket
              </button>
              <button 
                onClick={() => setTabActiva('historial')}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-tr-2xl rounded-tl-md transition-colors flex items-center justify-center gap-2 ${tabActiva === 'historial' ? 'bg-[#294C29] text-[#E7AF67]' : 'text-white/50 hover:text-white'}`}
              >
                <ClipboardList className="w-4 h-4" />
                Guardados ({historial.length})
              </button>
            </div>

            {tabActiva === 'nuevo' && (
              <div className="p-6 text-white flex flex-col lg:h-[calc(100vh-200px)] lg:min-h-[500px]">
                <div className="flex-1 lg:overflow-y-auto pr-2 no-scrollbar">
                  <h3 className="text-xl font-bold text-[#E7AF67] border-b border-white/10 pb-3 mb-4">Resumen de Orden</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">Pizza {base.nombre}</p>
                        <p className="text-xs text-white/60">Base</p>
                      </div>
                      <p className="font-bold">${base.precio.toFixed(2)}</p>
                    </div>

                    {adicionales.length > 0 && (
                      <div className="border-t border-white/5 pt-3">
                        <p className="text-xs text-[#E7AF67] uppercase tracking-wider mb-2 font-bold">Toppings Adicionales</p>
                        {adicionales.map(id => {
                          const item = ADICIONALES.find(a => a.id === id);
                          return (
                            <div key={id} className="flex justify-between text-sm mb-1 text-white/80">
                              <span>• {item?.nombre}</span>
                              <span>${item?.precio.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(extras.length > 0 || Object.keys(bebidas).length > 0) && (
                      <div className="border-t border-white/5 pt-3">
                        <p className="text-xs text-[#E7AF67] uppercase tracking-wider mb-2 font-bold">Extras & Bebidas</p>
                        {extras.map(id => {
                          const item = EXTRAS.find(e => e.id === id);
                          return (
                            <div key={id} className="flex justify-between text-sm mb-1 text-white/80">
                              <span>• {item?.nombre}</span>
                              <span>${item?.precio.toFixed(2)}</span>
                            </div>
                          );
                        })}
                        {Object.entries(bebidas).map(([id, qty]) => {
                          const item = BEBIDAS.find(b => b.id === id);
                          return (
                            <div key={id} className="flex justify-between text-sm mb-1 text-white/80">
                              <span>{qty}x {item?.nombre}</span>
                              <span>${((item?.precio || 0) * qty).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20 mt-4">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-white/70">Total USD</p>
                    <p className="text-3xl font-black">${totalUSD.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-end mb-6">
                    <p className="text-[#E7AF67]">Total BCV</p>
                    <p className="text-xl font-bold text-[#E7AF67]">
                      Bs. {tasa ? totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                    </p>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={confirmarPedido}
                    className="w-full bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_4px_0_#6A1905] active:shadow-[0_0px_0_#6A1905] active:translate-y-[4px] transition-all flex items-center justify-center gap-2 text-lg"
                  >
                    Confirmar Pedido <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {tabActiva === 'historial' && (
              <div className="p-4 text-white lg:h-[calc(100vh-200px)] lg:min-h-[500px] lg:overflow-y-auto no-scrollbar">
                <h3 className="text-xl font-bold text-[#E7AF67] mb-4 px-2">Pedidos Recientes</h3>
                
                {historial.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-white/40">
                    <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
                    <p>No hay pedidos guardados aún.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historial.map((pedido) => (
                      <div key={pedido.id} className="bg-[#1B361B] p-4 rounded-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-[#E7AF67] text-[#294C29] text-[10px] font-black px-3 py-1 rounded-bl-lg">
                          #{pedido.id}
                        </div>
                        <p className="text-xs text-white/50 mb-2">{pedido.fecha.toLocaleTimeString()}</p>
                        <p className="font-medium text-sm mb-3 leading-snug">{pedido.resumen}</p>
                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                          <p className="font-bold text-lg">${pedido.totalUSD.toFixed(2)}</p>
                          <p className="text-sm text-[#E7AF67]">Bs. {pedido.totalVES.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* FLOATING ACTION BUTTON PARA MÓVIL (Solo visible en el menú) */}
      {vistaMobile === 'menu' && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-50">
          <button 
            type="button"
            onClick={() => setVistaMobile('carrito')}
            className="w-full bg-[#B43E17] text-[#F6E4C9] font-bold py-4 rounded-2xl shadow-2xl border-2 border-[#9F280A] flex justify-between items-center px-6"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Ver Orden
            </span>
            <span className="bg-[#F6E4C9] text-[#9F280A] px-3 py-1 rounded-lg text-sm">
              ${totalUSD.toFixed(2)}
            </span>
          </button>
        </div>
      )}

    </div>
  );
}