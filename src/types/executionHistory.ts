import { ConsoleOutputItem } from '../hooks/usePseudocodeRunner';

export type ExecutionStatus = 'completed' | 'error' | 'stopped';

export interface ExecutionRunRecord {
  id: string;
  runIndex: number;
  timestamp: string;
  algorithmName: string;
  codeSnapshot: string;
  durationMs: number | null;
  status: ExecutionStatus;
  inputs: string[];
  outputs: ConsoleOutputItem[];
  errorMessage?: string;
  mode: 'run' | 'step';
}
