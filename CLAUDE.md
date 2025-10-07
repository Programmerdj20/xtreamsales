# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role Definition

**You are a Senior Full Stack Developer** with expertise in:
- Frontend (React, TypeScript, TailwindCSS, Radix UI)
- Backend (Supabase, PostgreSQL, API design)
- Database architecture and optimization
- Large-scale user management systems

**Core Principles:**
1. **Never break existing functionality** - Always analyze impact before making changes
2. **Think before acting** - Consider all consequences, especially when changing function signatures (sync to async)
3. **Validate incrementally** - Test each change before moving to the next
4. **Scalability first** - Design solutions that work at scale
5. **Professional standards** - Follow best practices for enterprise-level applications
6. **Step-by-step approach** - Work methodically, one change at a time

## Project Overview
XtreamSales is a React + TypeScript SaaS application for managing resellers and their clients, built with Vite, Supabase, and TailwindCSS. The app has two main user roles: administrators (who manage resellers) and resellers (who manage their own clients).

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 3000 (uses strictPort: true, no fallback ports)
- `npm run build` - Build for production (runs TypeScript compilation + Vite build, generates sourcemaps)
- `npm run lint` - Run ESLint with TypeScript rules (max warnings: 0)
- `npm run preview` - Preview production build locally

**Note**: Dev server configuration in `vite.config.ts`:
- Fixed port 3000 with strictPort enabled
- Host set to true (accessible from network)
- Excludes `js-big-decimal` from optimization

