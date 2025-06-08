import { supabase } from '../lib/supabase';
import { resellerService } from './resellers';
import { templateService } from './templates';

const replaceVariables = (template: string, variables: Record<string, string>) => {
  return template.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = variables[key];
    return value !== undefined ? value : `{${key}}`;
  });
};

const openWhatsApp = (phone: string, message: string) => {
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
};

export const resellerActionsService = {
  async sendCredentials(resellerId: string) {
    try {
      // Obtener datos del revendedor
      const { data: reseller, error: resellerError } = await supabase
        .from('resellers')
        .select('*')
        .eq('id', resellerId)
        .single();

      if (resellerError) throw resellerError;
      if (!reseller) throw new Error('Revendedor no encontrado');

      // Obtener plantilla de bienvenida
      const templates = await templateService.getAll();
      const welcomeTemplate = templates.find(t => t.name === 'Mensaje de Bienvenida');
      if (!welcomeTemplate) throw new Error('Plantilla de bienvenida no encontrada');

      // Reemplazar variables en la plantilla
      const message = replaceVariables(welcomeTemplate.content, {
        cliente: reseller.full_name,
        plataforma: reseller.plan_type,
        usuario: reseller.email,
        contraseña: reseller.password,
        fecha_fin: new Date(reseller.plan_end_date).toLocaleDateString()
      });

      // Abrir WhatsApp
      openWhatsApp(reseller.phone, message);
    } catch (error) {
      console.error('Error al enviar credenciales:', error);
      throw error;
    }
  },

  async sendReminder(resellerId: string) {
    try {
      // Obtener datos del revendedor
      const { data: reseller, error: resellerError } = await supabase
        .from('resellers')
        .select('*')
        .eq('id', resellerId)
        .single();

      if (resellerError) throw resellerError;
      if (!reseller) throw new Error('Revendedor no encontrado');

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
        cliente: reseller.full_name,
        plataforma: reseller.plan_type,
        dias_restantes: `${daysLeft} días`,
        fecha_fin: endDate.toLocaleDateString()
      });

      // Abrir WhatsApp
      openWhatsApp(reseller.phone, message);
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      throw error;
    }
  },

  async renew(id: string, months: number) {
    try {
      console.log('Renovando plan de revendedor con RPC:', { id, months });
      
      // Usar la función RPC renew_plan para renovar el plan (función simple)
      const { data: success, error: rpcError } = await supabase
        .rpc('renew_plan', {
          reseller_id: id,
          months: months
        });
      
      if (rpcError) {
        console.error('Error al renovar plan con RPC:', rpcError);
        throw rpcError;
      }
      
      if (!success) {
        throw new Error('No se pudo renovar el plan');
      }
      
      console.log('Plan renovado correctamente');
      
      // Obtener los datos actualizados del revendedor usando update_reseller_info
      // Esta función ya ha sido probada y funciona correctamente
      const reseller = await resellerService.getById(id);
      
      return reseller;
    } catch (error) {
      console.error('Error en el proceso de renovación de plan:', error);
      throw error;
    }
  }
};
