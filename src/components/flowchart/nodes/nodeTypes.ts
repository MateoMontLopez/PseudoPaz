export interface FlowchartNodeData extends Record<string, unknown> {
  label: string;
  subType?: 'start' | 'end';
}
