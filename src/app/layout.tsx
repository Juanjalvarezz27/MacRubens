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
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName={`${poppins.className} !rounded-[1.5rem] !overflow-hidden shadow-xl border border-slate-200 text-sm font-medium !mx-4 !mt-6 sm:!mx-auto !w-[calc(100%-2rem)] sm:!w-auto sm:!min-w-[320px] text-slate-700`}
        />
      </body>
    </html>
  );
}