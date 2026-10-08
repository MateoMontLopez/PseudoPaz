import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Eye,
  X,
  FileCode2,
  Binary,
  Download,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { DecodedPdfData, PlagiarismStatus } from '../../services/audit/hashDecoder.service';

interface AntiPlagiarismTableProps {
  documents: DecodedPdfData[];
  onClear: () => void;
}

export const AntiPlagiarismTable: React.FC<AntiPlagiarismTableProps> = ({
  documents,
  onClear,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<DecodedPdfData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estadísticas del lote analizado
  const stats = useMemo(() => {
    const total = documents.length;
    const identical = documents.filter((d) => d.status === 'identical_hash').length;
    const astCopy = documents.filter((d) => d.status === 'ast_copy').length;
    const tampered = documents.filter((d) => d.status === 'tampered').length;
    const authentic = documents.filter((d) => d.status === 'authentic').length;
    const errorCount = documents.filter((d) => d.status === 'unrecognized' || Boolean(d.error)).length;

    return { total, identical, astCopy, tampered, authentic, errorCount };
  }, [documents]);

  // Filtrado y búsqueda
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.studentName.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.course.toLowerCase().includes(q) ||
        doc.reportedSha256.toLowerCase().includes(q) ||
        doc.shortId.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [documents, filterStatus, searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: PlagiarismStatus) => {
    switch (status) {
      case 'identical_hash':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            🔴 Plagio 100% (Hash Idéntico)
          </span>
        );
      case 'ast_copy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            🟡 Copia Sintáctica (AST Coincidente)
          </span>
        );
      case 'tampered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            ⚠️ Documento Alterado / Firma Inválida
          </span>
        );
      case 'authentic':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            🟢 Documento Auténtico / Único
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <HelpCircle className="w-3.5 h-3.5" />
            Formato No Reconocido
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Tarjetas de Resumen Estadístico */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total */}
        <div
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-2xl bg-[var(--bg-surface)] border transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'border-sky-500 ring-2 ring-sky-500/20'
              : 'border-[var(--border-color)] hover:border-sky-500/40'
          }`}
        >
          <div className="text-xs font-medium text-[var(--text-secondary)]">Total Analizados</div>
          <div className="mt-1 text-2xl font-black text-[var(--text-primary)] font-mono">
            {stats.total}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">Entregas en lote</div>
        </div>

        {/* 🔴 Plagio 100% */}
        <div
          onClick={() => setFilterStatus('identical_hash')}
          className={`p-4 rounded-2xl bg-[var(--bg-surface)] border transition-all cursor-pointer ${
            filterStatus === 'identical_hash'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-[var(--border-color)] hover:border-rose-500/40'
          }`}
        >
          <div className="text-xs font-medium text-rose-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Plagio 100%
          </div>
          <div className="mt-1 text-2xl font-black text-rose-500 font-mono">
            {stats.identical}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">Hash SHA-256 duplicado</div>
        </div>

        {/* 🟡 Copia Sintáctica */}
        <div
          onClick={() => setFilterStatus('ast_copy')}
          className={`p-4 rounded-2xl bg-[var(--bg-surface)] border transition-all cursor-pointer ${
            filterStatus === 'ast_copy'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-[var(--border-color)] hover:border-amber-500/40'
          }`}
        >
          <div className="text-xs font-medium text-amber-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Copia Sintáctica
          </div>
          <div className="mt-1 text-2xl font-black text-amber-500 font-mono">
            {stats.astCopy}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">AST lógico idéntico</div>
        </div>

        {/* ⚠️ Alterados */}
        <div
          onClick={() => setFilterStatus('tampered')}
          className={`p-4 rounded-2xl bg-[var(--bg-surface)] border transition-all cursor-pointer ${
            filterStatus === 'tampered'
              ? 'border-orange-500 ring-2 ring-orange-500/20'
              : 'border-[var(--border-color)] hover:border-orange-500/40'
          }`}
        >
          <div className="text-xs font-medium text-orange-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Alterados
          </div>
          <div className="mt-1 text-2xl font-black text-orange-500 font-mono">
            {stats.tampered}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">Firma no coincide</div>
        </div>

        {/* 🟢 Auténticos */}
        <div
          onClick={() => setFilterStatus('authentic')}
          className={`p-4 rounded-2xl bg-[var(--bg-surface)] border transition-all cursor-pointer ${
            filterStatus === 'authentic'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-[var(--border-color)] hover:border-emerald-500/40'
          }`}
        >
          <div className="text-xs font-medium text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Auténticos
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-500 font-mono">
            {stats.authentic}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">Firmas válidas y únicas</div>
        </div>
      </div>

      {/* 2. Barra de Filtros, Búsqueda y Limpieza */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por estudiante, curso, archivo o hash..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-sky-500 outline-none text-xs text-[var(--text-primary)] transition-all"
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          {/* Botón para exportar resumen en JSON */}
          <button
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(documents, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', dataStr);
              downloadAnchor.setAttribute('download', `auditoria_pseudopaz_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all cursor-pointer"
            title="Exportar reporte de auditoría en formato JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exportar JSON</span>
          </button>

          {/* Botón para limpiar lote */}
          <button
            onClick={onClear}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar Lote</span>
          </button>
        </div>
      </div>

      {/* 3. Tabla Interactiva */}
      <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-surface-subtle)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-4">Estado Anti-Plagio</th>
                <th className="py-3 px-4">Estudiante / Archivo</th>
                <th className="py-3 px-4">Asignatura & Curso</th>
                <th className="py-3 px-4">Digest SHA-256</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No se encontraron entregas que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    {/* Estado */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>

                    {/* Estudiante / Archivo */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[var(--text-primary)]">
                        {doc.studentName}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-[200px]" title={doc.fileName}>
                        {doc.fileName}
                      </div>
                    </td>

                    {/* Asignatura & Curso */}
                    <td className="py-3 px-4">
                      <div className="text-[var(--text-primary)] font-medium">
                        {doc.subject}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">
                        {doc.course}
                      </div>
                    </td>

                    {/* Hash SHA-256 */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sky-600 dark:text-sky-400 font-bold">
                          {doc.shortId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(doc.reportedSha256, doc.id)}
                          title="Copiar Hash SHA-256 completo"
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        >
                          {copiedId === doc.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block truncate max-w-[140px]" title={doc.reportedSha256}>
                        {doc.reportedSha256.substring(0, 16)}...
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="py-3 px-4 text-[11.5px] text-[var(--text-secondary)] whitespace-nowrap">
                      {doc.timestampIso
                        ? new Date(doc.timestampIso).toLocaleDateString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : 'N/A'}
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-sky-500 border border-[var(--border-color)] hover:border-sky-500/40 transition-all cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspeccionar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal Lateral / Detalle de Inspección de Entrega */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDoc(null);
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)]">
            {/* Cabecera del modal */}
            <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface-subtle)]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                    Inspección de Entrega: {selectedDoc.studentName}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    {selectedDoc.fileName} • {selectedDoc.course} • {selectedDoc.subject}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Badge de Estado y Detalle de Diagnóstico */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Diagnóstico del Auditor:</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {selectedDoc.statusDetails}
                  </div>
                </div>
                <div>{getStatusBadge(selectedDoc.status)}</div>
              </div>

              {/* Si hay coincidencias detectadas, mostrarlas */}
              {selectedDoc.matchedWith.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-400 mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Coincidencias Identificadas en el Lote:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {selectedDoc.matchedWith.map((m, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                        <div>
                          <strong className="text-white">{m.studentName}</strong> ({m.fileName})
                        </div>
                        <span className="text-[11px] text-rose-300 font-mono italic">
                          {m.reason}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metadatos Criptográficos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">HASH REPORTADO SHA-256</span>
                  <span className="text-sky-500 break-all">{selectedDoc.reportedSha256}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px]">HASH CALCULADO / REVERIFICADO</span>
                  <span className="text-emerald-500 break-all">{selectedDoc.computedSha256 || 'N/A'}</span>
                </div>
              </div>

              {/* Código Fuente Extraído */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-sky-500" />
                    <span>Código Fuente Extraído del PDF</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(selectedDoc.code, 'code')}
                    className="flex items-center space-x-1 text-xs text-sky-500 hover:text-sky-400 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] text-xs font-mono overflow-x-auto max-h-60 text-[var(--text-primary)]">
                  {selectedDoc.code}
                </pre>
              </div>

              {/* Firma Canónica del AST */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Binary className="w-4 h-4 text-indigo-500" />
                  <span>Firma Sintáctica Canónica (AST Serializado)</span>
                </h4>
                <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-muted)] break-all max-h-32 overflow-y-auto">
                  {selectedDoc.astSignature}
                </div>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface-subtle)] flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-all cursor-pointer"
              >
                Cerrar Inspección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
