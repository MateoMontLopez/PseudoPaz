import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, AlertCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const EXPECTED_PIN = (import.meta.env.VITE_DOCENTE_PIN as string) || '1234';

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.trim() === EXPECTED_PIN) {
      sessionStorage.setItem('pseudopaz_teacher_auth', 'true');
      onSuccess();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden text-[var(--text-primary)] transition-all">
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          title="Cancelar y volver"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera del modal */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 dark:text-sky-400 shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              Autenticación Docente
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-full border border-sky-500/20">
                Auditor
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Acceso protegido al módulo de auditoría y verificación anti-plagio
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              PIN de Seguridad Institucional
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setError(false);
                  setPin(e.target.value);
                }}
                placeholder="••••"
                className={`w-full tracking-widest text-center text-lg font-mono font-bold px-4 py-2.5 rounded-xl bg-[var(--bg-app)] border ${
                  error
                    ? 'border-rose-500 ring-2 ring-rose-500/20 animate-shake'
                    : 'border-[var(--border-color)] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                } outline-none transition-all`}
              />
              <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Mensaje de error si el PIN falla */}
          {error && (
            <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                PIN incorrecto ({attempts} {attempts === 1 ? 'intento' : 'intentos'}). Acceso exclusivo para docentes.
              </span>
            </div>
          )}

          {/* Info aclaratoria */}
          <div className="text-[11.5px] text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl p-3 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Ingresa el PIN de seguridad asignado a los docentes de la institución para acceder a la verificación de firmas y detección de plagio.
            </span>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!pin.trim()}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-950/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <span>Ingresar al Auditor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
