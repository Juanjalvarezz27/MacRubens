"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  Menu, X, Pizza, Users, Settings, 
  Wallet, BarChart3, LineChart, LogOut, UserCircle 
} from "lucide-react";
import ConfirmModal from "../../components/ui/ConfirmModal";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Órdenes", href: "/home", icon: Pizza },
    { name: "Clientes", href: "/home/clientes", icon: Users },
    { name: "Est. Diarias", href: "/home/estadisticas/diarias", icon: BarChart3 },
    { name: "Est. Generales", href: "/home/estadisticas/generales", icon: LineChart },
    { name: "Menú y Precios", href: "/home/configuracion", icon: Settings },
    { name: "Cierre Diario", href: "/home/cierre", icon: Wallet },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <nav className="bg-[#294C29] text-[#F6E4C9] shadow-2xl sticky top-0 z-50">
        <div className="w-full px-4 md:px-8">
          <div className="flex items-center justify-between h-24">
            
            {/* LOGO Y MARCA */}
            <Link href="/home" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
              <div className="relative w-14 h-14 drop-shadow-md">
                <Image 
                  src="/Logo.png" 
                  alt="Logo Ruben's" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-2xl leading-none tracking-wider text-[#F6E4C9]" style={{ fontFamily: 'var(--font-anton)' }}>
                  RUBEN'S
                </span>
                <span className="text-[0.65rem] font-bold tracking-widest text-[#E7AF67] uppercase">
                  Pizzeria
                </span>
              </div>
            </Link>

            {/* MENÚ DESKTOP */}
            <div className="hidden xl:flex items-center space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-4xl font-bold text-sm transition-all duration-200 ${
                      isActive 
                        ? "bg-[#B43E17] text-[#F6E4C9] shadow-inner" 
                        : "hover:bg-[#1B361B] hover:text-[#E7AF67]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* PERFIL Y LOGOUT DESKTOP */}
            <div className="hidden xl:flex items-center gap-3 border-l border-[#F6E4C9]/20 pl-4 ml-2">
              <Link 
                href="/home/perfil"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#1B361B] text-[#F6E4C9] hover:text-[#E7AF67] transition-colors font-bold text-sm"
              >
                <UserCircle className="w-5 h-5" />
                Perfil
              </Link>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-2 bg-[#F6E4C9] text-[#9F280A] hover:bg-[#EADDCA] px-4 py-2 rounded-4xl font-black text-sm transition-all shadow-md active:shadow-none active:translate-y-1"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>

            {/* BOTÓN HAMBURGUESA */}
            <div className="xl:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-4xl bg-[#1B361B] text-[#F6E4C9] hover:text-[#E7AF67] focus:outline-none focus:ring-2 focus:ring-[#E7AF67] transition-colors"
              >
                {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>

        {/* MENÚ MÓVIL */}
        <div 
          className={`xl:hidden absolute top-24 left-0 w-full bg-[#294C29] border-t border-[#1B361B] shadow-2xl transition-all duration-300 origin-top overflow-y-auto ${
            isOpen ? "max-h-[85vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pt-4 pb-8 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-4xl font-bold text-base transition-colors ${
                    isActive 
                      ? "bg-[#B43E17] text-[#F6E4C9]" 
                      : "hover:bg-[#1B361B] text-[#F6E4C9]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-[#F6E4C9]" : "text-[#E7AF67]"}`} />
                  {link.name}
                </Link>
              );
            })}
            
            <div className="h-px bg-[#F6E4C9]/10 my-4"></div>

            <Link
              href="/home/perfil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-4xl font-bold text-base hover:bg-[#1B361B] text-[#F6E4C9]"
            >
              <UserCircle className="w-5 h-5 text-[#E7AF67]" />
              Perfil
            </Link>
            
            <button
              onClick={() => {
                setIsOpen(false);
                setIsLogoutModalOpen(true);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#F6E4C9] text-[#9F280A] px-4 py-4 rounded-4xl font-black text-base active:bg-[#EADDCA] transition-colors shadow-inner"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="¿Cerrar Sesión?"
        message="Tendrás que volver a ingresar tus credenciales para acceder al sistema."
        confirmText="Sí, salir"
        cancelText="Quedarme"
        isDestructive={true}
      />
    </>
  );
}