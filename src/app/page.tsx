"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        toast.error(res.error); 
      } else if (res?.ok) {
        toast.success("¡Bienvenido a MacRubens!");
        
        // Refrescamos el estado del App Router para que lea la nueva cookie
        router.refresh(); 
        
        // Empujamos al usuario adentro del sistema
        router.push("/home");
      }
    } catch (err) {
      toast.error("Error crítico de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 selection:bg-[#E7AF67] selection:text-[#294C29]">
      
      {/* Tarjeta principal - Estilo iOS Semi 3D */}
      <div className="bg-[#294C29] w-full max-w-md rounded-[3rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(27,54,27,0.6),inset_0_2px_0_rgba(255,255,255,0.15)] border border-[#1B361B]/50 relative overflow-hidden">
        
        {/* Resplandor de fondo suave */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#E7AF67] rounded-full blur-[100px] opacity-15 pointer-events-none"></div>

        <div className="relative z-10">
          
          {/* Logo y Encabezados Limpios */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-28 h-28 mb-4 relative drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)] transform transition-transform duration-300 hover:scale-105">
              <Image 
                src="/Logo.png" 
                alt="Logo Ruben's Pizzeria" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            
            <div className="text-center flex flex-col items-center">
              <h1 className="text-4xl font-black text-[#F6E4C9] tracking-wider uppercase leading-none drop-shadow-lg">
                Ruben's
              </h1>
              <h2 className="text-xl font-bold text-[#E7AF67] tracking-[0.3em] uppercase mt-2 drop-shadow-md">
                Pizzeria
              </h2>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Usuario Premium */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-[#B43E17]">
                <User className="h-6 w-6 text-[#294C29]/40 group-focus-within:text-[#9F280A] transition-colors" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                required
                className="w-full bg-[#EADDCA] text-[#294C29] font-bold placeholder:text-[#294C29]/40 rounded-3xl pl-14 pr-5 py-4 focus:outline-none focus:bg-[#F6E4C9] focus:ring-2 focus:ring-[#E7AF67] shadow-[inset_0_6px_10px_rgba(27,54,27,0.3),inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.1)] transition-all"
              />
            </div>

            {/* Input Contraseña Premium con Ojito */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-6 w-6 text-[#294C29]/40 group-focus-within:text-[#9F280A] transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                className="w-full bg-[#EADDCA] text-[#294C29] font-bold placeholder:text-[#294C29]/40 rounded-3xl pl-14 pr-14 py-4 focus:outline-none focus:bg-[#F6E4C9] focus:ring-2 focus:ring-[#E7AF67] shadow-[inset_0_6px_10px_rgba(27,54,27,0.3),inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.1)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-[#294C29]/40 hover:text-[#9F280A] transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-6 w-6" />
                ) : (
                  <Eye className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Botón Submit - Estilo 3D Físico Limpio */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-b from-[#B43E17] to-[#9F280A] hover:from-[#C7481F] hover:to-[#B43E17] text-[#F6E4C9] font-black uppercase tracking-[0.2em] text-lg py-4 rounded-3xl flex justify-center items-center gap-3 shadow-[0_8px_0_#6A1905,0_15px_25px_rgba(0,0,0,0.4),inset_0_2px_1px_rgba(255,255,255,0.2)] active:shadow-[0_0px_0_#6A1905,0_0px_0_rgba(0,0,0,0.4),inset_0_2px_1px_rgba(255,255,255,0.1)] active:translate-y-2 transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}