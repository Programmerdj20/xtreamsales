import React from 'react';
import { useState, useEffect } from 'react';
import { templateService } from '../services/templates';
import { AVAILABLE_PLACEHOLDERS } from '../types/template.types';
import type { Template } from '../types/template.types';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<{ id?: string; name: string; content: string }>({ name: '', content: '' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const data = await templateService.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error al cargar las plantillas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await templateService.initializeDefaultTemplates();
        await fetchTemplates();
      } catch (error) {
        console.error('Error initializing templates:', error);
        toast.error('Error al cargar las plantillas');
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate.id) {
        // Actualizar plantilla existente
        await templateService.update(editingTemplate.id, {
          name: editingTemplate.name,
          content: editingTemplate.content
        });
        toast.success('Plantilla actualizada exitosamente');
      } else {
        // Crear nueva plantilla
        await templateService.create(editingTemplate);
        toast.success('Plantilla creada exitosamente');
      }
      setEditingTemplate({ name: '', content: '' }); // Limpiar formulario
      fetchTemplates();
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      toast.error('Error al guardar la plantilla');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    
    try {
      await templateService.delete(id);
      toast.success('Plantilla eliminada exitosamente');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar la plantilla');
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    setNewTemplate(prev => ({
      ...prev,
      content: prev.content + `{${placeholder}}`
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-6">Gestión de Plantillas WhatsApp</h1>

      {/* Formulario de Nueva Plantilla */}
      <div className="bg-[#1a1d24] rounded-xl border border-border/10 p-6">
        <h2 className="text-lg font-medium mb-4">Crear Nueva Plantilla</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Define un nuevo mensaje predefinido.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {editingTemplate.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </label>
            <input
              type="text"
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Recordatorio urgente"
              className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Contenido del Mensaje
            </label>
            <textarea
              value={editingTemplate.content}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Escribe tu mensaje aquí. Usa {variables} para placeholders como {cliente}, {plataforma}, etc."
              className="w-full h-32 bg-background/50 border border-border/10 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Placeholders disponibles
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PLACEHOLDERS.map(({ key, description }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertPlaceholder(key)}
                  className="px-2 py-1 text-xs rounded-md bg-[#00A8FF]/10 text-[#00A8FF] hover:bg-[#00A8FF]/20 transition-colors"
                  title={description}
                >
                  {`{${key}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            {editingTemplate.id && (
              <button
                type="button"
                onClick={() => setEditingTemplate({ name: '', content: '' })}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancelar Edición
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white"
            >
              {editingTemplate.id ? 'Guardar Cambios' : 'Agregar Plantilla'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Plantillas */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Plantillas Existentes</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              Cargando plantillas...
            </div>
          ) : templates.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              No hay plantillas creadas.
            </div>
          ) : (
            templates.map((template) => (
              <div 
                key={template.id}
                className="bg-[#1a1d24] rounded-xl border border-border/10 p-6 relative group"
              >
                <div className="flex justify-end gap-2 mb-4">
                  <button
                    onClick={() => setEditingTemplate({
                      id: template.id,
                      name: template.name,
                      content: template.content
                    })}
                    className="p-1.5 rounded-md hover:bg-[#00A8FF]/20 text-[#00A8FF] hover:text-[#00A8FF] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/20 text-red-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-medium mb-3 text-[#00A8FF]">{template.name}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {template.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
