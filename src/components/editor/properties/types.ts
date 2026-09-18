import { ActionNode, KeyValuePair } from '../../../types/gscript';

export interface ActionPropsCommon {
  actionNode: ActionNode;
  rawInputs: KeyValuePair[];
  getRawVal: (key: string, fallback?: string) => string;
  handleRawInputByKey: (key: string, val: string) => void;
  updateNode: (id: string, updates: Partial<any>) => void;
}
