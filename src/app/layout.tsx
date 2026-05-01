import type { Metadata } from "next";
import { Poppins, Anton } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

// 1. Configuramos Poppins como nuestra nueva fuente premium para el sistema
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

// 2. Mantenemos Anton solo para los títulos y la marca
const anton = Anton({
  weight: '400',
  subsets: ["latin"],
  variable: "--font-anton",
});

export const metadata: Metadata = {
  title: "Ruben's Pizzeria",
  description: "Sistema de gestión y punto de venta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${anton.variable} h-full antialiased`}
    >
      <body className={`${poppins.className} min-h-full flex flex-col bg-[#F6E4C9]`}>
        {children}
        
        {/* Contenedor Global de Alertas */}
        <ToastContainer 
          position="top-center"
          autoClose={2000} 
          hideProgressBar={true} 
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName={`${poppins.className} !rounded-[2rem] !overflow-hidden shadow-[0_25px_50px_-12px_rgba(41,76,41,0.25)] border border-[#294C29]/10 bg-white/95 backdrop-blur-xl text-sm font-black tracking-wide !mx-4 !mt-12 sm:!mx-auto !w-[calc(100%-2rem)] sm:!w-auto sm:!min-w-[350px] text-[#294C29] !px-4 !py-3 transition-all duration-300`}
        />
      </body>
    </html>
  );
}