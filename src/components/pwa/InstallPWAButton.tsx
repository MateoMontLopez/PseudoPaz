import React from 'react';
import { Download, WifiOff } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const InstallPWAButton: React.FC = () => {
  const { isInstallable, isInstalled, isOnline, promptInstall } = usePWAInstall();

  return (
    <div className="flex items-center space-x-2">
      {/* Indicador de Modo Offline cuando se pierde la conexión de red */}
      {!isOnline && (
        <span
          title="Sin conexión a internet. La aplicación, el compilador y el exportador siguen funcionando 100% de forma local."
          className="flex items-center space-x-1 px-2 py-0.5 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded text-[11px] font-mono select-none animate-pulse"
        >
          <WifiOff className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">Modo Offline</span>
        </span>
      )}

      {/* Botón de Instalación PWA (se oculta automáticamente si ya está instalada) */}
      {isInstallable && !isInstalled && (
        <button
          onClick={() => void promptInstall()}
          title="Instalar aplicación en tu dispositivo para uso de escritorio y soporte offline"
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/50 rounded-md text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer select-none"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Instalar App</span>
        </button>
      )}
    </div>
  );
};
