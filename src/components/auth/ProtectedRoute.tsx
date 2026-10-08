import React, { ReactNode } from 'react';
import { PinModal } from './PinModal';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isPinModalOpen: boolean;
  onPinSuccess: () => void;
  onPinCancel: () => void;
  children: ReactNode;
}

/**
 * Componente de protección para rutas exclusivas de docentes (/hash).
 * Intercepta cualquier intento de acceso directo sin autenticación y
 * despliega el modal de validación por PIN.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  isPinModalOpen,
  onPinSuccess,
  onPinCancel,
  children,
}) => {
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] flex flex-col items-center justify-center p-4 text-[var(--text-muted)]">
      <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 animate-pulse mb-3">
        <span className="font-mono font-bold text-lg">λ</span>
      </div>
      <p className="text-xs font-mono">Acceso Docente Protegido • PseudoPaz</p>

      <PinModal
        isOpen={isPinModalOpen}
        onClose={onPinCancel}
        onSuccess={onPinSuccess}
      />
    </div>
  );
};
