"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit3, Pizza, ChevronDown, Check } from "lucide-react";
import { toast } from "react-toastify";

interface Categoria {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  nombre: string;
  description?: string;
  categoriaId: string;
  precioBase: number;
  precioPequena?: number;
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ productos: Producto[], categorias: Categoria[] }>({ productos: [], categorias: [] });
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMenu();
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const result = await res.json();
      setData(result);
      if (result.categorias.length > 0) setActiveTab(result.categorias[0].id);
    } catch (err) {
      toast.error("Error de sincronización");
    } finally {
      setLoading(false);
    }
  };

  const activeCategoryName = data.categorias.find((c: any) => c.id === activeTab)?.nombre || "Seleccionar";

  return (
    <div className="w-full px-6 lg:px-10 py-6 md:py-10 animate-in fade-in duration-700">
      
      {/* HEADER: Ajustado con max-w-6xl y mx-auto para unir los elementos hacia el centro */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6 mb-10 text-center lg:text-left">
        <div className="flex flex-col items-center lg:items-start space-y-2">
          <h1 className="text-6xl md:text-5xl font-black text-[#294C29] uppercase tracking-tighter leading-none">
            Menú <span className="text-[#B43E17]">&</span> <br className="lg:hidden" /> Precios
          </h1>
          <div className="h-1.5 w-16 bg-[#B43E17] rounded-full"></div>
        </div>
        
        <button className="w-full lg:w-auto bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 border-b-4 border-[#6A1905]">
          <Plus className="w-6 h-6 stroke-3" />
          Nuevo Producto
        </button>
      </div>

      {/* FILTRO DE CATEGORÍAS */}
      <div className="mb-10" ref={selectRef}>
        {/* Mobile View: Custom Dropdown */}
        <div className="relative lg:hidden">
          <button
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="w-full bg-white text-[#294C29] font-black uppercase tracking-[0.2em] text-base py-6 px-8 rounded-3xl border-2 border-[#294C29]/10 flex justify-between items-center shadow-md active:bg-[#FDF8F1] transition-all"
          >
            {activeCategoryName}
            <ChevronDown className={`w-6 h-6 text-[#B43E17] transition-transform duration-300 ${isSelectOpen ? "rotate-180" : ""}`} />
          </button>

          {isSelectOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#294C29]/10 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
              {data.categorias.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveTab(cat.id);
                    setIsSelectOpen(false);
                  }}
                  className={`w-full px-8 py-5 text-left font-black uppercase tracking-widest text-sm flex justify-between items-center transition-colors ${
                    activeTab === cat.id ? "bg-[#294C29] text-[#F6E4C9]" : "text-[#294C29] hover:bg-[#FDF8F1]"
                  }`}
                >
                  {cat.nombre}
                  {activeTab === cat.id && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View: Centrado con justify-center */}
        <div className="hidden lg:flex justify-center gap-3 overflow-x-auto pt-2 pb-6 no-scrollbar">
          {data.categorias.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border-2 leading-relaxed ${
                activeTab === cat.id
                  ? "bg-[#294C29] text-[#F6E4C9] border-[#294C29] shadow-lg -translate-y-0.5"
                  : "bg-white text-[#294C29]/40 border-transparent hover:border-[#294C29]/10 hover:text-[#294C29]"
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* GRID: Cards Estilo iOS Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-[#EADDCA]/30 animate-pulse rounded-[2.5rem]"></div>
          ))
        ) : (
          data.productos
            .filter((p: any) => p.categoriaId === activeTab)
            .map((producto: any) => (
              <div 
                key={producto.id}
                className="bg-white border border-[#294C29]/10 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-[#B43E17]/30 transition-all duration-300 group shadow-sm hover:shadow-xl hover:-translate-y-1.5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#E7AF67]/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-[#B43E17]/10 transition-colors"></div>

                <div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="bg-[#294C29]/5 p-3 rounded-2xl text-[#294C29]">
                      <Pizza className="w-5 h-5" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button className="p-2 text-[#294C29]/40 hover:text-[#294C29] hover:bg-[#294C29]/5 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-2 text-[#294C29]/40 hover:text-[#9F280A] hover:bg-[#9F280A]/5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-[#294C29] uppercase leading-tight mb-3 tracking-tight relative z-10">
                    {producto.nombre}
                  </h3>
                  {producto.description && (
                    <p className="text-[#294C29]/50 text-[11px] font-bold leading-relaxed line-clamp-2 mb-6">
                      {producto.description}
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-[#294C29]/5 flex justify-between items-end relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#B43E17] uppercase tracking-widest mb-1">Precio</span>
                    <span className="text-3xl font-black text-[#294C29] tracking-tighter">${producto.precioBase.toFixed(2)}</span>
                  </div>
                  {producto.precioPequena && (
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-[#294C29]/30 uppercase tracking-widest mb-1">Pequeña</span>
                      <span className="text-lg font-bold text-[#294C29]/40 tracking-tighter">${producto.precioPequena.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}