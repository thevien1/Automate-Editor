import React from 'react';
import { ActionPropsCommon } from '../types';
import { VariableInput } from '../../../common/VariableInput';
import { CommonActionFooter } from '../CommonActionFooter';

export const MouseClickProps: React.FC<ActionPropsCommon> = ({
  actionNode,
  getRawVal,
  handleRawInputByKey,
  updateNode,
}) => {
  const mouseClickTypeRaw = getRawVal('CLICK_TYPE', 'Click by Xpath');
  const mouseClickType =
    mouseClickTypeRaw === 'CLICK_POS' || mouseClickTypeRaw === 'Click by coordinates'
      ? 'Click by coordinates'
      : mouseClickTypeRaw === 'CLICK_CURRENT_POS' || mouseClickTypeRaw === 'Click by current position'
      ? 'Click by current position'
      : 'Click by Xpath';

  const mousePos = getRawVal('POS', '');

  const handleTypeChange = (val: string) => {
    let typeVal = 'CLICK_XPATH';
    if (val === 'Click by coordinates') typeVal = 'CLICK_POS';
    if (val === 'Click by current position') typeVal = 'CLICK_CURRENT_POS';
    handleRawInputByKey('CLICK_TYPE', typeVal);
  };

  const handleXpathChange = (val: string) => {
    handleRawInputByKey('XPATH', val);
    updateNode(actionNode.id, { element_xpath: val });
  };

  return (
    <div className="space-y-4">
      {/* Click Type */}
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Click Type
        </label>
        <div className="relative">
          <select
            value={mouseClickType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none cursor-pointer appearance-none pr-8"
          >
            <option value="Click by Xpath">Click by Xpath</option>
            <option value="Click by current position">Click by current position</option>
            <option value="Click by coordinates">Click by coordinates</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
            ▾
          </div>
        </div>
      </div>

      {/* Conditional Field: XPath if Click by Xpath */}
      {mouseClickType === 'Click by Xpath' && (
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            XPath
          </label>
          <VariableInput
            value={actionNode.element_xpath || getRawVal('XPATH', '')}
            onChange={handleXpathChange}
            placeholder=""
          />
        </div>
      )}

      {/* Conditional Field: Coordinates if Click by coordinates */}
      {mouseClickType === 'Click by coordinates' && (
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Coordinates
          </label>
          <VariableInput
            value={mousePos}
            onChange={(val) => handleRawInputByKey('POS', val)}
            placeholder="e.g. 900,800 or $pos"
          />
        </div>
      )}

      <CommonActionFooter actionNode={actionNode} updateNode={updateNode} />
    </div>
  );
};
