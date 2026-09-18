import React from 'react';
import { ActionPropsCommon } from '../types';
import { VariableInput } from '../../../common/VariableInput';
import { CommonActionFooter } from '../CommonActionFooter';

export const KeyPressProps: React.FC<ActionPropsCommon> = ({
  actionNode,
  getRawVal,
  handleRawInputByKey,
  updateNode,
}) => {
  const rawType = getRawVal('TYPE', 'Combo key');
  const keyPressType =
    rawType === 'Single' || rawType === 'Single key'
      ? 'Single key'
      : rawType === 'Text'
      ? 'Text'
      : 'Combo key';

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

      {/* Type */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Type
        </label>
        <div className="relative">
          <select
            value={keyPressType}
            onChange={(e) => handleRawInputByKey('TYPE', e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none cursor-pointer appearance-none pr-8"
          >
            <option value="Single key">Single key</option>
            <option value="Combo key">Combo key</option>
            <option value="Text">Text</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
            ▾
          </div>
        </div>
      </div>

      {/* Key */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          {keyPressType === 'Text' ? 'Text' : 'Key'}
        </label>
        <VariableInput
          value={getRawVal('KEY', '')}
          onChange={(val) => handleRawInputByKey('KEY', val)}
          placeholder=""
        />
      </div>

      {/* Delay each character */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5 leading-snug">
          Delay each character (ms). Enter -1 if you want to use emojis with character errors
        </label>
        <VariableInput
          value={getRawVal('DELAY_PRESS', '') || getRawVal('DELAY_EACH_CHAR', '')}
          onChange={(val) => handleRawInputByKey('DELAY_PRESS', val)}
          placeholder=""
        />
      </div>

      <CommonActionFooter
        actionNode={actionNode}
        updateNode={updateNode}
        delayLabel="Delay after completion (ms) [min,max]"
        defaultDelay="1000,2000"
      />
    </div>
  );
};
