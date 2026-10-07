export interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  isModified?: boolean;
}

export const DEFAULT_FILES: WorkspaceFile[] = [
  {
    id: 'default',
    name: 'sin_titulo.psc',
    content: `Algoritmo SinTitulo
    // Escribe tu código aquí
    
FinAlgoritmo
`,
  },
];

const STORAGE_KEY = 'pseudopaz_workspace_files_v2';

export function loadStoredFiles(): WorkspaceFile[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('No se pudieron recuperar los archivos almacenados:', err);
  }
  return DEFAULT_FILES;
}

export function saveStoredFiles(files: WorkspaceFile[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    }
  } catch (err) {
    console.warn('No se pudieron guardar los archivos en el almacenamiento:', err);
  }
}
