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
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint with TypeScript rules
- `npm run preview` - Preview production build locally

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
- **Admin role**: Access to `/dashboard`, `/resellers`, `/clients`, `/templates`, `/admin/*`
- **Reseller role**: Access to `/reseller/dashboard`, `/reseller/clients`, `/reseller/templates`, `/reseller/settings`
- Protected routes implemented via `ProtectedRoute` component

#### Authentication Flow
- Uses Supabase Auth with `AuthContext` and `AuthProvider`
- Automatic role-based redirection after login
- Session persistence enabled in Supabase client configuration

#### Data Models
Key entities defined in `src/types/database.types.ts`:
- **Reseller**: Main entity with plan management and client relationships
- **Client**: Managed by resellers
- **Template**: Shared resources for resellers

#### Supabase Integration
- Main client: `src/lib/supabase.ts` 
- Admin client: `src/lib/supabaseAdmin.ts`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Services Layer
Business logic is organized in `src/services/`:
- `auth.ts` - Authentication operations
- `resellers.ts` - Reseller CRUD operations  
- `clients.ts` - Client management
- `templates.ts` - Template management
- `stats.ts` - Dashboard statistics

## Database

### SQL Scripts
The `supabase/` directory contains SQL migrations and utility scripts:
- `migrations/` - Database schema migrations
- Various `.sql` files for specific operations (creating resellers, updating profiles, etc.)

### Utility Scripts
Root-level JavaScript files for database operations:
- `activate_user.js` - User activation utilities
- `fix_templates.js` - Template repair operations
- `verify_and_test.js` - Database verification

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

## Development Notes

### Code Conventions
- TypeScript strict mode is disabled (`"strict": false`)
- ESLint configured with React and TypeScript rules
- Prettier-style formatting expected
- Component files use `.tsx` extension
- Service files use `.ts` extension

### Common Patterns
- Modal dialogs use Radix UI Dialog primitive
- Forms typically use controlled components
- Error handling via toast notifications
- Loading states managed locally in components
- API calls handled in service layer functions

## Important Reminders
- Do what has been asked; nothing more, nothing less
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER initialize `npm run dev` automatically