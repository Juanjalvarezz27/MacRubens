"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Pizza, AlignLeft, DollarSign, Tag, ChevronDown, Check } from "lucide-react";
import { toast } from "react-toastify";

interface Categoria {
  id: string;
  nombre: string;
}

interface ProductoSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: Categoria[];
  defaultCategoriaId: string;
  productoAEditar?: any | null; // Nueva prop para la edición
  onSuccess: (producto: any, isEdit: boolean) => void;
}

export default function ProductoSlideOver({
  isOpen,
  onClose,
  categorias = [],
  defaultCategoriaId,
  productoAEditar,
  onSuccess,
}: ProductoSlideOverProps) {
  const [loading, setLoading] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precioBase: "",
    precioPequena: "",
    categoriaId: "",
  });

  // Efecto para cerrar el select al clickear afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Efecto para inicializar el formulario (Crear vs Editar)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (productoAEditar) {
        setFormData({
          nombre: productoAEditar.nombre,
          descripcion: productoAEditar.descripcion || "",
          precioBase: productoAEditar.precioBase.toString(),
          precioPequena: productoAEditar.precioPequena ? productoAEditar.precioPequena.toString() : "",
          categoriaId: productoAEditar.categoriaId,
        });
      } else {
        setFormData({
          nombre: "",
          descripcion: "",
          precioBase: "",
          precioPequena: "",
          categoriaId: defaultCategoriaId,
        });
      }
    } else {
      document.body.style.overflow = "unset";
      setIsSelectOpen(false);
    }
  }, [isOpen, defaultCategoriaId, productoAEditar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const categoriaSeleccionada = categorias?.find(c => c.id === formData.categoriaId);
  const esTopping = categoriaSeleccionada?.nombre.toLowerCase() === "topping";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend = {
      ...formData,
      precioPequena: esTopping ? formData.precioPequena : null,
    };

    try {
      const url = productoAEditar ? `/api/menu/${productoAEditar.id}` : "/api/menu";
      const method = productoAEditar ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar el producto");

      toast.success(productoAEditar ? "Producto actualizado" : "Producto creado con éxito");
      onSuccess(data, !!productoAEditar); 
      onClose(); 
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-[#1B361B]/40 z-40 transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-112.5 bg-[#FDF8F1] z-50 shadow-2xl border-l border-[#294C29]/10 transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="px-8 py-6 border-b border-[#294C29]/10 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-[#B43E17]/10 p-2.5 rounded-xl text-[#B43E17]">
              <Pizza className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#294C29] uppercase tracking-tighter">
              {productoAEditar ? "Editar Producto" : "Nuevo Producto"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-[#EADDCA]/50 hover:bg-[#EADDCA] text-[#294C29] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2" ref={selectRef}>
              <label className="text-[11px] font-black text-[#294C29]/60 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3 h-3" /> Categoría
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  className={`w-full bg-white text-[#294C29] font-bold rounded-2xl p-4 border-2 flex justify-between items-center shadow-sm transition-all focus:outline-none ${isSelectOpen ? "border-[#B43E17]" : "border-[#294C29]/10 hover:border-[#294C29]/30"}`}
                >
                  {categoriaSeleccionada?.nombre || "Selecciona una categoría"}
                  <ChevronDown className={`w-5 h-5 text-[#B43E17] transition-transform duration-300 ${isSelectOpen ? "rotate-180" : ""}`} />
                </button>

                {isSelectOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#294C29]/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {categorias.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, categoriaId: cat.id });
                            setIsSelectOpen(false);
                          }}
                          className={`w-full px-5 py-4 text-left font-bold text-sm flex justify-between items-center transition-colors ${formData.categoriaId === cat.id ? "bg-[#294C29] text-[#F6E4C9]" : "text-[#294C29] hover:bg-[#FDF8F1]"}`}
                        >
                          {cat.nombre}
                          {formData.categoriaId === cat.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input type="hidden" name="categoriaId" value={formData.categoriaId} required />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#294C29]/60 uppercase tracking-widest flex items-center gap-2">
                <AlignLeft className="w-3 h-3" /> Nombre del Producto
              </label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej. Pizza Margarita" className="w-full bg-white text-[#294C29] font-bold rounded-2xl p-4 border-2 border-[#294C29]/10 focus:outline-none focus:border-[#B43E17] shadow-sm transition-all placeholder:text-[#294C29]/30" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#294C29]/60 uppercase tracking-widest flex items-center gap-2">
                <AlignLeft className="w-3 h-3" /> Descripción (Opcional)
              </label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Ingredientes o detalles..." rows={3} className="w-full bg-white text-[#294C29] text-sm font-medium rounded-2xl p-4 border-2 border-[#294C29]/10 focus:outline-none focus:border-[#B43E17] shadow-sm transition-all placeholder:text-[#294C29]/30 resize-none" />
            </div>

            <div className={`grid ${esTopping ? "grid-cols-2" : "grid-cols-1"} gap-4 transition-all duration-300`}>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#294C29]/60 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Precio Base
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#294C29]/40">$</span>
                  <input type="number" name="precioBase" value={formData.precioBase} onChange={handleChange} required step="0.01" min="0" placeholder="0.00" className="w-full bg-white text-[#294C29] font-black rounded-2xl py-4 pl-8 pr-4 border-2 border-[#294C29]/10 focus:outline-none focus:border-[#B43E17] shadow-sm transition-all" />
                </div>
              </div>

              {esTopping && (
                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                  <label className="text-[11px] font-black text-[#B43E17] uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> P. Pequeña
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#B43E17]/40">$</span>
                    <input type="number" name="precioPequena" value={formData.precioPequena} onChange={handleChange} required={esTopping} step="0.01" min="0" placeholder="0.00" className="w-full bg-[#FDF8F1] text-[#B43E17] font-black rounded-2xl py-4 pl-8 pr-4 border-2 border-[#B43E17]/30 focus:outline-none focus:border-[#B43E17] shadow-sm transition-all" />
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>

        <div className="p-8 bg-white border-t border-[#294C29]/10">
          <button type="submit" form="product-form" disabled={loading} className="w-full bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_8px_0_#6A1905] active:shadow-[0_0px_0_#6A1905] active:translate-y-2 flex items-center justify-center gap-3 disabled:opacity-70">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : (productoAEditar ? "Guardar Cambios" : "Guardar Producto")}
          </button>
        </div>
      </div>
    </>
  );
}