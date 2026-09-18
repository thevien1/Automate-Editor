import React from 'react';
import { ActionPropsCommon } from '../types';
import { VariableInput } from '../../../common/VariableInput';
import { CommonActionFooter } from '../CommonActionFooter';

export const SelectDropdownProps: React.FC<ActionPropsCommon> = ({
  actionNode,
  getRawVal,
  handleRawInputByKey,
  updateNode,
}) => {
  return (
    <div className="space-y-4">
      {/* XPath */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          XPath
        </label>
        <VariableInput
          value={actionNode.element_xpath || ''}
          onChange={(val) => updateNode(actionNode.id, { element_xpath: val })}
          placeholder=""
        />
      </div>

      {/* Select text */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Select text
        </label>
        <VariableInput
          value={getRawVal('SELECT_TEXT')}
          onChange={(val) => handleRawInputByKey('SELECT_TEXT', val)}
          placeholder=""
        />
      </div>

      <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
    </div>
  );
};
