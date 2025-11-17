# XtreamSales

<div align="center">

![XtreamSales Logo](https://img.shields.io/badge/XtreamSales-SaaS%20Platform-blue?style=for-the-badge)

**Plataforma SaaS moderna para la gestión integral de revendedores y clientes**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Características](#-características) •
[Tecnologías](#-tecnologías) •
[Instalación](#-instalación) •
[Uso](#-uso) •
[Estructura](#-estructura-del-proyecto) •
[Contribuir](#-contribuir)

</div>

---

## 📋 Descripción

XtreamSales es una aplicación web SaaS de última generación diseñada para administradores y revendedores que necesitan gestionar sus clientes de manera eficiente. La plataforma ofrece un sistema completo de gestión con roles diferenciados, planes de suscripción flexibles y herramientas de administración robustas.

### 🎯 Casos de Uso

- **Administradores**: Gestión completa de revendedores, clientes globales, plantillas y usuarios
- **Revendedores**: Administración de su propia cartera de clientes con herramientas especializadas
- **Gestión de Suscripciones**: Control automático de planes, vencimientos y renovaciones

---

## ✨ Características

### 🔐 Sistema de Autenticación y Roles

- **Autenticación segura** con Supabase Auth
- **Control de acceso basado en roles** (Admin/Reseller)
- **Persistencia de sesión** automática
- **Redirección inteligente** según el rol del usuario

### 👥 Gestión de Revendedores

- ✅ CRUD completo de revendedores
- ✅ Asignación de planes de suscripción personalizables
- ✅ Estados automáticos: `active`, `expired`, `pending`, `blocked`
- ✅ Seguimiento de fechas de expiración
- ✅ Sistema de renovación de planes
- ✅ Contador de clientes por revendedor

### 👤 Gestión de Clientes

- ✅ Administración completa de clientes
- ✅ Soporte para múltiples plataformas
- ✅ Validación de números telefónicos internacionales
- ✅ Formato de precios con separador de miles (estilo colombiano)
- ✅ **Importación/Exportación CSV** masiva
- ✅ Planes flexibles incluido **plan Ilimitado** (fecha fija: 2030-12-31)
- ✅ Estados de suscripción: `active`, `expiring`, `expired`

### 📊 Dashboard y Estadísticas

- 📈 Panel de control para administradores con métricas clave
- 📈 Dashboard especializado para revendedores
- 📈 Estadísticas en tiempo real
- 📈 Resumen visual de clientes activos, vencidos y por vencer

### 📝 Sistema de Plantillas

- 📄 Plantillas compartidas para revendedores
- 📄 Categorización de recursos
- 📄 Permisos diferenciados (Admin: lectura/escritura, Reseller: solo lectura)

### 🔧 Funcionalidades Avanzadas

- 🚀 Activación manual de usuarios pendientes
- 🚀 Sincronización bidireccional entre `auth.users` y `resellers` table
- 🚀 Bloqueo de usuarios con verificación en login
- 🚀 Notificaciones toast elegantes (react-hot-toast + sonner)
- 🚀 Interfaz responsive con TailwindCSS
- 🚀 Componentes UI profesionales con Radix UI

---

## 🛠 Tecnologías

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **React** | 18.x | Framework UI |
| **TypeScript** | 5.x | Tipado estático |
| **Vite** | 6.x | Build tool y dev server |
| **React Router** | 7.x | Enrutamiento SPA |
| **TailwindCSS** | 3.x | Framework CSS utility-first |
| **Radix UI** | - | Componentes accesibles y sin estilos |
| **Lucide React** | - | Iconografía moderna |

### Backend & Database

| Tecnología | Propósito |
|-----------|-----------|
| **Supabase** | Backend as a Service (BaaS) |
| **PostgreSQL** | Base de datos relacional |
| **Supabase Auth** | Sistema de autenticación |
| **Supabase Realtime** | Actualizaciones en tiempo real |

### Librerías Adicionales

- **react-phone-input-2**: Validación de números telefónicos internacionales
- **react-hot-toast** + **sonner**: Sistema de notificaciones
- **js-big-decimal**: Manejo preciso de decimales para precios

---

## 🚀 Instalación

### Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- Cuenta de Supabase (para configurar backend)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Programmerdj20/xtreamsales.git
cd xtreamsales
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

> **Nota**: Obtén estas credenciales desde tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)

### 4. Configurar base de datos

Ejecuta las migraciones SQL ubicadas en `supabase/migrations/` en tu instancia de Supabase.

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo (puerto 3000)

# Producción
npm run build            # Compila para producción
npm run preview          # Previsualiza build de producción

# Calidad de código
npm run lint             # Ejecuta ESLint
npx tsc --noEmit        # Verifica errores de TypeScript
```

---

## 🗂 Estructura del Proyecto

```
xtreamsales/
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── admin/          # Componentes específicos del admin
│   │   ├── auth/           # Componentes de autenticación
│   │   ├── clients/        # Componentes de gestión de clientes
│   │   ├── dashboard/      # Paneles y tarjetas del dashboard
│   │   ├── layout/         # Layout principal (Header, Sidebar)
│   │   ├── modals/         # Diálogos modales
│   │   ├── resellers/      # Componentes de gestión de revendedores
│   │   └── ui/             # Componentes UI base (Radix-based)
│   ├── contexts/           # React contexts (AuthContext)
│   ├── lib/                # Utilidades y configuraciones
│   │   ├── supabase.ts     # Cliente Supabase regular
│   │   ├── supabaseAdmin.ts # Cliente Supabase admin
│   │   ├── dateUtils.ts    # Utilidades de fechas
│   │   ├── priceUtils.ts   # Formateo de precios
│   │   └── ...
│   ├── pages/              # Páginas de la aplicación
│   │   ├── admin/          # Páginas del panel admin
│   │   └── reseller/       # Páginas del panel reseller
│   ├── services/           # Lógica de negocio y API calls
│   │   ├── auth.ts
│   │   ├── clients.ts
│   │   ├── resellers.ts
│   │   ├── plans.ts
│   │   └── ...
│   ├── types/              # Definiciones de tipos TypeScript
│   ├── App.tsx             # Componente raíz con rutas
│   └── main.tsx            # Punto de entrada
├── supabase/               # Scripts SQL y migraciones
├── public/                 # Archivos estáticos
├── dist/                   # Build de producción
├── vite.config.ts          # Configuración de Vite
├── tsconfig.json           # Configuración de TypeScript
├── tailwind.config.js      # Configuración de TailwindCSS
└── package.json
```

---

## 🎨 Rutas de la Aplicación

### 🔓 Rutas Públicas

- `/login` - Página de inicio de sesión

### 🔒 Rutas Protegidas (Admin)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboard` | DashboardPage | Panel principal del admin |
| `/resellers` | ResellersPage | Gestión de revendedores |
| `/clients` | ClientsPage | Vista global de clientes |
| `/templates` | TemplatesPage | Administración de plantillas |
| `/admin/users` | UsersPage | Gestión de usuarios |
| `/admin/activate-users` | ActivateUsers | Activación de usuarios pendientes |

### 🔒 Rutas Protegidas (Reseller)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/reseller/dashboard` | ResellerDashboardPage | Dashboard del revendedor |
| `/reseller/clients` | ResellerClientsPage | Gestión de clientes propios |
| `/reseller/templates` | ResellerTemplatesPage | Consulta de plantillas |
| `/reseller/settings` | ResellerSettingsPage | Configuración de cuenta |

---

## 🔑 Arquitectura de Autenticación

### Flujo de Autenticación

1. **Login** → Validación con Supabase Auth
2. **Obtención de rol** → Lectura de `raw_user_meta_data.role`
3. **Redirección automática**:
   - Admin → `/dashboard`
   - Reseller → `/reseller/clients`
4. **Persistencia de sesión** → LocalStorage + Supabase

### Protección de Rutas

Todas las rutas protegidas usan el componente `ProtectedRoute` que:
- Verifica autenticación activa
- Valida rol requerido (`requiredRole` prop)
- Redirige a `/login` si no hay sesión válida
- Bloquea acceso si el rol no coincide

---

## 🗄 Modelos de Datos Principales

### Reseller

```typescript
interface Reseller {
  id: string;
  user_id: string;           // Referencia a auth.users
  full_name: string;
  email: string;
  phone: string;
  plan_type: string;
  plan_end_date: string;
  status: 'active' | 'expired' | 'pending' | 'blocked';
  clients_count: number;
  created_at: string;
}
```

### Client

```typescript
interface Client {
  id: string;
  owner_id: string;          // Referencia al reseller
  cliente: string;
  whatsapp: string;
  plataforma: string;
  dispositivos: number;
  precio: number;
  usuario: string;
  contraseña: string;
  fecha_inicio: string;
  fecha_fin: string;
  status: 'active' | 'expiring' | 'expired';
  plan: string;
  observacion?: string;
}
```

---

## ⚙️ Configuración de Producción

### Build para Producción

```bash
npm run build
```

Esto generará una carpeta `dist/` con los archivos optimizados.

### Variables de Entorno (Producción)

Asegúrate de configurar las variables de entorno en tu servidor de producción:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_produccion
```

### Deployment

Consulta `INSTRUCCIONES_PRODUCCION.md` para instrucciones detalladas sobre:
- Configuración en Hostinger
- Setup de SSL
- Configuración de dominio
- Variables de entorno de Supabase

---

## 🧪 Testing

```bash
# Verificar tipos de TypeScript
npx tsc --noEmit

# Linting
npm run lint
```

---

## 🐛 Debugging y Utilidades

### Scripts de Utilidad

El proyecto incluye scripts JavaScript para operaciones de base de datos:

```bash
node activate_user.js        # Activar usuarios manualmente
node fix_templates.js        # Reparar plantillas
node verify_and_test.js      # Verificar integridad de BD
node check_templates.js      # Verificar plantillas
node check_plans.js          # Verificar planes
node execute_sql.js          # Ejecutar SQL arbitrario
node test_update_status.js   # Testear actualización de estado
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Commits

- `Add:` - Nueva funcionalidad
- `Fix:` - Corrección de bugs
- `Update:` - Actualización de funcionalidad existente
- `Refactor:` - Refactorización de código
- `Docs:` - Cambios en documentación

---

## 📄 Licencia

Este proyecto es privado y de uso exclusivo para el propietario del repositorio.

---

## 👨‍💻 Autor

**Programmerdj20**

- GitHub: [@Programmerdj20](https://github.com/Programmerdj20)

---

## 📞 Soporte

Si encuentras algún problema o tienes alguna pregunta:

1. Abre un [Issue](https://github.com/Programmerdj20/xtreamsales/issues)
2. Contacta al administrador del proyecto

---

<div align="center">

**Hecho con ❤️ usando React + TypeScript + Supabase**

⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub

</div>
