import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, KeyRound, AlertCircle, X, Check, Clock } from 'lucide-react';
import { validateDynamicExamPin } from '../../utils/dynamicPin';

interface ExamExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExamExitModal: React.FC<ExamExitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Actualizar reloj de referencia en tiempo real
  useEffect(() => {
    if (!isOpen) return;

    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${hh}:${mm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) return;

    const isValid = validateDynamicExamPin(pin);
    if (isValid) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setAttempts((prev) => prev + 1);
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-amber-500/30 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden text-[var(--text-primary)] transition-all">
        {/* Glow de fondo decorativo en tonos ámbar */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          title="Cancelar y permanecer en Modo Examen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera del modal */}
        <div className="flex items-center space-x-3.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-inner shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              Salida de Modo Examen
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-300 rounded-full border border-amber-500/30">
                Seguridad
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Se requiere validación docente para desbloquear la sesión
            </p>
          </div>
        </div>

        {/* Instrucciones de la clave dinámica por hora actual */}
        <div className="mb-4 p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              Clave Dinámica (Hora Actual)
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-3 h-3" />
              {currentTimeStr || '--:--'}
            </span>
          </div>
          <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
            Ingrese el código de 4 dígitos correspondiente (solicítelo al profesor o evaluador a cargo).
          </p>
        </div>

        {/* Formulario de ingreso de PIN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              PIN de Autorización (4 dígitos)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setError(false);
                  const sanitized = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(sanitized);
                }}
                placeholder="••••"
                className={`w-full px-4 py-2.5 bg-[var(--bg-app)] border rounded-xl font-mono text-center text-lg tracking-[0.4em] text-[var(--text-primary)] focus:outline-none transition-all placeholder:text-[var(--text-muted)] placeholder:tracking-normal ${error
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30 animate-shake'
                  : 'border-[var(--border-color)] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
              />
            </div>
            {error && (
              <div className="flex items-center space-x-1.5 mt-2 text-rose-500 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Clave dinámica incorrecta ({attempts} {attempts === 1 ? 'intento fallido' : 'intentos fallidos'}). Verifique el formato HHMM.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Desactivar Examen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
