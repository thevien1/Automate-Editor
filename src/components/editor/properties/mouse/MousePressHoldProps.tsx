import React from 'react';
import { ActionPropsCommon } from '../types';
import { VariableInput } from '../../../common/VariableInput';
import { CommonActionFooter } from '../CommonActionFooter';

export const MousePressHoldProps: React.FC<ActionPropsCommon> = ({
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
          value={actionNode.element_xpath || getRawVal('XPATH', '')}
          onChange={(val) => {
            handleRawInputByKey('XPATH', val);
            updateNode(actionNode.id, { element_xpath: val });
          }}
          placeholder=""
        />
      </div>

      {/* Position (x,y) (optional) */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5 leading-snug">
          Position (x,y) (optional). If filled in, priority will be given to getting by position instead of Xpath
        </label>
        <VariableInput
          value={getRawVal('POS', '')}
          onChange={(val) => handleRawInputByKey('POS', val)}
          placeholder=""
        />
      </div>

      <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
    </div>
  );
};
