import Navbar from "../components/ui/Navbar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col w-full">
      {/* El Navbar fijo arriba */}
      <Navbar />
      
      {/* Contenedor principal responsive para las vistas */}
      <main className="flex-1 mx-auto w-full">
        {children}
      </main>
    </div>
  );
}