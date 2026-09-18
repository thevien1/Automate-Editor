import React from 'react';
import {
  Trash2,
  CheckCircle2,
  Repeat,
  RefreshCw,
  GitBranch,
  CornerDownRight,
  Box,
  Search,
  Copy,
  Eye,
  X,
  XCircle,
  Link2,
  Hourglass,
  SlidersHorizontal,
  Plus,
  Minus,
  LogOut,
  SkipForward,
  Square,
  AlertTriangle,
  Clock,
  Shuffle,
  Scissors,
  FileText,
  Asterisk,
  Dices,
  Calculator,
  Key,
  FileCheck,
  FileEdit,
  Pencil,
  FilePlus,
  FileSpreadsheet,
  FolderCheck,
  FolderPlus,
  FolderEdit,
  FolderX,
  FolderTree,
  ClipboardCopy,
  ClipboardPaste,
  Variable,
  ListOrdered,
  Download,
  Globe,
  Image as ImageIcon,
  FileImage,
  Mail,
  MousePointer,
  Move,
  Hand,
  Pointer,
  Mouse,
  Keyboard,
} from 'lucide-react';
import { WorkflowNode, ActionNode } from '../../../types/gscript';

interface ActionHeaderProps {
  selectedNode: WorkflowNode;
  deleteSelectedNode: () => void;
  headerIcon?: React.ReactNode;
}

