import React from 'react';
import { ActionPropsCommon } from '../types';
import { VariableInput } from '../../../common/VariableInput';
import { CommonActionFooter } from '../CommonActionFooter';

export const MouseScrollProps: React.FC<ActionPropsCommon> = ({
  actionNode,
  getRawVal,
  handleRawInputByKey,
  updateNode,
}) => {
  return (
    <div className="space-y-4">
      {/* Number of scrolls */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Number of scrolls
        </label>
        <VariableInput
          value={getRawVal('SCROLL_NUM', '')}
          onChange={(val) => handleRawInputByKey('SCROLL_NUM', val)}
          placeholder=""
        />
      </div>

      <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
    </div>
  );
};
