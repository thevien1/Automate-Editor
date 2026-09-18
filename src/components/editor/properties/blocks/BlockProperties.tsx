import React from 'react';
import { WorkflowNode, ForBlockNode, IfBlockNode, WhileBlockNode } from '../../../../types/gscript';
import { VariableInput } from '../../../common/VariableInput';

interface BlockPropertiesProps {
  selectedNode: WorkflowNode;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
}

export const BlockProperties: React.FC<BlockPropertiesProps> = ({
  selectedNode,
  updateNode,
}) => {
  const isFor = selectedNode.$type.includes('ForBlockNode') || selectedNode.display_text?.toLowerCase() === 'for';
  const isWhile = selectedNode.$type.includes('WhileBlockNode') || selectedNode.display_text?.toLowerCase() === 'while';
  const isElseIf = selectedNode.display_text?.toLowerCase().includes('else if');
  const isElse = selectedNode.display_text?.toLowerCase() === 'else';
  const isIf = !isElseIf && !isElse && (selectedNode.$type.includes('IfBlockNode') || selectedNode.display_text?.toLowerCase().startsWith('if'));
  const isNormalBlock = !isFor && !isIf && !isWhile && !isElseIf && !isElse;

  if (isIf) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Condition
          </label>
          <VariableInput
            value={(selectedNode as IfBlockNode).condition || ''}
            onChange={(val) => updateNode(selectedNode.id, { condition: val } as any)}
            placeholder="e.g. $x == 1 or hasElement(//div)"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Note
          </label>
          <textarea
            value={selectedNode.comment || ''}
            onChange={(e) => updateNode(selectedNode.id, { comment: e.target.value })}
            rows={4}
            placeholder="Quick note about this action — visible only in the editor, does not affect runtime"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none resize-none placeholder-[#94a3b8]"
          />
        </div>
      </div>
    );
  }

  if (isElseIf) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Condition
          </label>
          <VariableInput
            value={(selectedNode as any).condition || ''}
            onChange={(val) => updateNode(selectedNode.id, { condition: val } as any)}
            placeholder="e.g. $x == 2 or hasElement(//div)"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Note
          </label>
          <textarea
            value={selectedNode.comment || ''}
            onChange={(e) => updateNode(selectedNode.id, { comment: e.target.value })}
            rows={4}
            placeholder="Quick note about this action — visible only in the editor, does not affect runtime"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none resize-none placeholder-[#94a3b8]"
          />
        </div>
      </div>
    );
  }

  if (isElse) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Note
          </label>
          <textarea
            value={selectedNode.comment || ''}
            onChange={(e) => updateNode(selectedNode.id, { comment: e.target.value })}
            rows={4}
            placeholder="Quick note about this action — visible only in the editor, does not affect runtime"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none resize-none placeholder-[#94a3b8]"
          />
        </div>
      </div>
    );
  }

  if (isFor) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Start
          </label>
          <VariableInput
            value={(selectedNode as ForBlockNode).start ?? '0'}
            onChange={(val) => updateNode(selectedNode.id, { start: val } as any)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            End (run from START to END-1)
          </label>
          <VariableInput
            value={(selectedNode as ForBlockNode).end ?? '10'}
            onChange={(val) => updateNode(selectedNode.id, { end: val } as any)}
            placeholder="e.g. 10 or $count"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Increase by
          </label>
          <VariableInput
            value={(selectedNode as ForBlockNode).step ?? '1'}
            onChange={(val) => updateNode(selectedNode.id, { step: val } as any)}
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Note
          </label>
          <textarea
            value={selectedNode.comment || ''}
            onChange={(e) => updateNode(selectedNode.id, { comment: e.target.value })}
            rows={4}
            placeholder="Quick note about this action — visible only in the editor, does not affect runtime"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none resize-none placeholder-[#94a3b8]"
          />
        </div>
      </div>
    );
  }

  if (isWhile) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Condition
          </label>
          <VariableInput
            value={(selectedNode as WhileBlockNode).condition || ''}
            onChange={(val) => updateNode(selectedNode.id, { condition: val } as any)}
            placeholder="e.g. hasElement(//div)"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
            Note
          </label>
          <textarea
            value={selectedNode.comment || ''}
            onChange={(e) => updateNode(selectedNode.id, { comment: e.target.value })}
            rows={4}
            placeholder="Quick note about this action — visible only in the editor, does not affect runtime"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none resize-none placeholder-[#94a3b8]"
          />
        </div>
      </div>
    );
  }

  // Normal block
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Display Text
        </label>
        <input
          type="text"
          value={selectedNode.display_text || ''}
          onChange={(e) => updateNode(selectedNode.id, { display_text: e.target.value })}
          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94a3b8] mb-1.5">
          Note
        </label>
        <textarea
          value={selectedNode.comment || ''}
          onChange={(e) => updateNode(selectedNode.id, { comment: e.target.value })}
          rows={4}
          placeholder="Enter note or description.."
          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none resize-none placeholder-[#94a3b8]"
        />
      </div>
    </div>
  );
};
