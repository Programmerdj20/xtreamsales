import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { ClientFormData } from '../../services/clients';
import { validateCSVFile, parseCSV } from '../../lib/csvUtils';
import { formatPrice } from '../../lib/priceUtils';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (clients: ClientFormData[]) => void;
}

export function ImportCSVModal({ isOpen, onClose, onImport }: ImportCSVModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ClientFormData[]>([]);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');

  const resetModal = () => {
    setFile(null);
    setPreviewData([]);
    setError('');
    setStep('upload');
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError('');
    setIsProcessing(true);
    
    try {
      // Validar archivo
      const csvText = await validateCSVFile(selectedFile);
      
      // Parsear datos
      const parsedData = await parseCSV(csvText);
      
      setFile(selectedFile);
      setPreviewData(parsedData);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    onImport(previewData);
    setStep('success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <div className="bg-[#1a1d24] rounded-xl border border-border/10 w-[600px] max-h-[80vh] shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-border/10">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#00A8FF]" />
              <h2 className="text-lg font-medium">Importar Clientes desde CSV</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {step === 'upload' && (
              <div className="space-y-4">
                {/* Instrucciones */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-400 mb-2">Formato del archivo CSV</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    El archivo debe contener las siguientes columnas (en cualquier orden):
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Requeridos:</strong> Cliente, WhatsApp, Plataforma, Usuario, Contraseña</li>
                    <li>• <strong>Opcionales:</strong> Dispositivos, Precio, Fecha Inicio, Fecha Fin, Plan, Observación</li>
                    <li>• <strong>Formato fechas:</strong> YYYY-MM-DD (ejemplo: 2025-01-15)</li>
                    <li>• <strong>Tamaño máximo:</strong> 5MB</li>
                  </ul>
                </div>

                {/* Área de drag & drop */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-[#00A8FF] bg-[#00A8FF]/5'
                      : 'border-border/20 hover:border-border/40'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Arrastra tu archivo CSV aquí
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="inline-block bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Seleccionar Archivo
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-400">Error</p>
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Processing */}
                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-[#00A8FF] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Procesando archivo...</p>
                  </div>
                )}
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Vista previa de datos</h3>
                    <p className="text-sm text-muted-foreground">
                      Se importarán {previewData.length} clientes
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Archivo: {file?.name}
                  </div>
                </div>

                {/* Preview table */}
                <div className="max-h-60 overflow-auto border border-border/10 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Cliente</th>
                        <th className="p-2 text-left">WhatsApp</th>
                        <th className="p-2 text-left">Plataforma</th>
                        <th className="p-2 text-left">Plan</th>
                        <th className="p-2 text-left">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((client, index) => (
                        <tr key={index} className="border-b border-border/10">
                          <td className="p-2">{client.cliente}</td>
                          <td className="p-2">{client.whatsapp}</td>
                          <td className="p-2">{client.plataforma}</td>
                          <td className="p-2">{client.plan}</td>
                          <td className="p-2">${formatPrice(client.precio)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20">
                      ... y {previewData.length - 10} más
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/10">
                  <button
                    type="button"
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border/10 hover:bg-[#a855f7]/20 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white"
                  >
                    Importar {previewData.length} Clientes
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">¡Importación exitosa!</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Se han importado {previewData.length} clientes correctamente
                </p>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}