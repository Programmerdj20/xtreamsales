import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, LogOut, ChevronsLeft, ChevronsRight, LayoutDashboard, MessageSquare, UserCog } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const logoExpandedUrl = '/xstream_logo.png'; 
const logoCollapsedUrl = '/xs_logo.png'; 

const getMenuItems = (isAdmin: boolean) => {
  const items = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Revendedores',
      path: '/resellers',
      icon: Users,
    },
    {
      title: 'Plantillas',
      path: '/templates',
      icon: MessageSquare,
    },
  ];

  if (isAdmin) {
    items.push({
      title: 'Gestión de Usuarios',
      path: '/admin/users',
      icon: UserCog,
    });
  }

  return items;
};

interface SidebarProps {
  isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const menuItems = getMenuItems(user?.role === 'admin');

  const handleLogout = async () => {
    try {
      // Limpiar localStorage y sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Usar Supabase directamente para cerrar sesión
      await supabase.auth.signOut();
      
      // Esperar un momento para asegurar que la sesión se cierre completamente
      setTimeout(() => {
        // Forzar recarga completa de la página para limpiar cualquier estado
        window.location.replace('/login');
      }, 100);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // En caso de error, intentar forzar la redirección de todos modos
      window.location.replace('/login');
    }
  };

  const activeItem = menuItems.find(item => item.path === location.pathname)?.title || '';

  return (
    <aside className={`h-screen bg-secondary text-foreground flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4 border-b border-border flex items-center justify-center">
        <img 
          src={isCollapsed ? logoCollapsedUrl : logoExpandedUrl} 
          alt="XtreamSales Logo" 
          className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'h-8' : 'h-12'} w-auto`}
        />
      </div>

      <nav className="flex-grow p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            to={item.path} 
            className={`flex items-center space-x-3 p-2 rounded-xl transition-colors
              ${item.title === activeItem 
                ? 'bg-[#00A8FF] text-white' 
                : 'text-muted-foreground hover:bg-[#FF00FF]/40'
              }
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? item.title : undefined}
          >
            <item.icon className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
          </Link>
        ))}
      </nav>

      <div className={`p-4 border-t border-border ${isCollapsed ? 'flex justify-center' : ''}`}>
        {/* Botón de cerrar sesión */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2 text-muted-foreground hover:bg-accent hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            {isCollapsed ? (
              <LogOut className="w-5 h-5" />
            ) : (
              <>
                <LogOut className="w-5 h-5 mr-2" />
                Cerrar Sesión
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Botón para colapsar/expandir - Temporalmente aquí, luego lo moveremos al Header o MainLayout */}
      {/* <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-2 text-muted-foreground hover:text-foreground absolute bottom-16 right-0 transform translate-x-1/2 bg-secondary rounded-full border border-border shadow-lg" // Oculto en md y mayores, ya que el control estará en el header
      >
        {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
      </button> */}
    </aside>
  );
};

