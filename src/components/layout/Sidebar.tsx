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
    if (role === "admin") {
        return [
            {
                title: "Dashboard",
                path: "/dashboard",
                icon: LayoutDashboard,
            },
            {
                title: "Clientes",
                path: "/clients",
                icon: Users,
            },
            {
                title: "Plantillas",
                path: "/templates",
                icon: MessageSquare,
            },
            {
                title: "Revendedores",
                path: "/resellers",
                icon: UserPlus,
            },
            {
                title: "Activacion Revendedores",
                path: "/admin/users",
                icon: UserCog,
            },
        ];
    } else if (role === "reseller") {
        return [
            {
                title: "Clientes",
                path: "/reseller/clients",
                icon: Users,
            },
            {
                title: "Plantillas",
                path: "/reseller/templates",
                icon: MessageSquare,
            },
            {
                title: "Configuración",
                path: "/reseller/settings",
                icon: Settings,
            },
        ];
    }
    return []; // No items if no role or unknown role
};

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const location = useLocation();

    const menuItems = getMenuItems(user?.role); // Pasar directamente user?.role

    // Handler para cerrar el sidebar al hacer clic en un item del menú (solo en móvil)
    const handleMenuItemClick = () => {
        // Cerrar sidebar solo en dispositivos móviles/tablets (< 1024px)
        if (window.innerWidth < 1024 && !isCollapsed) {
            toggleSidebar();
        }
    };

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
                window.location.replace("/login");
            }, 100);
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            // En caso de error, intentar forzar la redirección de todos modos
            window.location.replace("/login");
        }
    };

    const activeItem =
        menuItems.find((item) => item.path === location.pathname)?.title || "";

    return (
        <>
            {/* Overlay oscuro para móvil cuando el sidebar está abierto */}
            {!isCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`h-screen bg-secondary text-foreground flex flex-col transition-all duration-300 ease-in-out z-50
                    ${isCollapsed
                        ? "-translate-x-full lg:translate-x-0 lg:w-20"
                        : "translate-x-0 w-64"
                    }
                    fixed lg:relative
                `}
            >
            <div className="p-3 lg:p-4 border-b border-border flex items-center justify-between lg:justify-center">
                <img
                    src={isCollapsed ? logoCollapsedUrl : logoExpandedUrl}
                    alt="XtreamSales Logo"
                    className={`transition-all duration-300 ease-in-out ${
                        isCollapsed ? "h-8 lg:h-8" : "h-10 sm:h-12"
                    } w-auto`}
                />
                {/* Botón de cerrar solo visible en móvil */}
                {!isCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        <ChevronsLeft className="w-5 h-5" />
                    </button>
                )}
            </div>

            <nav className="flex-grow p-3 lg:p-4 space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.title}
                        to={item.path}
                        onClick={handleMenuItemClick}
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
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && (
                            <span className="text-sm font-medium">
                                {item.title}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            <div
                className={`p-3 lg:p-4 border-t border-border ${
                    isCollapsed ? "flex justify-center" : ""
                }`}
            >
                {/* Botón de cerrar sesión */}
                <div className="mt-auto">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center px-3 py-2 text-muted-foreground hover:bg-accent hover:text-white transition-colors rounded-lg ${
                            isCollapsed ? "justify-center" : ""
                        }`}
                    >
                        {isCollapsed ? (
                            <LogOut className="w-5 h-5" />
                        ) : (
                            <>
                                <LogOut className="w-5 h-5 mr-2" />
                                <span className="text-sm font-medium">Cerrar Sesión</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

        </aside>
        </>
    );
}
