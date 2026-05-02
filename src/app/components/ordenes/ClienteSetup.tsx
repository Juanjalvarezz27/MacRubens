"use client";

import { useState, useEffect } from "react";
import { User, Search, Phone, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export interface DatosCliente {
  id?: string;
  cedula: string;
  nombre: string;
  telefono: string;
}

interface ClienteSetupProps {
  onClientConfirmed: (cliente: DatosCliente) => void;
  clientePrevio?: DatosCliente | null; // Para pre-llenar si nos devolvemos al paso 1
}

export default function ClienteSetup({ onClientConfirmed, clientePrevio }: ClienteSetupProps) {
  const [cedula, setCedula] = useState(clientePrevio?.cedula || "");
  const [nombre, setNombre] = useState(clientePrevio?.nombre || "");
  const [telefono, setTelefono] = useState(clientePrevio?.telefono || "");
  
  const [isSearching, setIsSearching] = useState(false);
  const [isFound, setIsFound] = useState<boolean | null>(clientePrevio ? true : null);
  const [clienteId, setClienteId] = useState<string | undefined>(clientePrevio?.id);

  const buscarCliente = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cedula.trim().length < 5) return toast.info("Ingresa una cédula válida");

    setIsSearching(true);
    try {
      const res = await fetch(`/api/clientes/${cedula.trim()}`);
      
      if (res.status === 200) {
        const data = await res.json();
        setNombre(data.nombre);
        setTelefono(data.telefono || "");
        setClienteId(data.id);
        setIsFound(true);
        toast.success(`¡Cliente encontrado: ${data.nombre}!`);
      } else if (res.status === 404) {
        setNombre("");
        setTelefono("");
        setClienteId(undefined);
        setIsFound(false);
        toast.info("Cliente nuevo. Ingresa sus datos.");
      } else {
        throw new Error("Error de red");
      }
    } catch (error) {
      toast.error("Error al buscar cliente");
    } finally {
      setIsSearching(false);
    }
  };

  const handleContinuar = () => {
    if (!cedula.trim() || !nombre.trim()) {
      return toast.error("Cédula y Nombre son obligatorios");
    }
    onClientConfirmed({ id: clienteId, cedula: cedula.trim(), nombre: nombre.trim(), telefono: telefono.trim() });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-4xl p-8 lg:p-10 shadow-sm border border-[#294C29]/10 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#294C29]/5 rounded-full flex items-center justify-center text-[#294C29] mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-black text-[#294C29] uppercase tracking-tighter">Buscar Cliente</h2>
        <p className="text-[#294C29]/60 font-medium mt-1 text-sm">Escanea o ingresa la cédula para comenzar.</p>
      </div>

      <div className="space-y-6">
        
        {/* Buscador de Cédula (Fuente corregida) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#294C29]/70 uppercase tracking-[0.15em] pl-1">
            Cédula de Identidad
          </label>
          <div className="relative group">
            <input
              type="text"
              value={cedula}
              onChange={(e) => {
                // Remueve todo lo que NO sea número
                const valorLimpiado = e.target.value.replace(/\D/g, "");
                setCedula(valorLimpiado);
                if (isFound !== null) setIsFound(null); // Resetea si cambia el texto
              }}
              onKeyDown={(e) => e.key === "Enter" && buscarCliente()}
              placeholder="Ej. 24123456"
              className="w-full bg-[#FDF8F1] text-[#294C29] font-semibold text-lg lg:text-xl rounded-2xl py-4 pl-5 pr-16 focus:outline-none focus:ring-2 focus:ring-[#B43E17]/20 border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all placeholder:text-[#294C29]/30 placeholder:font-normal"
            />
            <button
              onClick={buscarCliente}
              disabled={isSearching || cedula.length < 5}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#294C29] hover:bg-[#1B361B] text-[#F6E4C9] rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Campos Nombre y Teléfono (Diseño 2 columnas en Desktop) */}
        {isFound !== null && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 fade-in duration-300 pt-4 border-t border-[#294C29]/10">
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-[#294C29]/70 uppercase tracking-[0.15em] pl-1">
                Nombre y Apellido
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  // Remueve todos los números
                  const valorLimpiado = e.target.value.replace(/\d/g, "");
                  setNombre(valorLimpiado);
                }}
                disabled={isFound}
                placeholder="Nombre del cliente"
                className="w-full bg-white text-[#294C29] font-medium text-lg rounded-2xl py-4 px-5 focus:outline-none border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all disabled:bg-[#FDF8F1] disabled:text-[#294C29]/60 disabled:border-transparent"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-[#294C29]/70 uppercase tracking-[0.15em] pl-1">
                Teléfono <span className="text-[10px] text-[#294C29]/40 normal-case">(Opcional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#294C29]/30" />
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => {
                    // Remueve todas las letras (permite números, guiones o símbolos como + para códigos de área)
                    const valorLimpiado = e.target.value.replace(/[a-zA-Z]/g, "");
                    setTelefono(valorLimpiado);
                  }}
                  disabled={isFound}
                  placeholder="0414-1234567"
                  className="w-full bg-white text-[#294C29] font-medium text-lg rounded-2xl py-4 pl-12 pr-5 focus:outline-none border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all disabled:bg-[#FDF8F1] disabled:text-[#294C29]/60 disabled:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleContinuar}
              className="md:col-span-2 mt-4 bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_8px_0_#6A1905] active:shadow-[0_0px_0_#6A1905] active:translate-y-2 flex justify-center items-center gap-3"
            >
              Confirmar e Ir al Menú <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}