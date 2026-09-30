import React, { useEffect, useRef, useState } from 'react';
import { CornerDownLeft } from 'lucide-react';
import { DataType } from '../../engine/parser/ast';

interface ConsoleInputProps {
  variableName: string;
  expectedType: DataType;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export const ConsoleInput: React.FC<ConsoleInputProps> = ({
  variableName,
  expectedType,
  onSubmit,
  disabled = false,
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-foco inmediato cuando se habilita la solicitud de entrada
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled) return;

    onSubmit(value);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 mt-2 p-2 bg-[var(--bg-surface)] border border-sky-500/40 rounded-md font-mono text-xs shadow-inner"
    >
      <div className="flex items-center gap-1.5 shrink-0 text-sky-600 dark:text-sky-400 select-none">
        <span className="font-bold text-sky-500">?</span>
        <span>{variableName}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-300 font-sans uppercase">
          {expectedType}
        </span>
        <span className="text-[var(--text-muted)]">:</span>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={`Ingrese un valor de tipo ${expectedType}...`}
        className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:outline-none px-1"
        autoComplete="off"
        spellCheck={false}
      />

      <button
        type="submit"
        disabled={disabled}
        title="Enviar respuesta (Enter)"
        className="shrink-0 flex items-center gap-1 px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-600 dark:text-sky-300 border border-sky-500/40 rounded text-[11px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
      >
        <span>Enviar</span>
        <CornerDownLeft className="w-3 h-3" />
      </button>
    </form>
  );
};
