import React, { useEffect, useState } from "react";
import { templateService } from "../../services/templates";
import type { Template, TemplateCategory } from "../../types/template.types";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";

interface SelectTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: Template) => void;
    type: "credenciales" | "recordatorio";
}

export function SelectTemplateModal({
    isOpen,
    onClose,
    onSelect,
    type,
}: SelectTemplateModalProps) {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        templateService
            .getAll()
            .then((data) => {
                // Filtrar solo las plantillas de la categoría correspondiente
                const filteredTemplates = data.filter(
                    (template) => template.category === type
                );
                setTemplates(filteredTemplates);
            })
            .catch((error) => {
                console.error("Error al obtener plantillas:", error);
            })
            .finally(() => setLoading(false));
    }, [isOpen, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-[#1a1d24] rounded-xl border border-border/10 shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
                    Selecciona plantilla de{" "}
                    {type === "credenciales" ? "credenciales" : "recordatorio"}
                </h2>
                {loading ? (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                        Cargando plantillas...
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                        No hay plantillas disponibles.
                    </div>
                ) : (
                    <ul className="space-y-2 mb-3 sm:mb-4 max-h-[60vh] overflow-y-auto">
                        {templates.map((template) => (
                            <TemplateItem
                                key={template.id}
                                template={template}
                                onSelect={onSelect}
                                onClose={onClose}
                            />
                        ))}
                    </ul>
                )}
                <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Componente para renderizar cada plantilla
interface TemplateItemProps {
    template: Template;
    onSelect: (template: Template) => void;
    onClose: () => void;
}

function TemplateItem({ template, onSelect, onClose }: TemplateItemProps) {
    const getCategoryBadge = (category: TemplateCategory) => {
        switch (category) {
            case "credenciales":
                return (
                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                        Credenciales
                    </span>
                );
            case "recordatorio":
                return (
                    <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                        Recordatorio
                    </span>
                );
            default:
                return null;
        }
    };

    const isDefault =
        template.name === "Mensaje de Bienvenida" ||
        template.name === "Recordatorio de Vencimiento";

    return (
        <li className="border border-border/10 rounded px-3 py-2 flex items-center justify-between bg-background/60">
            <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">
                    {template.name}
                </span>
                {getCategoryBadge(template.category)}
                {isDefault && (
                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                        Por defecto
                    </span>
                )}
            </div>
            <Button
                size="sm"
                onClick={() => {
                    onSelect(template);
                    onClose();
                }}
            >
                Usar
            </Button>
        </li>
    );
}
