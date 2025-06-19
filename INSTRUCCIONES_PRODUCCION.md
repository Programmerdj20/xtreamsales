# CONFIGURACIÓN DE PRODUCCIÓN - HOSTINGER

## Variables de Entorno Críticas

⚠️ ANTES de subir a producción, debes:

1. **Crear archivo .env.production** con:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

2. **Verificar configuración de Supabase**:
    - Agregar tu dominio de producción a "Site URL"
    - Configurar "Redirect URLs" con tu dominio
    - Verificar que las políticas RLS permitan acceso desde tu dominio

## Pasos de Despliegue:

### 1. Preparar Variables

```bash
# Crear .env.production
cp .env .env.production
# Editar con valores de producción
```

### 2. Build con Variables de Producción

```bash
npm run build
```

### 3. Subir a Hostinger

-   Subir TODO el contenido de `dist/` a `public_html/`
-   Incluir el archivo `.htaccess`

### 4. Configurar Dominio

-   Activar SSL
-   Configurar redirects HTTPS
-   Verificar DNS

### 5. Configurar Supabase

-   Site URL: https://tudominio.com
-   Redirect URLs: https://tudominio.com/**

## Verificación Post-Despliegue:

-   [ ] Página carga correctamente
-   [ ] Login funciona
-   [ ] Registro funciona
-   [ ] Base de datos conecta
-   [ ] SSL activo
-   [ ] Favicon aparece

## Actualizaciones Futuras:

1. Modificar código localmente
2. `npm run build`
3. Subir archivos de `dist/` a `public_html/`
4. Limpiar caché del navegador
