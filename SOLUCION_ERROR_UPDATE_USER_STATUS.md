# Solución: Error en Activación de Revendedores

**Fecha:** 2 de Octubre, 2025  
**Problema Original:** `Could not find the function public.update_user_status(new_status, user_id) in the schema cache`

---

## 📋 Resumen del Problema

Al intentar activar/desactivar usuarios desde el panel admin en la pestaña "Activación Revendedores", aparecía un error indicando que la función RPC `update_user_status` no podía ser encontrada con los parámetros proporcionados.

### Causa Raíz

La función RPC `update_user_status` en Supabase está definida con los parámetros:

-   `input_user_id` (UUID)
-   `new_status` (TEXT)

Pero varios archivos del frontend estaban llamando la función con parámetros incorrectos:

-   `user_id` (incorrecto ❌)
-   `new_status`

---

## 🔧 Archivos Corregidos

### 1. `src/services/userStatusService.ts`

**Línea 73** - Corrección en la llamada RPC

```typescript
// ❌ ANTES (incorrecto)
const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "update_user_status",
    {
        user_id: userId, // ❌ Parámetro incorrecto
        new_status: status,
    }
);

// ✅ DESPUÉS (correcto)
const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "update_user_status",
    {
        input_user_id: userId, // ✅ Parámetro correcto
        new_status: status,
    }
);
```

---

### 2. `src/services/auth.ts`

**Línea 120** - Corrección en la creación de revendedor durante registro

```typescript
// ❌ ANTES (incorrecto)
const { error: statusError } = await supabase.rpc("update_user_status", {
    user_id: authData.user.id, // ❌ Parámetro incorrecto
    new_status: initialStatus,
});

// ✅ DESPUÉS (correcto)
const { error: statusError } = await supabase.rpc("update_user_status", {
    input_user_id: authData.user.id, // ✅ Parámetro correcto
    new_status: initialStatus,
});
```

---

### 3. `src/components/admin/UserRoleModal.tsx`

**Línea 122** - Corrección en la actualización de estado desde el modal de usuario

```typescript
// ❌ ANTES (incorrecto)
const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "update_user_status",
    {
        user_id: userId, // ❌ Parámetro incorrecto
        new_status: status,
    }
);

// ✅ DESPUÉS (correcto)
const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "update_user_status",
    {
        input_user_id: userId, // ✅ Parámetro correcto
        new_status: status,
    }
);
```

---

## ✅ Verificaciones Realizadas

### 1. Flujo de Registro

-   ✅ Los nuevos usuarios se registran con `status="pending"` por defecto
-   ✅ Solo el admin puede activarlos desde el panel

### 2. Función RPC en Supabase

La función `update_user_status` en Supabase está correctamente definida:

```sql
CREATE OR REPLACE FUNCTION update_user_status(
  input_user_id UUID,
  new_status TEXT
)
RETURNS BOOLEAN
```

### 3. Archivos que YA estaban correctos

-   ✅ `src/services/resellers.ts` (línea 274)
-   ✅ `src/lib/syncUserStatus.ts` (línea 37)
-   ✅ `src/pages/admin/UsersPage.tsx` (línea 133)

---

## 🎯 Resultado

Después de las correcciones:

-   ✅ La activación/desactivación de usuarios funciona correctamente
-   ✅ No aparece el error de función no encontrada
-   ✅ Los estados se actualizan en la base de datos
-   ✅ La sincronización entre tablas `profiles` y `resellers` funciona

---

## 🔮 Próximos Pasos (Recomendados)

### Problema de UX Identificado

**Duplicación de funcionalidad:** Existen dos pestañas que hacen tareas similares:

1. **Revendedores** - Gestión completa (editar, renovar planes, cambiar estados)
2. **Activación Revendedores** - Solo activar usuarios pendientes

### Solución Propuesta: Unificación

Eliminar la pestaña "Activación Revendedores" y mejorar "Revendedores" con:

-   Filtros dinámicos por estado (Todos, Activos, Pendientes, Inactivos, Vencidos)
-   Badge visual destacado para usuarios pendientes
-   Botón de acción rápida "Activar" para usuarios pendientes
-   Dropdown de estados en cada fila para cambios rápidos

**Beneficios:**

-   Mejor experiencia de usuario (UX)
-   Menos confusión con pestañas duplicadas
-   Interfaz más profesional y coherente
-   Mantenimiento más simple del código

---

## 📝 Notas Técnicas

### ¿Por qué el problema no era obvio?

1. Algunos archivos usaban `input_user_id` (correcto)
2. Otros usaban `user_id` (incorrecto)
3. El cache del navegador podía ocultar cambios
4. El error solo aparecía en ciertos flujos de usuario

### Lecciones Aprendidas

1. **Consistencia en nombres de parámetros:** Siempre verificar la definición de la función RPC antes de llamarla
2. **Búsqueda exhaustiva:** Usar regex para encontrar TODAS las llamadas a una función
3. **Testing completo:** Probar todos los flujos de usuario después de cambios en funciones compartidas

---

## 🔍 Comandos Útiles para Verificación

```bash
# Buscar todas las llamadas a update_user_status
grep -r "update_user_status" src/

# Buscar llamadas RPC
grep -r "\.rpc\(" src/ | grep "update_user_status"

# Verificar parámetros
grep -A 3 "update_user_status" src/**/*.ts
```

---

**Autor:** Kilo Code  
**Estado:** ✅ Resuelto
