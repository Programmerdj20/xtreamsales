import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { authService } from "../../services/auth";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import "../../styles/phone-input.css";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePassword = (password: string): string | null => {
        if (password.length < 6) {
            return "La contraseña debe tener al menos 6 caracteres";
        }
        return null;
    };

    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Ya no cerramos el modal automáticamente, ahora esperamos a que el usuario haga clic en Aceptar
    const handleSuccessConfirm = () => {
        // Solo cerramos el modal sin redireccionar ni iniciar sesión
        setRegistrationSuccess(false); // Resetear el estado de éxito
        onClose();
        // Limpiar cualquier estado residual
        setEmail("");
        setPassword("");
        setFullName("");
        setPhone("");
        setErrorMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        // Validar contraseña
        const passwordError = validatePassword(password);
        if (passwordError) {
            setErrorMessage(passwordError);
            return;
        }

        // Validar email
        if (!email.includes("@") || !email.includes(".")) {
            setErrorMessage("Por favor ingresa un correo electrónico válido");
            return;
        }

        // Validar teléfono (opcional pero recomendado)
        if (phone && !/^[0-9+\s()-]{7,15}$/.test(phone)) {
            setErrorMessage("Por favor ingresa un número de teléfono válido");
            return;
        }

        setLoading(true);

        try {
            await authService.register(email, password, fullName, phone);

            // Limpiar el formulario
            setEmail("");
            setPassword("");
            setFullName("");
            setPhone("");

            // Mostrar mensaje de éxito
            setRegistrationSuccess(true);
            toast.success(
                "Cuenta creada exitosamente. A la espera de activación por el administrador."
            );
        } catch (error: any) {
            const message = error.message || "Error al crear la cuenta";

            if (message.includes("ya está registrado")) {
                setErrorMessage("El correo electrónico ya está registrado");
                toast.error("El correo electrónico ya está registrado");
            } else if (message.includes("permission denied")) {
                // Si el usuario se creó pero hubo un error con los permisos, es éxito
                setEmail("");
                setPassword("");
                setRegistrationSuccess(true);
                toast.success(
                    "Cuenta creada exitosamente. A la espera de activación por el administrador."
                );
            } else if (message.includes("Invalid email")) {
                setErrorMessage("El correo electrónico no es válido");
                toast.error("El correo electrónico no es válido");
            } else {
                setErrorMessage(
                    "Error al crear la cuenta. Inténtalo de nuevo."
                );
                toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={registrationSuccess ? () => {} : onClose}
        >
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/xstream_logo.png"
                            alt="XtreamSales Logo"
                            className="h-12 w-auto"
                        />
                    </div>
                    <DialogTitle className="text-2xl font-bold">
                        Registrarse
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Crea una cuenta para acceder al sistema. Los
                        revendedores necesitarán aprobación del administrador.
                    </DialogDescription>
                </DialogHeader>

                {registrationSuccess ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                        <h3 className="text-xl font-semibold">
                            ¡Cuenta creada exitosamente!
                        </h3>
                        <p className="text-muted-foreground">
                            Tu cuenta está pendiente de aprobación por el
                            administrador.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Deberás esperar a que un administrador active tu
                            cuenta.
                        </p>
                        <Button
                            onClick={handleSuccessConfirm}
                            className="mt-2 bg-green-600 hover:bg-green-700"
                        >
                            Aceptar
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="fullName"
                                    className="text-right font-medium"
                                >
                                    Nombre de Usuario
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(e.target.value)
                                    }
                                    placeholder="Tu nombre de usuario"
                                    required
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="email"
                                    className="text-right font-medium"
                                >
                                    Correo Electrónico
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    required
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="phone"
                                    className="text-right font-medium"
                                >
                                    Teléfono WhatsApp
                                </Label>
                                <div className="col-span-3 relative">
                                    <div className="flex">
                                        <select
                                            className="flex h-10 w-20 rounded-l-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-r-0"
                                            defaultValue="+57"
                                        >
                                            <option value="+1">🇺🇸 +1</option>
                                            <option value="+52">🇲🇽 +52</option>
                                            <option value="+57">🇨🇴 +57</option>
                                            <option value="+54">🇦🇷 +54</option>
                                            <option value="+56">🇨🇱 +56</option>
                                            <option value="+51">🇵🇪 +51</option>
                                            <option value="+58">🇻🇪 +58</option>
                                            <option value="+55">🇧🇷 +55</option>
                                            <option value="+593">
                                                🇪🇨 +593
                                            </option>
                                            <option value="+507">
                                                🇵🇦 +507
                                            </option>
                                            <option value="+506">
                                                🇨🇷 +506
                                            </option>
                                            <option value="+503">
                                                🇸🇻 +503
                                            </option>
                                            <option value="+502">
                                                🇬🇹 +502
                                            </option>
                                            <option value="+504">
                                                🇭🇳 +504
                                            </option>
                                            <option value="+505">
                                                🇳🇮 +505
                                            </option>
                                            <option value="+34">🇪🇸 +34</option>
                                        </select>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => {
                                                // Solo permitir números
                                                const value =
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        ""
                                                    );
                                                setPhone(value);
                                            }}
                                            placeholder="300 123 4567"
                                            className="rounded-l-none border-l-0 flex-1"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="password"
                                    className="text-right font-medium"
                                >
                                    Contraseña
                                </Label>
                                <div className="col-span-3 relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="********"
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Registrando..." : "Registrarse"}
                            </Button>
                        </div>

                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-500">
                                    {errorMessage}
                                </p>
                            </div>
                        )}
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
