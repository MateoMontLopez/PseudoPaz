import React from 'react';
import { ShieldCheck, Fingerprint, Lock } from 'lucide-react';
import { FingerprintResult } from '../../services/pdf/cryptoFingerprint';

interface SecurityBadgeProps {
  fingerprint: FingerprintResult | null;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  fingerprint,
}) => {
  if (!fingerprint) {
    return (
      <div className="p-3 rounded-md bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-500 font-mono flex items-center gap-2">
        <Lock className="w-3.5 h-3.5" />
        <span>Calculando huella de integridad SHA-256...</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-md bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2 select-none shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Certificación Criptográfica Anti-Plagio</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 uppercase">
          SHA-256
        </span>
      </div>

      {/* Código de Verificación e Integridad */}
      <div className="flex items-center gap-2 font-mono text-[11px] bg-zinc-950/80 p-2 rounded border border-zinc-800">
        <Fingerprint className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-zinc-400">ID de Autenticidad:</span>
        <span className="text-emerald-300 font-bold tracking-wider">{fingerprint.shortHash}</span>
      </div>

      {/* Previsualización de la Marca de Agua */}
      <div className="text-[10.5px] text-zinc-400 leading-tight">
        <span className="text-zinc-500 block text-[9.5px] uppercase font-mono mb-0.5">
          Marca de agua diagonal indeleble en cada página:
        </span>
        <span className="text-zinc-300 font-mono italic break-words">
          "{fingerprint.watermarkText}"
        </span>
      </div>

      <p className="text-[10px] text-zinc-500 border-t border-emerald-900/30 pt-1.5 leading-snug">
        🔒 Si otro estudiante intenta modificar o reutilizar este documento, el hash y la marca de agua delatarán la copia.
      </p>
    </div>
  );
};
