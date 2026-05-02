"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Pizza, Coffee, Tag, X, Check, ChevronDown, Truck } from "lucide-react";
import { toast } from "react-toastify";
import DeliveryModal from "./DeliveryModal"; 

export interface Categoria { id: string; nombre: string; }
export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  precioPequena?: number;
  categoriaId: string;
  categoria?: Categoria;
}

export interface SubItem {
  producto: Producto;
  cantidad: number;
  precio: number;
}

export interface CartItem {
  uniqueId: string;
  producto: Producto;
  cantidad: number;
  esPequena: boolean;
  precioUnitario: number;
  subItems: SubItem[];
  subtotal: number;
}

interface MenuSetupProps {
  onAddToCart: (producto: Producto, esPequena: boolean, subItems: SubItem[], editId?: string) => void;
  itemToEdit?: CartItem | null;
  onCancelEdit?: () => void;
}

const CustomSelect = ({ value, options, onChange, placeholder = "Seleccionar..." }: { value: string, options: {value: string, label: string}[], onChange: (val: string) => void, placeholder?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white text-[#294C29] font-black text-sm rounded-2xl py-4 pl-4 pr-12 border-2 ${isOpen ? 'border-[#B43E17]' : 'border-[#294C29]/10'} shadow-sm cursor-pointer transition-colors hover:border-[#294C29]/30 flex justify-between items-center`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`absolute right-4 w-5 h-5 text-[#294C29]/50 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#B43E17]' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-white border border-[#294C29]/10 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map(opt => (
              <div 
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${value === opt.value ? 'bg-[#B43E17]/10 text-[#B43E17]' : 'text-[#294C29] hover:bg-[#FDF8F1]'}`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function MenuSetup({ onAddToCart, itemToEdit, onCancelEdit }: MenuSetupProps) {
  const [menu, setMenu] = useState<{ productos: Producto[], categorias: Categoria[] }>({ productos: [], categorias: [] });
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [pizzaBase, setPizzaBase] = useState<Producto | null>(null);
  const [esPequena, setEsPequena] = useState(false);
  const [subItems, setSubItems] = useState<SubItem[]>([]);

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryProduct, setDeliveryProduct] = useState<Producto | null>(null);

  // --- CORRECCIÓN: BLOQUEO DE SCROLL DEL BODY ---
  useEffect(() => {
    if (builderOpen || deliveryModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [builderOpen, deliveryModalOpen]);

  useEffect(() => {
    fetchMenu();
  }, []);

  // --- CORRECCIÓN: RESET DE ESTADOS AL EDITAR ---
  useEffect(() => {
    if (itemToEdit) {
      setPizzaBase(itemToEdit.producto);
      setEsPequena(itemToEdit.esPequena);
      setSubItems(itemToEdit.subItems);
      setBuilderOpen(true);
    }
  }, [itemToEdit]);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      const ordenCategorias = ["base", "especial", "topping", "extra", "bebida", "delivery"];
      const categoriasOrdenadas = data.categorias.sort((a: Categoria, b: Categoria) => {
        return ordenCategorias.indexOf(a.nombre.toLowerCase()) - ordenCategorias.indexOf(b.nombre.toLowerCase());
      });
      setMenu({ productos: data.productos, categorias: categoriasOrdenadas });
      const primeraVisible = categoriasOrdenadas.find((c: Categoria) => !["topping", "extra"].includes(c.nombre.toLowerCase()));
      if (primeraVisible) setActiveCategory(primeraVisible.id);
    } catch (error) {
      toast.error("Error cargando el menú");
    } finally {
      setLoading(false);
    }
  };

  const categoriasPrincipales = menu.categorias.filter(c => !["topping", "extra"].includes(c.nombre.toLowerCase()));
  const toppingsDisponibles = menu.productos.filter(p => p.categoria?.nombre.toLowerCase() === "topping").sort((a, b) => a.precioBase - b.precioBase);
  const extrasDisponibles = menu.productos.filter(p => p.categoria?.nombre.toLowerCase() === "extra").sort((a, b) => a.precioBase - b.precioBase);
  const basesDisponibles = menu.productos.filter(p => ["base", "especial"].includes(p.categoria?.nombre.toLowerCase() || ""));

  const handleSelectPizza = (producto: Producto) => {
    setPizzaBase(producto);
    setEsPequena(false);
    setSubItems([]);
    setBuilderOpen(true);
  };

  const handleDeliveryClick = (producto: Producto) => {
    setDeliveryProduct(producto);
    setDeliveryModalOpen(true);
  };

  const confirmarDelivery = (precio: number) => {
    if (deliveryProduct) {
      const productoPersonalizado = { ...deliveryProduct, precioBase: precio };
      onAddToCart(productoPersonalizado, false, []);
    }
    setDeliveryModalOpen(false);
    setDeliveryProduct(null);
  };

  const handleUpdateSubItem = (producto: Producto, delta: number) => {
    setSubItems(prev => {
      const existe = prev.find(item => item.producto.id === producto.id);
      const precioUnitario = esPequena && producto.precioPequena ? producto.precioPequena : producto.precioBase;
      if (existe) {
        const nuevaCantidad = existe.cantidad + delta;
        if (nuevaCantidad <= 0) return prev.filter(item => item.producto.id !== producto.id);
        return prev.map(item => item.producto.id === producto.id ? { ...item, cantidad: nuevaCantidad, precio: precioUnitario } : item);
      } else if (delta > 0) {
        return [...prev, { producto, cantidad: 1, precio: precioUnitario }];
      }
      return prev;
    });
  };

  const cerrarModal = () => {
    setBuilderOpen(false);
    setPizzaBase(null);
    setSubItems([]); // Reset local
    if (onCancelEdit) onCancelEdit(); // Limpia el estado en el padre para permitir re-editar
  };

  const confirmarPizza = () => {
    if (!pizzaBase) return;
    onAddToCart(pizzaBase, esPequena, subItems, itemToEdit?.uniqueId);
    cerrarModal();
  };

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
      
      {/* TABS CATEGORÍAS - MOBILE */}
      <div className="md:hidden mb-4 px-1 relative z-30">
        {!loading && categoriasPrincipales.length > 0 && (
          <CustomSelect 
            value={activeCategory}
            options={categoriasPrincipales.map(cat => ({ value: cat.id, label: cat.nombre }))}
            onChange={(val) => setActiveCategory(val)}
          />
        )}
      </div>

      {/* TABS CATEGORÍAS - DESKTOP */}
      <div className="hidden md:flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2 px-1 relative z-10">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="w-28 h-12 bg-[#EADDCA]/30 animate-pulse rounded-2xl"></div>)
        ) : (
          categoriasPrincipales.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border-2 flex items-center gap-2 ${
                activeCategory === cat.id
                  ? "bg-[#294C29] text-[#F6E4C9] border-[#294C29] shadow-md scale-105"
                  : "bg-white text-[#294C29]/50 border-transparent hover:border-[#294C29]/10"
              }`}
            >
              {cat.nombre.toLowerCase() === "base" || cat.nombre.toLowerCase() === "especial" ? <Pizza className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
              {cat.nombre}
            </button>
          ))
        )}
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 relative z-0">
        {menu.productos.filter(p => p.categoriaId === activeCategory).map(producto => {
          const esPizza = ["base", "especial"].includes(producto.categoria?.nombre.toLowerCase() || "");
          const esDelivery = producto.categoria?.nombre.toLowerCase() === "delivery";

          return (
            <div
              key={producto.id}
              onClick={() => {
                if (esPizza) handleSelectPizza(producto);
                else if (esDelivery) handleDeliveryClick(producto);
                else onAddToCart(producto, false, []);
              }}
              className="bg-white rounded-4xl p-6 shadow-sm border border-[#294C29]/10 hover:border-[#B43E17]/40 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-40 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#294C29]/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-[#B43E17]/10 transition-colors"></div>
              <div>
                <h3 className="text-base font-black text-[#294C29] uppercase leading-tight mb-2 pr-4">{producto.nombre}</h3>
                {producto.descripcion && <p className="text-xs text-[#294C29]/50 font-bold line-clamp-2 pr-4">{producto.descripcion}</p>}
              </div>
              <div className="mt-4 flex justify-between items-end relative z-10">
                <span className="text-xl font-black text-[#294C29] tracking-tighter">
                  {esDelivery ? "Precio" : `$${producto.precioBase.toFixed(2)}`}
                </span>
                <div className="w-10 h-10 bg-[#FDF8F1] group-hover:bg-[#B43E17] text-[#294C29] group-hover:text-[#F6E4C9] rounded-2xl flex items-center justify-center transition-colors shadow-sm">
                  {esDelivery ? <Truck className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DeliveryModal 
        isOpen={deliveryModalOpen} 
        onClose={() => setDeliveryModalOpen(false)} 
        onConfirm={confirmarDelivery} 
      />

      {/* MODAL CONSTRUCTOR DE PIZZA */}
      {builderOpen && pizzaBase && (
        <div className="fixed inset-0 z-60 flex justify-end bg-[#1B361B]/80 animate-in fade-in duration-200">
          <div className="w-full sm:w-112.5 bg-[#FDF8F1] h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">

            <div className="p-6 bg-white border-b border-[#294C29]/10 flex justify-between items-center relative z-20">
              <h2 className="text-xl font-black text-[#294C29] uppercase tracking-tighter">{itemToEdit ? "Editar Pizza" : "Armar Pizza"}</h2>
              <button onClick={cerrarModal} className="p-2 bg-[#FDF8F1] hover:bg-[#EADDCA] text-[#294C29] rounded-full"><X className="w-5 h-5" /></button>
            </div>

            {/* --- CORRECCIÓN: OVERSCROLL-CONTAIN PARA EL TICKET/BUILDER --- */}
            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-4 space-y-6 relative z-0">

              <div className="space-y-2 relative z-30">
                <label className="text-[10px] font-black text-[#294C29]/60 uppercase tracking-widest">Base Seleccionada</label>
                <CustomSelect 
                  value={pizzaBase.id}
                  options={basesDisponibles.map(b => ({ value: b.id, label: `${b.nombre} ($${b.precioBase.toFixed(2)})` }))}
                  onChange={(val) => {
                    const nuevaBase = basesDisponibles.find(p => p.id === val);
                    if (nuevaBase) setPizzaBase(nuevaBase);
                  }}
                />
              </div>

              {pizzaBase.precioPequena && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#294C29]/60 uppercase tracking-widest">Tamaño de la Pizza</label>
                  <div className="flex gap-3">
                    <button onClick={() => { setEsPequena(false); setSubItems([]); }} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2 transition-all ${!esPequena ? "bg-[#294C29] text-[#F6E4C9] border-[#294C29]" : "bg-white text-[#294C29] border-[#294C29]/10"}`}>
                      Normal (${pizzaBase.precioBase})
                    </button>
                    <button onClick={() => { setEsPequena(true); setSubItems([]); }} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2 transition-all ${esPequena ? "bg-[#B43E17] text-[#F6E4C9] border-[#B43E17]" : "bg-white text-[#294C29] border-[#294C29]/10"}`}>
                      Pequeña (${pizzaBase.precioPequena})
                    </button>
                  </div>
                </div>
              )}

              {/* --- SECCIÓN ADICIONALES Y EXTRAS SEPARADOS --- */}
              
              {/* 1. SECCIÓN ADICIONALES (Toppings) */}
              {toppingsDisponibles.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#294C29]/60 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Adicionales (Opcional)
                  </label>
                  <div className="space-y-2">
                    {toppingsDisponibles.map(item => {
                      const precioActual = esPequena && item.precioPequena ? item.precioPequena : item.precioBase;
                      const subItemSeleccionado = subItems.find(s => s.producto.id === item.id);
                      const cantidad = subItemSeleccionado?.cantidad || 0;
                      return (
                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${cantidad > 0 ? "bg-white border-[#B43E17]/30 shadow-sm" : "bg-[#FDF8F1] border-[#294C29]/10"}`}>
                          <div>
                            <p className="font-bold text-[#294C29] text-sm">{item.nombre}</p>
                            <p className="text-[11px] font-black text-[#B43E17] uppercase">+${precioActual.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-[#294C29]/5 shadow-sm">
                            <button onClick={() => handleUpdateSubItem(item, -1)} className="w-8 h-8 bg-[#FDF8F1] text-[#294C29] rounded-lg flex items-center justify-center hover:bg-[#B43E17] hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="font-black text-base w-5 text-center">{cantidad}</span>
                            <button onClick={() => handleUpdateSubItem(item, 1)} className="w-8 h-8 bg-[#FDF8F1] text-[#294C29] rounded-lg flex items-center justify-center hover:bg-[#294C29] hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. SECCIÓN EXTRAS */}
              {extrasDisponibles.length > 0 && (
                <div className="space-y-4 pt-2">
                  <label className="text-[10px] font-black text-[#294C29]/60 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Extras (Opcional)
                  </label>
                  <div className="space-y-2">
                    {extrasDisponibles.map(item => {
                      const precioActual = esPequena && item.precioPequena ? item.precioPequena : item.precioBase;
                      const subItemSeleccionado = subItems.find(s => s.producto.id === item.id);
                      const cantidad = subItemSeleccionado?.cantidad || 0;
                      return (
                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${cantidad > 0 ? "bg-white border-[#B43E17]/30 shadow-sm" : "bg-[#FDF8F1] border-[#294C29]/10"}`}>
                          <div>
                            <p className="font-bold text-[#294C29] text-sm">{item.nombre}</p>
                            <p className="text-[11px] font-black text-[#B43E17] uppercase">+${precioActual.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-[#294C29]/5 shadow-sm">
                            <button onClick={() => handleUpdateSubItem(item, -1)} className="w-8 h-8 bg-[#FDF8F1] text-[#294C29] rounded-lg flex items-center justify-center hover:bg-[#B43E17] hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="font-black text-base w-5 text-center">{cantidad}</span>
                            <button onClick={() => handleUpdateSubItem(item, 1)} className="w-8 h-8 bg-[#FDF8F1] text-[#294C29] rounded-lg flex items-center justify-center hover:bg-[#294C29] hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* --- FIN DE SECCIÓN ADICIONALES Y EXTRAS SEPARADOS --- */}

            </div>

            <div className="p-4 bg-white border-t border-[#294C29]/10 relative z-10">
              <button
                onClick={confirmarPizza}
                className="w-full bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-md flex justify-center items-center gap-2"
              >
                <Check className="w-5 h-5" /> {itemToEdit ? "Guardar Cambios" : "Agregar al Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}