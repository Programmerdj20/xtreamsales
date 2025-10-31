import { templateService } from './templates';
import { resellerService } from './resellers';
import { supabase } from '../lib/supabase';
import { planToMonthsAsync } from '../lib/dateUtils';
import { syncResellerStatus } from '../lib/syncUserStatus';

export const replaceVariables = (template: string, variables: Record<string, string>) => {
  return template.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = variables[key];
    return value !== undefined ? value : `{${key}}`;
  });
};

export const openWhatsApp = (phone: string, message: string) => {
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
};

export const resellerActionsService = {
  async sendCredentials(resellerId: string) {
    try {
      // Obtener datos del revendedor usando RPC para evitar restricciones de RLS en SELECT directo
      const { data: reseller, error: resellerError } = await supabase
        .rpc('get_reseller_by_id', { reseller_id: resellerId });

      if (resellerError) throw new Error('No tienes permisos para leer los datos del revendedor o hubo un error de conexión.');
      if (!reseller) throw new Error('Revendedor no encontrado');
      if (!reseller.phone) throw new Error('El revendedor no tiene teléfono registrado.');
      if (!reseller.email) throw new Error('El revendedor no tiene correo registrado.');
      if (!reseller.plan_end_date) throw new Error('El revendedor no tiene fecha de vencimiento.');

      // Obtener plantilla de bienvenida
      const templates = await templateService.getAll();
      const welcomeTemplate = templates.find(t => t.name === 'Mensaje de Bienvenida');
      if (!welcomeTemplate) throw new Error('Plantilla de bienvenida no encontrada');

      // Reemplazar variables en la plantilla
      const message = replaceVariables(welcomeTemplate.content, {
        cliente: reseller.full_name || '',
        plataforma: reseller.plan_type || '',
        usuario: reseller.email || '',
        contraseña: reseller.password || '',
        fecha_fin: reseller.plan_end_date ? new Date(reseller.plan_end_date).toLocaleDateString() : ''
      });

      if (message.includes('{')) {
        throw new Error('Faltan datos para completar el mensaje. Revisa los datos del revendedor.');
      }

      // Abrir WhatsApp
      openWhatsApp(reseller.phone, message);
    } catch (error) {
      console.error('Error al enviar credenciales:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al enviar credenciales');
    }
  },

  async sendReminder(resellerId: string) {
    try {
      // Obtener datos del revendedor usando RPC para evitar restricciones de RLS en SELECT directo
      const { data: reseller, error: resellerError } = await supabase
        .rpc('get_reseller_by_id', { reseller_id: resellerId });

      if (resellerError) throw new Error('No tienes permisos para leer los datos del revendedor o hubo un error de conexión.');
      if (!reseller) throw new Error('Revendedor no encontrado');
      if (!reseller.phone) throw new Error('El revendedor no tiene teléfono registrado.');
      if (!reseller.plan_end_date) throw new Error('El revendedor no tiene fecha de vencimiento.');
      if (!reseller.full_name) throw new Error('El revendedor no tiene nombre registrado.');

      // Obtener plantilla de recordatorio
      const templates = await templateService.getAll();
      const reminderTemplate = templates.find(t => t.name === 'Recordatorio de Vencimiento');
      if (!reminderTemplate) throw new Error('Plantilla de recordatorio no encontrada');

      // Calcular días restantes
      const endDate = new Date(reseller.plan_end_date);
      const today = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Reemplazar variables en la plantilla
      const message = replaceVariables(reminderTemplate.content, {
        cliente: reseller.full_name || '',
        plataforma: reseller.plan_type || '',
        dias_restantes: `${daysLeft} días`,
        fecha_fin: endDate.toLocaleDateString()
      });

      if (message.includes('{')) {
        throw new Error('Faltan datos para completar el mensaje. Revisa los datos del revendedor.');
      }

      // Abrir WhatsApp
      openWhatsApp(reseller.phone, message);
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al enviar recordatorio');
    }
  },

  async renew(id: string, planOrMonths: string | number) {
    try {
      // Convertir plan a meses si es string
      const months = typeof planOrMonths === 'string' ? await planToMonthsAsync(planOrMonths) : planOrMonths;
      const planName = typeof planOrMonths === 'string' ? planOrMonths : `${planOrMonths} Meses`;

      console.log('Renovando plan de revendedor con RPC:', { id, plan: planName, months });

      // Usar la función RPC renew_plan para renovar el plan (función simple)
      const { data: success, error: rpcError } = await supabase
        .rpc('renew_plan', {
          reseller_id: id,
          months: months,
          plan_name: planName
        });

      if (rpcError) {
        console.error('Error al renovar plan con RPC:', rpcError);
        throw rpcError;
      }

      if (!success) {
        throw new Error('No se pudo renovar el plan');
      }

      console.log('Plan renovado correctamente');

      // Obtener los datos actualizados del revendedor
      const reseller = await resellerService.getById(id);

      // Sincronizar automáticamente el estado entre resellers y profiles
      // Al renovar, el reseller debe quedar activo automáticamente
      if (reseller && reseller.plan_end_date) {
        try {
          console.log('Sincronizando estado después de renovación para reseller:', id);
          await syncResellerStatus(id, reseller.plan_end_date, reseller.status);
        } catch (syncError) {
          console.error('Error sincronizando estado después de renovación:', syncError);
          // No fallar la renovación por error de sincronización
        }
      }

      return reseller;
    } catch (error) {
      console.error('Error en el proceso de renovación de plan:', error);
      throw error;
    }
  }
};
