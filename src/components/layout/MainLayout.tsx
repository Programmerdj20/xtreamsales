import React, { useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  // Inicializar el estado del sidebar basado en el tamaño de la pantalla
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    // En la carga inicial, verificar si es un dispositivo móvil o tablet
    return window.innerWidth < 1024; // Colapsar por defecto si es menor a 1024px (tablet o móvil)
  });

  // Actualizar el estado del sidebar cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      // Si es un dispositivo móvil o tablet, colapsar el sidebar
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };

    // Agregar event listener para el resize
    window.addEventListener('resize', handleResize);
    
    // Limpiar el event listener cuando el componente se desmonta
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-auto"><Outlet /></main>
      </div>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

