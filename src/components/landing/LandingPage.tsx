import React, { useEffect } from 'react';
import {
  Code2,
  Workflow,
  ShieldCheck,
  Cpu,
  ArrowRight,
  FileCheck2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface LandingPageProps {
  onEnterIDE: () => void;
  onOpenAuditor: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterIDE, onOpenAuditor }) => {
  const { toggleTheme, isDark } = useTheme();

  // Escuchar atajo de teclado global Ctrl + Shift + A para abrir el auditor docente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        onOpenAuditor();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAuditor]);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col justify-between selection:bg-sky-500/20 selection:text-sky-400 font-sans transition-colors duration-200">
      {/* 1. Header Superior de Navegación */}
      <header className="h-16 w-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between border-b border-[var(--border-color)]/60">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/40 text-sky-500 dark:text-sky-400 font-bold font-mono text-sm shadow-sm">
            λ
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
              PseudoPaz IDE
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              UNIPAZ • v2.0
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Conmutador de Tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-xs"
            title={isDark ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro'}
          >
            {isDark ? '☀️ Claro' : '🌙 Oscuro'}
          </button>

          {/* Botón rápido hacia el IDE */}
          <button
            onClick={onEnterIDE}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-sky-500/40 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <span>Ir al Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Sección Hero Principal */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 flex flex-col items-center justify-center text-center">
        {/* Badge superior */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Plataforma Académica de Algoritmia & Lógica de Programación</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl leading-[1.15] text-[var(--text-primary)]">
          Aprende Algoritmia con{' '}
          <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            Pseudocódigo y Diagramas de Flujo
          </span>
        </h1>

        {/* Descripción */}
        <p className="mt-5 text-sm sm:text-base lg:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
          Entorno interactivo con ejecución en Web Workers aislados, conversión bidireccional a diagramas DFD y certificación criptográfica SHA-256 para evaluaciones académicas seguras.
        </p>

        {/* Botón CTA Destacado */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onEnterIDE}
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl text-sm sm:text-base font-bold shadow-xl shadow-sky-950/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>🚀 Entrar al IDE de Aprendizaje</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAuditor}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-sky-500/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-2xl text-sm font-semibold transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Auditor Anti-Plagio (Docentes)</span>
          </button>
        </div>

        {/* 3. Grid de Características Principales */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full text-left">
          {/* Card 1: Pseudocódigo en Español */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-sky-500/40 transition-all hover:shadow-lg hover:shadow-sky-950/5 group">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1">
              Sintaxis en Español
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Editor CodeMirror 6 con autocompletado nativo, numeración de líneas y pestañas multi-archivo sincronizadas.
            </p>
          </div>

          {/* Card 2: Diagramas DFD */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-950/5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
              <Workflow className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1">
              Diagramas de Flujo DFD
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Lienzo interactivo impulsado por React Flow para visualizar estructuras condicionales y bucles en tiempo real.
            </p>
          </div>

          {/* Card 3: Motor Seguro Web Worker */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-emerald-500/40 transition-all hover:shadow-lg hover:shadow-emerald-950/5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1">
              Motor Web Worker Seguro
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Ejecución asíncrona fuera del hilo principal con protección contra bucles infinitos (timeout de 10s) y Soft Reset.
            </p>
          </div>

          {/* Card 4: Certificación Criptográfica */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-950/5 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1">
              Certificación SHA-256
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Exportación a PDF con firmas criptográficas, marcas de agua esteganográficas y auditoría de copias sintácticas.
            </p>
          </div>
        </div>
      </main>

      {/* 4. Footer con Enlace Discreto al Auditor Docente */}
      <footer className="w-full border-t border-[var(--border-color)]/60 bg-[var(--bg-surface-subtle)]/40 py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
            <span className="font-semibold text-[var(--text-primary)]">
              Instituto Universitario de la Paz — UNIPAZ
            </span>
            <span className="hidden sm:inline text-[var(--text-muted)]">•</span>
            <span>Escuela de Ciencias • Ingeniería Informática • Lógica y Programación</span>
          </div>

          {/* Acceso discreto para el docente y atajo */}
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-[var(--text-muted)] hidden md:inline font-mono">
              Atajo docente: <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]">Ctrl+Shift+A</kbd>
            </span>
            <button
              onClick={onOpenAuditor}
              className="flex items-center space-x-1 text-[var(--text-muted)] hover:text-sky-500 transition-colors cursor-pointer"
              title="Acceso exclusivo al panel de verificación de firmas criptográficas y detección de plagio"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal de Auditoría</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
