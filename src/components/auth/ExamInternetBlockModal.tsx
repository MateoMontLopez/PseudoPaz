import React from 'react';
import { WifiOff, ShieldAlert, Radio, KeyRound } from 'lucide-react';

interface ExamInternetBlockModalProps {
  isOpen: boolean;
  onRequestTeacherExit?: () => void;
}

export const ExamInternetBlockModal: React.FC<ExamInternetBlockModalProps> = ({
  isOpen,
  onRequestTeacherExit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="internet-block-title"
      aria-describedby="internet-block-desc"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border-2 border-rose-500/60 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden text-[var(--text-primary)]">
        {/* Glow decorativo de alta prioridad en rojo / rosa */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera de Alerta de Seguridad */}
        <div className="flex items-start space-x-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0 shadow-lg shadow-rose-950/30">
            <WifiOff className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-md">
                Protocolo Anti-Fraude
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                Modo Examen
              </span>
            </div>
            <h2
              id="internet-block-title"
              className="text-lg font-bold text-[var(--text-primary)] mt-1 leading-snug"
            >
              Conexión a Internet Detectada
            </h2>
          </div>
        </div>

        {/* Mensaje explicativo */}
        <div className="space-y-3.5 text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
          <p id="internet-block-desc" className="text-[13px] text-[var(--text-primary)] font-medium">
            Para garantizar la integridad académica, el <strong>Modo Examen</strong> requiere que este equipo trabaje completamente <strong>desconectado de la red</strong>.
          </p>

          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 space-y-2">
            <p className="font-semibold text-rose-300 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-400 shrink-0" />
              Instrucciones obligatorias para desbloquear:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11.5px] text-rose-200/90 pl-1">
              <li>Desactive el <strong>Wi-Fi</strong> en su computador o tableta.</li>
              <li>Desconecte cables de red (Ethernet) o puntos de acceso móviles.</li>
              <li>O active el <strong>Modo Avión</strong> en los ajustes del sistema.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] text-[11.5px]">
            <span className="text-[var(--text-muted)] flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              Estado de Red: <strong>Conectado a Internet</strong>
            </span>
            <span className="text-amber-400 font-mono text-[10.5px]">
              Detección en tiempo real activa
            </span>
          </div>

          <p className="text-[11px] text-[var(--text-muted)] italic text-center">
            El entorno de trabajo se desbloqueará automáticamente al detectar la desconexión total.
          </p>
        </div>

        {/* Botón de contingencia para el docente */}
        {onRequestTeacherExit && (
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">
              ¿Problemas de configuración?
            </span>
            <button
              type="button"
              onClick={onRequestTeacherExit}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Autorización Docente</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
