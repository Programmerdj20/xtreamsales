import { supabase } from '../lib/supabase';

export interface Alert {
  id: string;
  type: 'expiring' | 'payment' | 'demo';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  link?: string;
}

export interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  lastChecked: string;
  message?: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: string;
  updatedAt: string;
  message: string;
}

export interface Activity {
  id: string;
  type: 'renewal' | 'activation' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    resellerName?: string;
    oldStatus?: string;
    newStatus?: string;
    planType?: string;
  };
}

export interface DashboardStats {
  resellers: {
    total: number;
    active: number;
    pending: number;
    expiringSoon: number; // Revendedores por vencer (5 días)
    expired: number; // Revendedores vencidos
    recentRegistrations: Array<{
      id: string;
      full_name: string;
      status: string;
      created_at: string;
    }>;
  };
  clients: {
    total: number;
    active: number;
    pending: number;
    expiringSoon: number; // Clientes por vencer (5 días)
    expired: number; // Clientes vencidos
    recentRegistrations: Array<{
      id: string;
      full_name: string;
      reseller_name: string;
      status: string;
      created_at: string;
    }>;
  };
  alerts: Alert[];
  recentActivity: Activity[];
  services: ServiceStatus[];
  incidents: Incident[];
}

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    // Definir interfaces para los datos de revendedores
    interface ResellerBasicData {
      id: string;
      status: string;
      full_name: string;
    }
    
    interface ResellerFullData extends ResellerBasicData {
      plan_end_date: string;
      created_at: string;
    }
    
    interface ResellerWithCreatedAt extends ResellerBasicData {
      created_at: string;
      plan_end_date?: string;
    }
    
    // Intentar obtener estadísticas usando una función RPC o directamente
    let resellersData: any[] = [];
    let pendingResellersData: any[] = [];
    let recentResellers: any[] = [];
    
    try {
      // ENFOQUE PRINCIPAL: Obtener perfiles de revendedores desde la tabla profiles
      console.log('Obteniendo perfiles de revendedores desde profiles...');
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_all_profiles');
        
      if (profilesError) {
        console.error('Error al obtener perfiles con RPC:', profilesError);
        resellersData = [];
      } else {
        // Filtrar solo los perfiles con rol 'reseller'
        const resellerProfiles = profilesData?.filter(p => p.role === 'reseller') || [];
        console.log(`Encontrados ${resellerProfiles.length} perfiles de revendedores`);
        console.log('Revendedores activos en profiles:', resellerProfiles.filter(p => p.status === 'active').length);
        
        // Obtener datos adicionales de la tabla resellers
        const { data: resellersTableData, error: resellersError } = await supabase
          .rpc('get_all_resellers');
          
        console.log('Datos de la tabla resellers:', { 
          count: resellersTableData?.length || 0, 
          error: resellersError ? resellersError.message : null 
        });
        
        // Combinar datos de ambas fuentes, priorizando el estado de profiles
        resellersData = resellerProfiles.map(profile => {
          // Buscar datos correspondientes en la tabla resellers
          const resellerData = resellersTableData?.find(r => 
            r.id === profile.id || r.user_id === profile.id
          );
          
          if (resellerData) {
            // Si encontramos datos en resellers, combinarlos con el perfil
            return {
              ...resellerData,
              id: profile.id,
              full_name: profile.full_name || resellerData.full_name,
              email: profile.email,
              status: profile.status, // Usar el estado del perfil como fuente de verdad
              plan_end_date: resellerData.plan_end_date || new Date(Date.now() + 30*24*60*60*1000).toISOString()
            };
          } else {
            // Si no hay datos en resellers, crear un objeto con datos básicos
            return {
              id: profile.id,
              user_id: profile.id,
              created_at: profile.created_at,
              full_name: profile.full_name,
              email: profile.email,
              status: profile.status,
              plan_end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString()
            };
          }
        });
        
        // Filtrar revendedores pendientes
        pendingResellersData = resellersData.filter(r => r.status === 'pending');
        
        console.log('Datos combinados de revendedores:', { 
          total: resellersData.length,
          activos: resellersData.filter(r => r.status === 'active').length,
          pendientes: pendingResellersData.length
        });
      }

      // Obtener últimos 5 revendedores registrados combinando datos de profiles y resellers
      console.log('Obteniendo revendedores recientes...');
      try {
        // Primero obtener perfiles recientes con rol 'reseller'
        const { data: recentProfiles, error: recentProfilesError } = await supabase
          .rpc('get_all_profiles')
          .order('created_at', { ascending: false })
          .limit(10); // Obtenemos más para filtrar
        
        console.log('Perfiles recientes obtenidos:', { 
          count: recentProfiles?.length || 0, 
          error: recentProfilesError ? recentProfilesError.message : null 
        });
        
        if (recentProfilesError) {
          console.error('Error al obtener perfiles recientes:', recentProfilesError);
          recentResellers = [];
        } else {
          // Filtrar solo los perfiles con rol 'reseller'
          const resellerProfiles = recentProfiles?.filter(p => p.role === 'reseller') || [];
          console.log(`Encontrados ${resellerProfiles.length} perfiles de revendedores recientes`);
          
          // Obtener datos detallados de la tabla resellers para estos perfiles
          const resellerIds = resellerProfiles.map(p => p.id);
          const { data: resellerDetails, error: detailsError } = await supabase
            .from('resellers')
            .select('*')
            .in('id', resellerIds);
          
          console.log('Detalles de revendedores recientes:', { 
            count: resellerDetails?.length || 0, 
            error: detailsError ? detailsError.message : null 
          });
          
          // Combinar datos de ambas fuentes
          recentResellers = resellerProfiles.map(profile => {
            // Buscar datos correspondientes en la tabla resellers
            const resellerData = resellerDetails?.find(r => 
              r.id === profile.id || r.user_id === profile.id
            );
            
            if (resellerData) {
              // Si encontramos datos en resellers, combinarlos con el perfil
              return {
                ...resellerData,
                full_name: profile.full_name || resellerData.full_name,
                email: profile.email,
                status: profile.status // Usar el estado del perfil como fuente de verdad
              };
            } else {
              // Si no hay datos en resellers, crear un objeto con datos básicos
              return {
                id: profile.id,
                user_id: profile.id,
                created_at: profile.created_at,
                full_name: profile.full_name,
                email: profile.email,
                status: profile.status,
              };
            }
          });
          
          // Limitar a los 5 más recientes
          recentResellers = recentResellers.slice(0, 5);
          console.log(`Devolviendo ${recentResellers.length} revendedores recientes combinados`);
        }
      } catch (recentError) {
        console.error('Error al obtener revendedores recientes:', recentError);
        recentResellers = [];
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      // Si hay un error, continuamos con datos vacíos
      resellersData = [];
      recentResellers = [];
    }

    // Obtener estadísticas de clientes (cuando implementemos la tabla de clientes)
    const clientsStats: {
      total: number;
      active: number;
      pending: number;
      recentRegistrations: Array<{
        id: string;
        full_name: string;
        reseller_name: string;
        status: string;
        created_at: string;
      }>;
    } = {
      total: 0,
      active: 0,
      pending: 0,
      recentRegistrations: []
    };

    // Obtener alertas del sistema
    const now = new Date();
    const alerts: Alert[] = [];
    const processedUserIds = new Set<string>(); // Para evitar duplicados

    // Agregar alertas para usuarios pendientes de activación
    console.log('Datos de revendedores pendientes:', pendingResellersData);
    
    // Usar un enfoque más directo para obtener usuarios pendientes
    try {
      // Intentar usar una consulta SQL directa para obtener usuarios pendientes
      // Esta consulta ignora las políticas RLS y obtiene todos los usuarios pendientes
      const { data: pendingUsers, error: pendingUsersError } = await supabase
        .rpc('get_pending_users');
        
      console.log('Usuarios pendientes encontrados con RPC:', pendingUsers, 'Error:', pendingUsersError);
      
      // Si la función RPC no existe o hay un error, intentar con un enfoque alternativo
      if (pendingUsersError) {
        console.log('Error con RPC, intentando enfoque alternativo');
        
        // Intentar obtener perfiles pendientes directamente
        const { data: pendingProfiles, error: pendingProfilesError } = await supabase
          .from('profiles')
          .select('id, full_name, status')
          .eq('status', 'pending');
          
        console.log('Perfiles pendientes encontrados directamente:', pendingProfiles, 'Error:', pendingProfilesError);
        
        if (!pendingProfilesError && pendingProfiles && pendingProfiles.length > 0) {
          for (const profile of pendingProfiles) {
            // Evitar duplicados
            if (processedUserIds.has(profile.id)) continue;
            processedUserIds.add(profile.id);
            
            console.log('Agregando alerta para perfil pendiente:', profile);
            alerts.push({
              id: `pending-${profile.id}`,
              type: 'demo',
              title: 'Usuario Pendiente de Activación',
              message: `${profile.full_name} está pendiente de activación.`,
              severity: 'high',
              timestamp: new Date().toISOString()
            });
          }
        }
      } else if (pendingUsers && pendingUsers.length > 0) {
        // Usar los datos de la función RPC
        for (const user of pendingUsers) {
          // Evitar duplicados
          if (processedUserIds.has(user.id)) continue;
          processedUserIds.add(user.id);
          
          console.log('Agregando alerta para usuario pendiente de RPC:', user);
          alerts.push({
            id: `pending-${user.id}`,
            type: 'demo',
            title: 'Usuario Pendiente de Activación',
            message: `${user.full_name || user.email} está pendiente de activación.`,
            severity: 'high',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Usar también los revendedores pendientes que encontramos antes, pero solo si no se han procesado ya
      for (const reseller of pendingResellersData) {
        // Evitar duplicados
        if (processedUserIds.has(reseller.id)) continue;
        processedUserIds.add(reseller.id);
        
        console.log('Agregando alerta para revendedor pendiente:', reseller);
        alerts.push({
          id: `pending-${reseller.id}`,
          type: 'demo',
          title: 'Usuario Pendiente de Activación',
          message: `${reseller.full_name} está pendiente de activación.`,
          severity: 'high',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error al buscar usuarios pendientes:', error);
    }
    
    console.log('Alertas generadas:', alerts);

    // Procesar revendedores por vencer
    const expiringResellers = resellersData.filter(r => {
      if (!r || !r.plan_end_date) return false;
      try {
        const endDate = new Date(r.plan_end_date);
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 5 && daysUntilExpiry > 0;
      } catch (error) {
        console.error('Error al procesar fecha de vencimiento:', error);
        return false;
      }
    });

    for (const reseller of expiringResellers) {
      try {
        // Asegurarse de que plan_end_date existe (ya lo verificamos en el filtro anterior)
        const endDate = new Date(reseller.plan_end_date as string);
        
        alerts.push({
          id: `expiring-${reseller.id}`,
          type: 'expiring',
          title: 'Suscripción Próxima a Vencer',
          message: `La suscripción de ${reseller.full_name} vence en ${endDate.toLocaleDateString()}.`,
          severity: 'medium',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error al crear alerta para revendedor:', error);
      }
    }

    // Obtener actividad reciente
    let recentActivity: Activity[] = [];

    // Estado de los servicios (mock data por ahora)
    const services: ServiceStatus[] = [
      {
        id: 'main-server',
        name: 'Servidor Principal',
        status: 'operational',
        latency: 45,
        lastChecked: new Date().toISOString()
      },
      {
        id: 'backup-server',
        name: 'Servidor de Respaldo',
        status: 'operational',
        latency: 62,
        lastChecked: new Date().toISOString()
      },
      {
        id: 'cdn-server',
        name: 'Red de Distribución',
        status: 'operational',
        latency: 28,
        lastChecked: new Date().toISOString()
      }
    ];

    // Incidencias activas (mock data por ahora)
    const incidents: Incident[] = [];

    // Procesar activaciones y cambios de estado recientes
    console.log('Generando actividad reciente para revendedores:', recentResellers);
    
    // Primero, agregar todos los revendedores recientes como registros nuevos
    for (const reseller of recentResellers) {
      // Agregar entrada para nuevo registro
      recentActivity.push({
        id: `registration-${reseller.id}`,
        type: 'activation', // Usamos el mismo tipo para mantener consistencia visual
        title: 'Nuevo Registro',
        description: `${reseller.full_name} se registró como revendedor`,
        timestamp: reseller.created_at,
        metadata: {
          resellerName: reseller.full_name
        }
      });
      
      // Si además está activo, agregar entrada de activación
      if (reseller.status === 'active') {
        recentActivity.push({
          id: `activation-${reseller.id}`,
          type: 'activation',
          title: 'Cuenta Activada',
          description: `Se activó la cuenta de ${reseller.full_name}`,
          timestamp: reseller.created_at,
          metadata: {
            resellerName: reseller.full_name
          }
        });
      }
    }
    
    // Ordenar por timestamp más reciente
    recentActivity.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Limitar a 5 actividades más recientes
    const limitedActivity = recentActivity.slice(0, 5);
    
    console.log(`Generadas ${limitedActivity.length} actividades recientes`);
    
    // Asignar las actividades limitadas de vuelta a recentActivity
    recentActivity = limitedActivity;

    // Calcular revendedores por vencer (5 días) y vencidos
    // Usamos la misma variable 'now' que ya se declaró anteriormente
    const expiringSoonResellers = resellersData.filter(r => {
      if (!r || !r.plan_end_date || r.status !== 'active') return false;
      try {
        const endDate = new Date(r.plan_end_date);
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 5 && daysUntilExpiry > 0;
      } catch (error) {
        console.error('Error al procesar fecha de vencimiento:', error);
        return false;
      }
    });
    
    const expiredResellers = resellersData.filter(r => {
      if (!r || !r.plan_end_date || r.status !== 'active') return false;
      try {
        const endDate = new Date(r.plan_end_date);
        return endDate < now;
      } catch (error) {
        console.error('Error al procesar fecha de vencimiento:', error);
        return false;
      }
    });
    
    console.log(`Revendedores por vencer (5 días): ${expiringSoonResellers.length}`);
    console.log(`Revendedores vencidos: ${expiredResellers.length}`);
    
    // Para clientes (cuando implementemos la tabla de clientes)
    // Por ahora, usamos valores simulados
    const expiringSoonClients = 0;
    const expiredClients = 0;
    
    // Asegurarse de que todos los campos estén presentes y con valores válidos
    const result = {
      resellers: {
        total: resellersData.length || 0,
        active: resellersData.filter(r => r.status === 'active').length || 0,
        pending: resellersData.filter(r => r.status === 'pending').length || 0,
        expiringSoon: expiringSoonResellers.length || 0,
        expired: expiredResellers.length || 0,
        recentRegistrations: recentResellers.map((r) => ({
          id: r.id || '',
          full_name: r.full_name || 'Sin nombre',
          status: r.status || 'pending',
          created_at: r.created_at || new Date().toISOString()
        }))
      },
      clients: {
        ...clientsStats,
        expiringSoon: expiringSoonClients,
        expired: expiredClients
      },
      alerts,
      recentActivity,
      services,
      incidents
    };
    
    console.log('Estadísticas finales a devolver:', result);
    return result;
  }
};
