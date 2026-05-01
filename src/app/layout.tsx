import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  weight: '400',
  subsets: ["latin"],
  variable: "--font-anton",
});

export const metadata: Metadata = {
  title: "Rubens Pizzeria",
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
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F6E4C9]">
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
            toastClassName="!rounded-[1.5rem] !overflow-hidden shadow-xl border border-slate-200 font-sans text-sm font-medium !mx-4 !mt-6 sm:!mx-auto !w-[calc(100%-2rem)] sm:!w-auto sm:!min-w-[320px] text-slate-700"
        />
      </body>
    </html>
  );
}