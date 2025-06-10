import { supabase } from '../lib/supabase';
import type { Template, NewTemplate } from '../types/template.types';

const DEFAULT_TEMPLATES = [
  {
    name: 'Mensaje de Bienvenida',
    content: 'Hola {cliente}, Gracias por adquirir el servicio {plataforma}. Aquí están tus credenciales:\n\nUSUARIO: {usuario}\nCONTRASEÑA: {contraseña}\nVencimiento: {fecha_fin}.\n\nPara una mejor experiencia NO COMPARTIR TU ACCESO'
  },
  {
    name: 'Recordatorio de Vencimiento',
    content: 'Buen día estimad@ {cliente}. Te recuerdo que tu servicio {plataforma} vence {dias_restantes}. Vence en {fecha_fin}. Agradecemos tu preferencia, Nos confirma su renovación para seguir brindándote nuestros servicios.'
  }
];

const handleSupabaseError = (error: any) => {
  console.error('Error de Supabase:', error);
  if (error.message?.includes('does not exist')) {
    throw new Error('La tabla templates no existe en la base de datos. Por favor, crea la tabla primero.');
  }
  throw new Error(`Error de Supabase: ${error.message} (${error.code})`);
};

export const templateService = {
  async initializeDefaultTemplates() {
    try {
      // Verificar si ya existen plantillas
      const { data: existingTemplates, error: checkError } = await supabase
        .from('templates')
        .select('*');

      if (checkError) {
        handleSupabaseError(checkError);
      }

      console.log('Verificación de plantillas:', { existingTemplates });

      if (!existingTemplates || existingTemplates.length === 0) {
        // Si no hay plantillas, crear las predeterminadas
        const { error: insertError } = await supabase
          .from('templates')
          .insert(DEFAULT_TEMPLATES);

        if (insertError) {
          handleSupabaseError(insertError);
        }

        console.log('Plantillas predeterminadas creadas');
      }
    } catch (error: any) {
      console.error('Error al inicializar plantillas:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      console.log('Plantillas obtenidas:', data);
      return data as Template[];
    } catch (error: any) {
      console.error('Error al obtener plantillas:', error);
      throw error;
    }
  },

  async create(template: NewTemplate) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert([template])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data as Template;
    } catch (error: any) {
      console.error('Error al crear plantilla:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Template>) {
    try {
      // Obtener la plantilla original
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;
      if (!template) throw new Error('Plantilla no encontrada');

      // Protección: no permitir cambiar el nombre de plantillas prediseñadas
      // Si en el futuro se requiere control por rol de usuario, agregar aquí la lógica de admin.
      if (
        (template.name === 'Mensaje de Bienvenida' || template.name === 'Recordatorio de Vencimiento') &&
        updates.name && updates.name !== template.name
      ) {
        throw new Error('No se puede cambiar el nombre de las plantillas prediseñadas. Solo puedes editar el contenido.');
      }

      // Permitir actualizar el contenido y otros campos (menos el nombre si es prediseñada)
      const safeUpdates = { ...updates };
      if (
        template.name === 'Mensaje de Bienvenida' || template.name === 'Recordatorio de Vencimiento'
      ) {
        delete safeUpdates.name;
      }

      const { data, error } = await supabase
        .from('templates')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data as Template;
    } catch (error: any) {
      console.error('Error al actualizar plantilla:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      // Primero verificar si es una plantilla del sistema
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!template) throw new Error('Plantilla no encontrada');

      // Protección reforzada: ningún revendedor puede eliminar plantillas prediseñadas.
      // Si en el futuro se requiere control por rol de usuario, agregar aquí la lógica de admin.
      if (template.name === 'Mensaje de Bienvenida' || template.name === 'Recordatorio de Vencimiento') {
        throw new Error('No se pueden eliminar las plantillas prediseñadas. Estas sirven como ejemplo y solo el administrador podría eliminarlas.');
      }

      // Si no es una plantilla del sistema, proceder con la eliminación
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error al eliminar la plantilla:', error);
      throw error;
    }
  }
};