export const ActionHeader: React.FC<ActionHeaderProps> = ({
  selectedNode,
  deleteSelectedNode,
  headerIcon,
}) => {
  const isFor = selectedNode.$type?.includes('ForBlockNode') || selectedNode.display_text?.toLowerCase() === 'for';
  const isWhile = selectedNode.$type?.includes('WhileBlockNode') || selectedNode.display_text?.toLowerCase() === 'while';
  const isElseIf = selectedNode.display_text?.toLowerCase().includes('else if');
  const isElse = selectedNode.display_text?.toLowerCase() === 'else';
  const isIf = !isElseIf && !isElse && (selectedNode.$type?.includes('IfBlockNode') || selectedNode.display_text?.toLowerCase().startsWith('if'));
  const isNormalBlock = !isFor && !isIf && !isWhile && !isElseIf && !isElse && ('nodes' in selectedNode);

  const isAction = !('nodes' in selectedNode);
  const actionNode = isAction ? (selectedNode as ActionNode) : null;

  const title = isFor
    ? 'For'
    : isWhile
    ? 'While'
    : isElseIf
    ? 'Else if'
    : isElse
    ? 'Else'
    : isIf
    ? (selectedNode.display_text || 'If')
    : isNormalBlock
    ? (selectedNode.display_text || 'Normal block')
    : (actionNode?.display_text || 'Action');

  const renderIcon = () => {
    if (headerIcon) return headerIcon;
    if (isFor) return <Repeat className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (isWhile) return <RefreshCw className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (isElse) return <CornerDownRight className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (isElseIf || isIf) return <GitBranch className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (isNormalBlock) return <Box className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;

    if (actionNode) {
      const name = actionNode.display_text?.toLowerCase() || '';
      const type = actionNode.type;
      if (name === 'set variable' || type === 1) {
        return <span className="font-bold font-mono text-sm text-[#1677ff] dark:text-[#38bdf8]">√x</span>;
      }
      if (name === 'new tab' || type === 36) return <Copy className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'active tab' || type === 37) return <Eye className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'close tab' || type === 38) return <X className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'close all tab' || type === 73) return <XCircle className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'go to url' || type === 39) return <Link2 className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;

      if (name === 'wait element' || type === 44) return <Hourglass className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'get element attribute' || type === 45) return <SlidersHorizontal className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'get element text' || type === 46) return <span className="font-bold font-sans text-base text-[#1677ff] dark:text-[#38bdf8]">A</span>;
      if (name === 'count element' || type === 47) return <span className="font-bold font-mono text-base text-[#1677ff] dark:text-[#38bdf8]">#</span>;

      if (name.includes('increase') || type === 2) return <Plus className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('decrease') || type === 3) return <Minus className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('exit loop') || type === 5) return <LogOut className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('next loop') || type === 6) return <SkipForward className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'stop' || type === 76) return <Square className="w-4 h-4 text-[#1677ff] dark:text-[#38bdf8] fill-current" />;
      if (name === 'throw' || type === 117) return <AlertTriangle className="w-4 h-4 text-[#1677ff] dark:text-[#38bdf8] fill-current" />;
      if (name === 'delay' || type === 7) return <Clock className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'random text' || type === 8) return <Shuffle className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'split text' || type === 9) return <Scissors className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'read json' || type === 10) return <FileText className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'regex' || type === 82) return <Asterisk className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'random number' || type === 11) return <Dices className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'math execute' || type === 12) return <Calculator className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === '2fa code' || type === 81) return <Key className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'file exists' || type === 13) return <FileCheck className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'copy file' || type === 14) return <Copy className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('move') || name.includes('rename') || type === 15) return <FileEdit className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'delete file' || type === 16) return <Trash2 className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'file read all text' || type === 17) return <FileText className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'file read all lines' || type === 18) return <FileText className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'file read random line' || type === 184) return <FileText className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'file write all text' || type === 19) return <Pencil className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'file append line' || type === 20) return <FilePlus className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'create empty excel' || type === 74) return <FileSpreadsheet className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'read excel file' || type === 21) return <FileSpreadsheet className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'write excel file' || type === 22) return <FileSpreadsheet className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'append excel file' || type === 71) return <FileSpreadsheet className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'folder exists' || type === 23) return <FolderCheck className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'create folder' || type === 24) return <FolderPlus className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if ((name.includes('move') && name.includes('folder')) || type === 26) return <FolderEdit className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'delete folder' || type === 25) return <FolderX className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'folder get file list' || type === 72) return <FolderTree className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'get clipboard text' || type === 27) return <ClipboardCopy className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'set clipboard text' || type === 28) return <ClipboardPaste className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('variable')) return <Variable className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('count') || type === 4) return <ListOrdered className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'http download' || type === 30) return <Download className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('http') || type === 29) return <Globe className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'wait to image' || type === 107) return <Hourglass className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'image exists' || type === 108) return <ImageIcon className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'image search' || type === 109) return <Search className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'image to base64' || type === 110) return <FileImage className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('read mail code') || type === 35) return <Mail className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('read outlook') || type === 80) return <Mail className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('wait url changed') || type === 43) return <Clock className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('select dropdown') || type === 111) return <ListOrdered className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('mouse try to click') || type === 49) return <MousePointer className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'mouse move' || type === 50) return <Move className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'mouse press and hold' || type === 51) return <Hand className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'mouse release' || type === 52) return <Pointer className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'mouse scroll' || type === 53) return <Mouse className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name === 'key press' || type === 54 || name.includes('key')) return <Keyboard className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
      if (name.includes('mouse') || name.includes('click') || type === 48) return <MousePointer className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    return <Box className="w-5 h-5 text-[#1677ff] dark:text-[#38bdf8]" />;
  };

  return (
    <>
      {/* Header: Rounded Icon + Title + Comment + Trash */}
      <div className="flex items-start justify-between pb-3 border-b border-[#e2e8f0] dark:border-[#162236]">
        <div className="flex items-center space-x-3">
          {/* Rounded Icon Box */}
          <div className="w-9 h-9 rounded-xl bg-[#e6f4ff] dark:bg-[#0e1e3b] border border-[#91caff] dark:border-[#1d4ed8]/40 flex items-center justify-center shadow-2xs">
            {renderIcon()}
          </div>
          <div>
            <div className="font-bold text-sm text-[#1e293b] dark:text-[#f1f5f9]">
              {title}
            </div>
            <div className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
              {selectedNode.comment ? selectedNode.comment : 'No comment'}
            </div>
          </div>
        </div>

        <button
          onClick={deleteSelectedNode}
          className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
          title="Delete Node (Del)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-save enabled badge */}
      <div>
        <span className="bg-[#f0fdf4] dark:bg-[#052e16] text-[#16a34a] dark:text-[#4ade80] border border-[#bbf7d0] dark:border-[#166534] px-2.5 py-1 rounded-full text-[11px] font-medium inline-flex items-center space-x-1.5 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a] dark:text-[#4ade80]" />
          <span>Auto-save is enabled</span>
        </span>
      </div>
    </>
  );
};
