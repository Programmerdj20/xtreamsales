import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    LogOut,
    ChevronsLeft,
    ChevronsRight,
    LayoutDashboard,
    MessageSquare,
    UserCog,
    UserPlus,
    Settings,
} from "lucide-react"; // Importar Settings
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const logoExpandedUrl = "/xstream_logo.png";
const logoCollapsedUrl = "/xs_logo.png";

const getMenuItems = (role: string | undefined) => {
    const commonItems = [
        {
            title: "Dashboard",
            path: role === "admin" ? "/dashboard" : "/reseller/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Clientes",
            path: role === "admin" ? "/clients" : "/reseller/clients",
            icon: Users,
        },
        {
            title: "Plantillas",
            path: role === "admin" ? "/templates" : "/reseller/templates",
            icon: MessageSquare,
        },
    ];

    if (role === "admin") {
        return [
            ...commonItems,
            {
                title: "Revendedores",
                path: "/resellers",
                icon: UserPlus,
            },
            {
                title: "Gestiรณn de Usuarios",
                path: "/admin/users",
                icon: UserCog,
            },
        ];
    } else if (role === "reseller") {
        return [
            ...commonItems,
            {
                title: "Configuraciรณn",
                path: "/reseller/settings",
                icon: Settings, // Usar el icono de Settings
            },
        ];
    }
    return []; // No items if no role or unknown role
};

interface SidebarProps {
    isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const location = useLocation();

    const menuItems = getMenuItems(user?.role); // Pasar directamente user?.role

    const handleLogout = async () => {
        try {
            // Limpiar localStorage y sessionStorage
            localStorage.clear();
            sessionStorage.clear();

            // Usar Supabase directamente para cerrar sesiรณn
            await supabase.auth.signOut();

            // Esperar un momento para asegurar que la sesiรณn se cierre completamente
            setTimeout(() => {
                // Forzar recarga completa de la pรกgina para limpiar cualquier estado
                window.location.replace("/login");
            }, 100);
        } catch (error) {
            console.error("Error al cerrar sesiรณn:", error);
            // En caso de error, intentar forzar la redirecciรณn de todos modos
            window.location.replace("/login");
        }
    };

    const activeItem =
        menuItems.find((item) => item.path === location.pathname)?.title || "";

    return (
        <aside
            className={`h-screen bg-secondary text-foreground flex flex-col transition-all duration-300 ease-in-out ${
                isCollapsed ? "w-16 sm:w-20" : "w-64"
            }`}
        >
            <div className="p-2 sm:p-4 border-b border-border flex items-center justify-center">
                <img
                    src={isCollapsed ? logoCollapsedUrl : logoExpandedUrl}
                    alt="XtreamSales Logo"
                    className={`transition-all duration-300 ease-in-out ${
                        isCollapsed ? "h-6 sm:h-8" : "h-10 sm:h-12"
                    } w-auto`}
                />
            </div>

            <nav className="flex-grow p-2 sm:p-4 space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.title}
                        to={item.path}
                        className={`flex items-center space-x-3 p-2 rounded-xl transition-colors
              ${
                  item.title === activeItem
                      ? "bg-[#00A8FF] text-white"
                      : "text-muted-foreground hover:bg-[#FF00FF]/40"
              }
              ${isCollapsed ? "justify-center" : ""}
            `}
                        title={isCollapsed ? item.title : undefined}
                    >
                        <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        {!isCollapsed && (
                            <span className="text-sm font-medium">
                                {item.title}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            <div
                className={`p-2 sm:p-4 border-t border-border ${
                    isCollapsed ? "flex justify-center" : ""
                }`}
            >
                {/* Botรณn de cerrar sesiรณn */}
                <div className="mt-auto">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center px-2 sm:px-3 py-1 sm:py-2 text-muted-foreground hover:bg-accent hover:text-white transition-colors ${
                            isCollapsed ? "justify-center" : ""
                        }`}
                    >
                        {isCollapsed ? (
                            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                            <>
                                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                Cerrar Sesiรณn
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Botรณn para colapsar/expandir - Temporalmente aquรญ, luego lo moveremos al Header o MainLayout */}
            {/* <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-2 text-muted-foreground hover:text-foreground absolute bottom-16 right-0 transform translate-x-1/2 bg-secondary rounded-full border border-border shadow-lg" // Oculto en md y mayores, ya que el control estarรก en el header
      >
        {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
      </button> */}
        </aside>
    );
}
