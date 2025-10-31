import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { templateService } from "../../services/templates";
import {
    AVAILABLE_PLACEHOLDERS,
    Template,
    TemplateCategory,
    NewTemplate,
} from "../../types/template.types";
import { useAuth } from "../../contexts/AuthContext";
import { Pencil, Trash2 } from "lucide-react";

const ResellerTemplatesPage: React.FC = () => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<Partial<Template>>({
        name: "",
        content: "",
        category: "credenciales",
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchTemplates = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await templateService.getAll(user.id);
            setTemplates(data);
        } catch (error) {
            console.error("Error fetching templates:", error);
            toast.error("Error al cargar las plantillas");
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
                console.error("Error initializing templates:", error);
                toast.error("Error al cargar las plantillas");
            }
        };
        if (user) {
            init();
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Debes iniciar sesión para guardar plantillas.");
            return;
        }
        try {
            if (editingTemplate.id) {
                await templateService.update(
                    editingTemplate.id,
                    editingTemplate,
                    user.role
                );
                toast.success("Plantilla actualizada exitosamente");
            } else {
                await templateService.create(
                    editingTemplate as NewTemplate,
                    user.id
                );
                toast.success("Plantilla creada exitosamente");
            }
            setEditingTemplate({
                name: "",
                content: "",
                category: "credenciales",
            });
            fetchTemplates();
        } catch (error) {
            console.error("Error al guardar plantilla:", error);
            toast.error(`Error al guardar la plantilla: ${error.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) {
            toast.error("Debes iniciar sesión para eliminar plantillas.");
            return;
        }
        if (!window.confirm("¿Estás seguro de eliminar esta plantilla?"))
            return;

        try {
            await templateService.delete(id, user.id, user.role);
            toast.success("Plantilla eliminada exitosamente");
            fetchTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error(`Error al eliminar la plantilla: ${error.message}`);
        }
    };

    const insertPlaceholder = (placeholder: string) => {
        setEditingTemplate((prev) => ({
            ...prev,
            content: (prev.content || "") + `{${placeholder}}`,
        }));
    };

    const isSystemTemplate = (template: Template) => template.owner_id === null;

    return (
        <div className="space-y-6 p-4">
            <h1 className="text-2xl font-semibold mb-6">
                Gestión de Plantillas de WhatsApp
            </h1>

            <div className="bg-[#1a1d24] rounded-xl border border-border/10 p-6">
                <h2 className="text-lg font-medium mb-4">
                    {editingTemplate.id
                        ? "Editar Plantilla"
                        : "Crear Nueva Plantilla"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Nombre de la Plantilla
                        </label>
                        <input
                            type="text"
                            value={editingTemplate.name || ""}
                            onChange={(e) =>
                                setEditingTemplate((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder="Ej: Recordatorio urgente"
                            className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
                            required
                            disabled={
                                !!editingTemplate.id &&
                                isSystemTemplate(
                                    templates.find(
                                        (t) => t.id === editingTemplate.id
                                    )!
                                )
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Categoría</label>
                        <select
                            value={editingTemplate.category || "credenciales"}
                            onChange={(e) =>
                                setEditingTemplate((prev) => ({
                                    ...prev,
                                    category: e.target
                                        .value as TemplateCategory,
                                }))
                            }
                            className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
                            required
                        >
                            <option value="credenciales">Credenciales</option>
                            <option value="recordatorio">Recordatorio</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Contenido del Mensaje
                        </label>
                        <textarea
                            value={editingTemplate.content || ""}
                            onChange={(e) =>
                                setEditingTemplate((prev) => ({
                                    ...prev,
                                    content: e.target.value,
                                }))
                            }
                            placeholder="Escribe tu mensaje aquí..."
                            className="w-full h-32 bg-background/50 border border-border/10 rounded-lg px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-2">
                            Placeholders disponibles
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_PLACEHOLDERS.map(
                                ({ key, description }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => insertPlaceholder(key)}
                                        className="px-2 py-1 text-xs rounded-md bg-[#00A8FF]/10 text-[#00A8FF] hover:bg-[#00A8FF]/20 transition-colors"
                                        title={description}
                                    >
                                        {`{${key}}`}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        {editingTemplate.id && (
                            <button
                                type="button"
                                onClick={() =>
                                    setEditingTemplate({
                                        name: "",
                                        content: "",
                                        category: "credenciales",
                                    })
                                }
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white"
                            >
                                Cancelar Edición
                            </button>
                        )}
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white"
                        >
                            {editingTemplate.id
                                ? "Guardar Cambios"
                                : "Agregar Plantilla"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-medium">Plantillas Existentes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {isLoading ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                            Cargando plantillas...
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                            No hay plantillas creadas.
                        </div>
                    ) : (
                        templates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-[#1a1d24] rounded-xl border border-border/10 p-6 min-h-[200px] overflow-hidden flex flex-col"
                            >
                                <div className="flex justify-end gap-2 mb-4">
                                    {!isSystemTemplate(template) && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setEditingTemplate(template)
                                                }
                                                className="p-1.5 rounded-md hover:bg-[#00A8FF]/20 text-[#00A8FF] transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(template.id)
                                                }
                                                className="p-1.5 rounded-md hover:bg-red-500/20 text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 mb-3">
                                    <h3 className="font-medium text-[#00A8FF] truncate" title={template.name}>
                                        {template.name}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span
                                            className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                                template.category === "credenciales"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-yellow-500/20 text-yellow-400"
                                            }`}
                                        >
                                            {template.category === "credenciales"
                                                ? "Credenciales"
                                                : "Recordatorio"}
                                        </span>
                                        <span
                                            className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                                isSystemTemplate(template)
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : "bg-gray-500/20 text-gray-400"
                                            }`}
                                        >
                                            {isSystemTemplate(template)
                                                ? "Sistema"
                                                : "Personal"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-border/20 scrollbar-track-transparent">
                                        {template.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResellerTemplatesPage;
