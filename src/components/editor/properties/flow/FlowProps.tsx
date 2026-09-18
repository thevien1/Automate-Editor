import React from 'react';
import { ActionPropsCommon } from '../types';
import { VariableInput } from '../../../common/VariableInput';
import { CommonActionFooter } from '../CommonActionFooter';

export const FlowProps: React.FC<ActionPropsCommon> = ({
  actionNode,
  getRawVal,
  handleRawInputByKey,
  updateNode,
}) => {
  const name = actionNode.display_text?.toLowerCase() || '';
  const type = actionNode.type;

  if (name === 'exit loop' || type === 5) {
    return (
      <div className="space-y-4">
        <CommonActionFooter
          actionNode={actionNode}
          updateNode={updateNode}
          delayLabel="Delay after completion (ms) [min,max]"
        />
      </div>
    );
  }

  if (name === 'next loop' || type === 6) {
    return (
      <div className="space-y-4">
        <CommonActionFooter
          actionNode={actionNode}
          updateNode={updateNode}
          delayLabel="Delay after completion (ms) [min,max]"
        />
      </div>
    );
  }

  if (name === 'stop' || type === 76) {
    return (
      <div className="space-y-4">
        <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
      </div>
    );
  }

  if (name === 'throw' || type === 117) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Message
          </label>
          <VariableInput
            value={getRawVal('MESSAGE')}
            onChange={(val) => handleRawInputByKey('MESSAGE', val)}
            placeholder=""
          />
        </div>
        <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
      </div>
    );
  }

  if (name === 'delay' || type === 7) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Min (ms)
          </label>
          <VariableInput
            value={getRawVal('MIN')}
            onChange={(val) => handleRawInputByKey('MIN', val)}
            placeholder=""
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Max (ms)
          </label>
          <VariableInput
            value={getRawVal('MAX')}
            onChange={(val) => handleRawInputByKey('MAX', val)}
            placeholder=""
          />
        </div>
        <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
      </div>
    );
  }

  return null;
};
