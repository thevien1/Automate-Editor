import React from 'react';
import { ActionPropsCommon } from '../types';
import { VariableInput } from '../../../common/VariableInput';
import { CommonActionFooter } from '../CommonActionFooter';

export const MouseTryClickProps: React.FC<ActionPropsCommon> = ({
  actionNode,
  getRawVal,
  handleRawInputByKey,
  updateNode,
}) => {
  const clickType = getRawVal('CLICK_TYPE', 'Click by Xpath');

  return (
    <div className="space-y-4">
      {/* Number of tries */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Number of tries
        </label>
        <input
          type="number"
          value={getRawVal('NUMBER_OF_TRIES', '5')}
          onChange={(e) => handleRawInputByKey('NUMBER_OF_TRIES', e.target.value)}
          placeholder="5"
          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none"
        />
      </div>

      {/* Delay each click (s) */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Delay each click (s)
        </label>
        <input
          type="number"
          step="0.1"
          value={getRawVal('DELAY_EACH_CLICK', '2')}
          onChange={(e) => handleRawInputByKey('DELAY_EACH_CLICK', e.target.value)}
          placeholder="2"
          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none"
        />
      </div>

      {/* Stop Condition */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Stop Condition
        </label>
        <VariableInput
          value={getRawVal('STOP_CONDITION')}
          onChange={(val) => handleRawInputByKey('STOP_CONDITION', val)}
          placeholder='hasElement(//input[@id="otp-input"])'
        />
      </div>

      {/* Click Type */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Click Type
        </label>
        <select
          value={clickType}
          onChange={(e) => handleRawInputByKey('CLICK_TYPE', e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none"
        >
          <option value="Click by Xpath">Click by Xpath</option>
          <option value="Click by coordinates">Click by coordinates</option>
          <option value="Click current position">Click current position</option>
        </select>
      </div>

      {/* XPath if Click by Xpath */}
      {(clickType === 'Click by Xpath' || clickType === 'CLICK_XPATH') && (
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
      )}

      {/* Coordinates if Click by coordinates */}
      {(clickType === 'Click by coordinates' || clickType === 'CLICK_COORDINATES') && (
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Coordinates (X,Y)
          </label>
          <VariableInput
            value={getRawVal('POS')}
            onChange={(val) => handleRawInputByKey('POS', val)}
            placeholder="900,800"
          />
        </div>
      )}

      <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
    </div>
  );
};
