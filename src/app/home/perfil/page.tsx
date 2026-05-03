"use client";

import { useState } from "react";
import { User, Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function PerfilPage() {
  const [claveActual, setClaveActual] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");

  const [showClaveActual, setShowClaveActual] = useState(false);
  const [showNuevaClave, setShowNuevaClave] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones de seguridad
    if (!claveActual || !nuevaClave || !confirmarClave) {
      return toast.warning("Todos los campos son obligatorios");
    }
    if (nuevaClave.length < 6) {
      return toast.warning("La nueva contraseña debe tener al menos 6 caracteres");
    }
    if (nuevaClave !== confirmarClave) {
      return toast.error("Las contraseñas nuevas no coinciden");
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveActual, nuevaClave }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al cambiar la contraseña");
      }

      toast.success("¡Contraseña actualizada exitosamente!");
      
      // Limpiamos los campos
      setClaveActual("");
      setNuevaClave("");
      setConfirmarClave("");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDF8F1] p-4 sm:p-6 lg:p-10 overflow-y-auto pb-24">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto flex flex-col items-center sm:items-start space-y-2 text-center sm:text-left mb-10">
        <h1 className="text-4xl sm:text-5xl font-black text-[#294C29] uppercase tracking-tighter leading-none">
          Seguridad del <span className="text-[#B43E17]">Sistema</span>
        </h1>
        <div className="h-1.5 w-16 bg-[#B43E17] rounded-full mx-auto sm:mx-0"></div>
        <p className="text-[#294C29]/60 font-bold text-sm mt-3 flex items-center justify-center sm:justify-start gap-2 pt-2 uppercase tracking-widest">
          <Shield className="w-4 h-4" /> Control de Acceso
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* COLUMNA IZQUIERDA: INFO DEL PERFIL */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#294C29] rounded-4xl p-6 sm:p-8 text-[#F6E4C9] shadow-lg relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-br-full -ml-10 -mt-10"></div>
            
            <div className="w-24 h-24 bg-[#FDF8F1] rounded-full flex items-center justify-center text-[#294C29] mb-4 relative z-10 shadow-inner">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter relative z-10">Administrador</h2>
            <p className="text-xs font-bold text-[#EADDCA] uppercase tracking-widest mt-1 relative z-10">Usuario Maestro</p>
            
            <div className="w-full bg-[#1A301A] rounded-xl p-4 mt-6 relative z-10 border border-white/10">
              <div className="flex items-center gap-2 justify-center text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Cuenta Activa</span>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: FORMULARIO DE CAMBIO DE CLAVE */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-4xl border border-[#294C29]/10 shadow-sm p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[#FDF8F1] flex items-center justify-center text-[#B43E17]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#294C29] uppercase tracking-tighter leading-none">Cambiar Contraseña</h2>
                <span className="text-[10px] sm:text-xs font-bold text-[#294C29]/40 uppercase tracking-widest">Actualiza tus credenciales de acceso</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Contraseña Actual */}
              <div className="space-y-2">
                <label className="text-[11px] sm:text-xs font-black text-[#294C29]/70 uppercase tracking-widest pl-1">Contraseña Actual</label>
                <div className="relative">
                  <input
                    type={showClaveActual ? "text" : "password"}
                    value={claveActual}
                    onChange={(e) => setClaveActual(e.target.value)}
                    placeholder="Ingresa tu clave actual"
                    className="w-full bg-[#FDF8F1] text-[#294C29] font-bold text-sm rounded-2xl py-4 pl-5 pr-12 focus:outline-none border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaveActual(!showClaveActual)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#294C29]/40 hover:text-[#B43E17] transition-colors"
                  >
                    {showClaveActual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-[#294C29]/5 my-6"></div>

              {/* Nueva Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] sm:text-xs font-black text-[#294C29]/70 uppercase tracking-widest pl-1">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showNuevaClave ? "text" : "password"}
                      value={nuevaClave}
                      onChange={(e) => setNuevaClave(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-[#FDF8F1] text-[#294C29] font-bold text-sm rounded-2xl py-4 pl-5 pr-12 focus:outline-none border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNuevaClave(!showNuevaClave)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#294C29]/40 hover:text-[#B43E17] transition-colors"
                    >
                      {showNuevaClave ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] sm:text-xs font-black text-[#294C29]/70 uppercase tracking-widest pl-1">Confirmar</label>
                  <input
                    type={showNuevaClave ? "text" : "password"}
                    value={confirmarClave}
                    onChange={(e) => setConfirmarClave(e.target.value)}
                    placeholder="Repite la nueva clave"
                    className="w-full bg-[#FDF8F1] text-[#294C29] font-bold text-sm rounded-2xl py-4 px-5 focus:outline-none border border-[#294C29]/10 focus:border-[#B43E17]/50 transition-all"
                  />
                </div>
              </div>

              {/* Botón Guardar Centrado */}
              <div className="pt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto min-w-62.5 bg-[#B43E17] hover:bg-[#9F280A] text-[#F6E4C9] py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-md flex justify-center items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Actualizando...</>
                  ) : (
                    <><Shield className="w-5 h-5" /> Guardar Contraseña</>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}