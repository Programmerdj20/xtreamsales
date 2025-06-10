import React, { useEffect, useState } from 'react';
import { templateService } from '../../services/templates';
import type { Template } from '../../types/template.types';
import { Button } from '../ui/button';

interface SelectTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
  type: 'credenciales' | 'recordatorio';
}

export function SelectTemplateModal({ isOpen, onClose, onSelect, type }: SelectTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    templateService.getAll()
      .then((data) => {
        setTemplates(
          data.filter(t =>
            type === 'credenciales'
              ? t.name.toLowerCase().includes('bienvenida')
              : t.name.toLowerCase().includes('recordatorio')
          )
        );
      })
      .finally(() => setLoading(false));
  }, [isOpen, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#1a1d24] rounded-xl border border-border/10 shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Selecciona plantilla de {type === 'credenciales' ? 'credenciales' : 'recordatorio'}
        </h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando plantillas...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No hay plantillas disponibles.</div>
        ) : (
          <ul className="space-y-2 mb-4">
            {templates.map((tpl) => (
              <li key={tpl.id} className="border border-border/10 rounded px-3 py-2 flex items-center justify-between bg-background/60">
                <span className="font-medium text-sm text-foreground">{tpl.name}</span>
                <Button size="sm" onClick={() => { onSelect(tpl); onClose(); }}>
                  Usar
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