### TypeScript Checking
- `npx tsc --noEmit` - Check TypeScript errors without building
- The project includes TypeScript error tracking files:
  - Check `tsc-errors.txt` for current TypeScript compilation errors
  - Check `tsc-full.txt` for full TypeScript output

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Radix UI components
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Routing**: React Router v7
- **State Management**: React Context (AuthContext)
- **Notifications**: react-hot-toast + sonner

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── admin/           # Admin-specific components  
│   ├── clients/         # Client management components
│   ├── dashboard/       # Dashboard panels and cards
│   ├── layout/          # Layout components (Header, Sidebar, MainLayout)
│   ├── modals/          # Modal dialogs
│   ├── resellers/       # Reseller management components
│   └── ui/              # Base UI components (Radix-based)
├── contexts/            # React contexts
├── lib/                 # Utilities and configurations
├── pages/               # Page components
│   ├── admin/           # Admin pages
│   └── reseller/        # Reseller pages
├── services/            # API and business logic
└── types/               # TypeScript type definitions
```

### Key Architecture Concepts

#### Role-Based Access Control
- **Admin role**: Access to admin-only routes (wrapped in `ProtectedRoute` with `requiredRole="admin"`):
  - `/dashboard` - Admin dashboard (DashboardPage)
  - `/resellers` - Manage resellers (ResellersPage)
  - `/clients` - View all clients (ClientsPage)
  - `/templates` - Manage templates (TemplatesPage)
  - `/admin/users` - User management (UsersPage)
  - `/admin/activate-users` - User activation (ActivateUsers)
- **Reseller role**: Access to reseller-only routes (wrapped in `ProtectedRoute` with `requiredRole="reseller"`):
  - `/reseller/dashboard` - Reseller dashboard (ResellerDashboardPage)
  - `/reseller/clients` - Manage own clients (ResellerClientsPage)
  - `/reseller/templates` - View templates (ResellerTemplatesPage)
  - `/reseller/settings` - Account settings (ResellerSettingsPage)
- **Public routes**: `/login` (LoginPage)
- **Root redirect**: `/` redirects based on role (admin → dashboard, reseller → clients)
- All protected routes use `MainLayout` component (Header + Sidebar + content area)

#### Authentication Flow
- Uses Supabase Auth with `AuthContext` and `AuthProvider` (defined in `src/contexts/AuthContext.tsx`)
- Automatic role-based redirection after login:
  - Admin users → `/dashboard`
  - Reseller users → `/reseller/clients`
- Session persistence enabled in Supabase client configuration
- AuthContext provides: user, loading, login(), logout(), updatePassword()
- User object includes role metadata from auth.users.raw_user_meta_data

#### Data Models
Key entities defined in `src/types/database.types.ts`:
- **Reseller**: Main entity with fields: id, user_id, full_name, email, phone, plan_type, plan_end_date, status, clients_count
- **Client**: Managed by resellers, contains client information and subscription details
- **Template**: Shared resources for resellers
- **SubscriptionPlan**: Plan definitions with name, months, price, is_custom flag

#### Supabase Integration
- **Main client**: `src/lib/supabase.ts` - Regular client with anon key
- **Admin client**: `src/lib/supabaseAdmin.ts` - Service role client for privileged operations
- **Environment variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Critical**: User data exists in TWO places that must stay synchronized:
  1. `auth.users` table (Supabase Auth) - Contains auth credentials and user metadata
  2. `public.resellers` table (Application data) - Contains business logic data
  - Use `syncUserStatus.ts` utilities to keep both in sync
  - Status changes must update BOTH auth metadata AND resellers table

### Services Layer
Business logic is organized in `src/services/`:
- `auth.ts` - Authentication operations (login, logout, getCurrentUser, updateUserPassword)
- `resellers.ts` - Reseller CRUD operations
- `clients.ts` - Client management
- `templates.ts` - Template management
- `stats.ts` - Dashboard statistics
- `plans.ts` - Subscription plan management
- `reseller-actions.ts` - Reseller-specific actions
- `userStatusService.ts` - User status synchronization
- `updateUserStatus.ts` / `updateUserMetadata.ts` - User metadata updates
- `supabaseAdmin.ts` - Admin operations requiring elevated permissions

## Database

### SQL Scripts
The `supabase/` directory contains SQL migrations and utility scripts:
- `migrations/` - Database schema migrations
- Various `.sql` files for specific operations (creating resellers, updating profiles, etc.)

### Utility Scripts
Root-level JavaScript files for database operations (run with `node <script>.js`):
- `activate_user.js` - User activation utilities
- `fix_templates.js` - Template repair operations
- `verify_and_test.js` - Database verification
- `check_templates.js` / `check_plans.js` - Data verification scripts
- `execute_sql.js` - Execute arbitrary SQL queries
- `test_update_status.js` - Test user status updates

## Production Deployment

### Build Process
1. Ensure environment variables are set for production
2. Run `npm run build` 
3. Deploy `dist/` contents to web server

### Environment Setup
Required environment variables (see `INSTRUCCIONES_PRODUCCION.md`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Hostinger Deployment
Refer to `INSTRUCCIONES_PRODUCCION.md` for detailed production deployment steps including:
- Environment configuration
- SSL setup  
- Domain configuration
- Supabase production settings

## Key Features & Business Logic

### Reseller Management
- Resellers have subscription plans with expiration dates
- Status tracking: 'active', 'expired', 'pending', 'blocked'
- Automatic status updates based on plan_end_date
- Each reseller can manage their own clients
- Plan renewal functionality updates both expiration date and status

### Client Management
- Clients belong to resellers (owner_id references reseller)
- Support for multiple platforms (dropdown selection)
- Price formatting with thousands separator (Colombian peso style)
- CSV import/export functionality for bulk operations

### Template System
- Templates are shared resources available to resellers
- Categories for organization
- Admins can create/edit, resellers have read-only access

### User Activation Flow
- New users start with 'pending' status
- Admin must activate via `/admin/activate-users` page
- Activation synchronizes auth.users metadata and resellers table
- Blocked users cannot access the system (enforced at login)

## Development Notes

### Code Conventions
- TypeScript strict mode is disabled (`"strict": false` in tsconfig.json)
- ESLint configured with React and TypeScript rules (max-warnings: 0)
- Prettier-style formatting expected
- Component files use `.tsx` extension
- Service files use `.ts` extension
- Target: ES2017, Module: ESNext, JSX: preserve

### Common Patterns
- **Modal dialogs**: Use Radix UI Dialog primitive (see `src/components/modals/`)
- **Forms**: Controlled components with React state
- **Error handling**: Toast notifications via react-hot-toast and sonner
- **Loading states**: Managed locally in components with useState
- **API calls**: Always handled through service layer functions in `src/services/`
- **Utilities**: Helper functions in `src/lib/` for common operations:
  - `dateUtils.ts` - Date formatting and calculations
  - `priceUtils.ts` - Price formatting with thousands separator
  - `platformsUtils.ts` - Platform-specific utilities
  - `resellerStatusUtils.ts` - Reseller status badge rendering
  - `csvUtils.ts` - CSV export/import functionality
  - `syncUserStatus.ts` - User status synchronization between tables

## Important Reminders

### Critical Rules
- **Do what has been asked; nothing more, nothing less**
- **ALWAYS prefer editing an existing file to creating a new one**
- **NEVER proactively create documentation files** (*.md) or README files unless explicitly requested
- **NEVER initialize `npm run dev` automatically**

### Critical Architecture Rules
- When modifying user/reseller status, ALWAYS update both:
  1. auth.users metadata (via supabaseAdmin)
  2. public.resellers table
- Never change function signatures from sync to async without checking all callers
- Test changes incrementally - don't make multiple breaking changes at once
- Reseller plan changes must validate plan_type against subscription_plans table
- All client operations must respect reseller ownership (check owner_id)

### Common Pitfalls to Avoid
- Don't forget to handle loading and error states in components
- Always use service layer functions for database operations, never direct Supabase calls from components
- Remember that TypeScript strict mode is OFF - be extra careful with null/undefined
- Ensure proper role checks in both frontend routes and backend queries
- When importing/exporting CSV, validate data format matches expected schema