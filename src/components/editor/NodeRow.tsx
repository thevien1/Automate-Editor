import React, { useState } from 'react';
import { WorkflowNode, ActionNode } from '../../types/gscript';
import { useProject } from '../../context/ProjectContext';
import {
  ChevronDown,
  ChevronRight,
  Box,
  Repeat,
  HelpCircle,
  GitBranch,
  CornerDownRight,
  PlayCircle,
  FileText,
  Globe,
  Variable,
  Dices,
  Square,
  MousePointer,
  Move,
  Hand,
  Pointer,
  Mouse,
  Keyboard,
  Hourglass,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  Minus,
  ListOrdered,
  Pause,
  LogOut,
  SkipForward,
  Link,
  Eye,
  Camera,
  Layers,
  Copy,
  X,
  XCircle,
  Link2,
  ArrowLeft,
  RotateCw,
  Code2,
  Clock,
  SlidersHorizontal,
  AlertTriangle,
  Shuffle,
  Scissors,
  Asterisk,
  Calculator,
  Key,
  FileCheck,
  FileEdit,
  FilePlus,
  FileSpreadsheet,
  FolderCheck,
  FolderPlus,
  FolderSync,
  FolderEdit,
  FolderX,
  FolderTree,
  Clipboard,
  ClipboardCopy,
  ClipboardPaste,
  Pencil,
  Image as ImageIcon,
  FileImage,
  Search,
} from 'lucide-react';
import { ActionDefinition } from '../../types/ui';

interface NodeRowProps {
  node: WorkflowNode;
  stepNumber: number;
  depth?: number;
  parentId?: string | null;
  indexInParent: number;
  isRoot?: boolean;
}

export const NodeRow: React.FC<NodeRowProps> = ({
  node,
  stepNumber,
  depth = 0,
  parentId = null,
  indexInParent,
  isRoot = false,
}) => {
  const {
    selectedNodeId,
    selectedNodeIds = [],
    selectNode,
    deleteSelectedNode,
    insertActionOrBlock,
    toggleBlockExpand,
    moveNode,
  } = useProject();
  type DropPosition = 'top' | 'bottom' | 'inside' | null;
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  const [isDraggingThis, setIsDraggingThis] = useState(false);
  const [isEmptyZoneDragOver, setIsEmptyZoneDragOver] = useState(false);
  const [isContainerEndDragOver, setIsContainerEndDragOver] = useState(false);

  const isSelected = selectedNodeIds.includes(node.id) || selectedNodeId === node.id;
  const isBlock = 'nodes' in node && Array.isArray((node as any).nodes);
  const blockChildren = isBlock ? ((node as any).nodes as WorkflowNode[]) : [];
  const isExpanded = isBlock ? ((node as any).expanded !== false) : false;

  const isFor = isBlock && (node.$type?.includes('ForBlockNode') || node.display_text?.toLowerCase() === 'for');
  const isWhile = isBlock && (node.$type?.includes('WhileBlockNode') || node.display_text?.toLowerCase() === 'while');
  const isElseIf = isBlock && (node.display_text?.toLowerCase().includes('else if') || (node as any).type === 105);
  const isElse = isBlock && !isElseIf && (node.display_text?.toLowerCase().trim() === 'else' || (node as any).type === 106);
  const isIf = isBlock && !isElseIf && !isElse && (node.$type?.includes('IfBlockNode') || node.display_text?.toLowerCase().startsWith('if'));
  const isNormalBlock = isBlock && !isFor && !isIf && !isWhile && !isElseIf && !isElse;

  // Custom Icon matching Actions sidebar and PropertyPanel
  const getActionIcon = () => {
    if (isFor) return <Repeat className="w-4 h-4 text-white" />;
    if (isWhile) return <RefreshCw className="w-4 h-4 text-white" />;
    if (isElseIf) return <GitBranch className="w-4 h-4 text-white" />;
    if (isElse) return <CornerDownRight className="w-4 h-4 text-white" />;
    if (isIf) return <GitBranch className="w-4 h-4 text-white" />;
    if (isNormalBlock) return <Box className="w-4 h-4 text-white" />;

    const act = node as ActionNode;
    const type = act.type;
    const name = act.display_text?.toLowerCase() || '';

    if (name === 'wait element' || type === 44) {
      return <Hourglass className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'delay' || type === 7) {
      return <Clock className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'stop' || type === 76) {
      return <Square className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8] fill-current" />;
    }
    if (name === 'throw' || type === 117) {
      return <AlertTriangle className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8] fill-current" />;
    }
    if (name === 'random text' || type === 8) {
      return <Shuffle className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'split text' || type === 9) {
      return <Scissors className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'read json' || type === 10) {
      return <FileText className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'regex' || type === 82) {
      return <Asterisk className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'random number' || type === 11) {
      return <Dices className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'math execute' || type === 12) {
      return <Calculator className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === '2fa code' || type === 81) {
      return <Key className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'file exists' || type === 13) {
      return <FileCheck className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'copy file' || type === 14) {
      return <Copy className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('move') || name.includes('rename') || type === 15) {
      return <FileEdit className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'delete file' || type === 16) {
      return <Trash2 className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'file read all text' || type === 17) {
      return <FileText className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'file read all lines' || type === 18) {
      return <FileText className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'file read random line' || type === 184) {
      return <FileText className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'file write all text' || type === 19) {
      return <Pencil className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'file append line' || type === 20) {
      return <FilePlus className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'create empty excel' || type === 74) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'read excel file' || type === 21) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'write excel file' || type === 22) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'append excel file' || type === 71) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'folder exists' || type === 23) {
      return <FolderCheck className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'create folder' || type === 24) {
      return <FolderPlus className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if ((name.includes('move') && name.includes('folder')) || type === 26) {
      return <FolderEdit className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'delete folder' || type === 25) {
      return <FolderX className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'folder get file list' || type === 72) {
      return <FolderTree className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'get clipboard text' || type === 27) {
      return <ClipboardCopy className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'set clipboard text' || type === 28) {
      return <ClipboardPaste className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('random')) {
      return <Dices className="w-3.5 h-3.5 text-[#64748b] dark:text-[#e2e8f0]" />;
    }
    if (name === 'http download' || type === 30) {
      return <Download className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('http') || type === 29) {
      return <Globe className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('json') || name.includes('file') || (type >= 13 && type <= 22)) {
      return <FileText className="w-3.5 h-3.5 text-[#64748b] dark:text-[#e2e8f0]" />;
    }
    if (name.includes('exit') || type === 5) {
      return <LogOut className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('next') || type === 6) {
      return <SkipForward className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }

    // Browser - Navigation actions
    if (name === 'new tab' || type === 36) return <Copy className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'active tab' || type === 37) return <Eye className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'close tab' || type === 38) return <X className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'close all tab' || type === 73) return <XCircle className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'go to url' || type === 39) return <Link2 className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('back url') || type === 40) return <ArrowLeft className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('reload') || type === 41) return <RotateCw className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('get url') || type === 42) return <Code2 className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('wait url') || type === 43) return <Clock className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;

    // Browser - Element actions
    if (name === 'wait element' || type === 44) return <Hourglass className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'get element attribute' || type === 45) return <SlidersHorizontal className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'get element text' || type === 46) return <span className="font-bold font-sans text-[11px] text-[#1677ff] dark:text-[#38bdf8]">A</span>;
    if (name === 'count element' || type === 47) return <span className="font-bold font-mono text-[11px] text-[#1677ff] dark:text-[#38bdf8]">#</span>;

    if (name.includes('url')) {
      return <Link className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('increase') || type === 2) {
      return <Plus className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('decrease') || type === 3) {
      return <Minus className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'set variable' || type === 1) {
      return <span className="font-bold font-mono text-[11px] text-[#1677ff] dark:text-[#38bdf8]">√x</span>;
    }
    if (name.includes('variable')) {
      return <Variable className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('count') || type === 4) {
      return <ListOrdered className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name.includes('stop') || type === 76) {
      return <Square className="w-3 h-3 text-[#ef4444] fill-[#ef4444]" />;
    }
    if (name === 'mouse move' || type === 50) {
      return <Move className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#60a5fa]" />;
    }
    if (name === 'mouse press and hold' || type === 51) {
      return <Hand className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#60a5fa]" />;
    }
    if (name === 'mouse release' || type === 52) {
      return <Pointer className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#60a5fa]" />;
    }
    if (name === 'mouse scroll' || type === 53) {
      return <Mouse className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#60a5fa]" />;
    }
    if (name === 'key press' || type === 54 || name.includes('key')) {
      return <Keyboard className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#60a5fa]" />;
    }
    if (name.includes('mouse') || name.includes('click')) {
      return <MousePointer className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#60a5fa]" />;
    }
    if (name === 'wait to image' || type === 107) {
      return <Hourglass className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'image exists' || type === 108) {
      return <ImageIcon className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'image search' || type === 109) {
      return <Search className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    if (name === 'image to base64' || type === 110) {
      return <FileImage className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    }
    return <PlayCircle className="w-3.5 h-3.5 text-[#64748b] dark:text-[#94a3b8]" />;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/gpm-node-id', node.id);
    e.dataTransfer.effectAllowed = 'all';
    setIsDraggingThis(true);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDraggingThis(false);
    setDropPosition(null);
  };

  const handleActionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;

    if (mouseY < height / 2) {
      setDropPosition('top');
    } else {
      setDropPosition('bottom');
    }
  };

  const handleBlockHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;

    if (!isRoot && mouseY < height * 0.3) {
      setDropPosition('top');
    } else if (!isRoot && mouseY > height * 0.7) {
      setDropPosition('bottom');
    } else {
      setDropPosition('inside');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Fallback: Compute position immediately from coordinates in case state was cleared
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const height = rect.height;

    let pos = dropPosition;
    if (!pos) {
      if (isBlock) {
        if (!isRoot && mouseY < height * 0.3) pos = 'top';
        else if (!isRoot && mouseY > height * 0.7) pos = 'bottom';
        else pos = 'inside';
      } else {
        pos = mouseY < height / 2 ? 'top' : 'bottom';
      }
    }
    setDropPosition(null);

    const targetPos: 'before' | 'after' | 'inside' =
      isBlock && pos === 'inside'
        ? 'inside'
        : pos === 'top'
        ? 'before'
        : 'after';

    const rawAction = e.dataTransfer.getData('application/gpm-action');
    if (rawAction) {
      try {
        const actionDef: ActionDefinition = JSON.parse(rawAction);
        insertActionOrBlock(actionDef, node.id, targetPos);
      } catch (err) {
        console.error('Drop action parse error', err);
      }
      return;
    }

    const draggedNodeId = e.dataTransfer.getData('application/gpm-node-id');
    if (draggedNodeId && draggedNodeId !== node.id) {
      moveNode(draggedNodeId, node.id, targetPos);
    }
  };

  // Outer block container border and background
  const getBlockContainerStyle = () => {
    if (isSelected) {
      return 'border-2 border-[#1677ff] dark:border-[#38bdf8] bg-white dark:bg-[#0b111e] shadow-sm';
    }
    return 'border border-[#d9d9d9] dark:border-[#1e293b] bg-white dark:bg-[#0b111e] shadow-xs';
  };

  // Block header banner styling (matching Image 1!)
  const getBlockHeaderStyle = () => {
    if (isFor) {
      return 'bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white';
    }
    if (isIf || isElseIf || isElse) {
      return 'bg-gradient-to-r from-[#6b21a8] to-[#7e22ce] text-white';
    }
    if (isWhile) {
      return 'bg-gradient-to-r from-[#0f766e] to-[#0d9488] text-white';
    }
    // Normal block
    return 'bg-gradient-to-r from-[#334155] to-[#475569] text-white';
  };

  // Extract comment or parameters for cyan display
  const getSubtext = () => {
    if (isBlock) {
      if (isFor) {
        const f = node as any;
        return `${f.start || 0} ➔ ${f.end || 100}`;
      }
      if (isIf || isWhile || isElseIf) {
        return (node as any).condition || node.comment || '';
      }
      return node.comment || '';
    }

    const act = node as ActionNode;
    if (act.comment) return act.comment;
    if (act.element_xpath) return act.element_xpath;

    // For Go to URL: show URL if comment not set
    if (act.type === 39 || act.display_text?.toLowerCase() === 'go to url') {
      try {
        const parsed = typeof act.raw_input === 'string' ? JSON.parse(act.raw_input) : act.raw_input;
        const u = parsed?.find((p: any) => p.Key === 'URL')?.Value;
        if (u) return u;
      } catch (e) {}
    }

    // Try parse raw_input
    if (act.raw_input) {
      try {
        const parsed = typeof act.raw_input === 'string' ? JSON.parse(act.raw_input) : act.raw_input;
        if (Array.isArray(parsed)) {
          const parts = parsed
            .filter((p: any) => p.Value && p.Value.trim())
            .map((p: any) => `${p.Key}=${p.Value}`);
          if (parts.length > 0) return parts.join('  ');
        }
      } catch (e) {}
    }
    return '';
  };

  const subtext = getSubtext();
  const displayText = node.display_text || (isBlock ? 'Block' : 'Action');

  // BLOCK CONTAINER (Enclosing box matching Image 1)
  if (isBlock) {
    return (
      <div
        className={`relative select-none my-1.5 transition-all rounded-lg border ${getBlockContainerStyle()} ${
          dropPosition === 'inside'
            ? 'ring-2 ring-[#1677ff] dark:ring-[#38bdf8] shadow-[0_0_12px_rgba(22,119,255,0.25)] border-[#1677ff] dark:border-[#38bdf8]'
            : ''
        } ${isDraggingThis ? 'opacity-35 border-dashed border-[#1677ff]' : ''}`}
      >
        {/* Top Drop Indicator Bar */}
        {dropPosition === 'top' && !isRoot && (
          <div className="absolute -top-[2px] left-0 right-0 z-30 pointer-events-none flex items-center">
            <div className="w-2 h-2 rounded-full bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.6)] -ml-1 border border-white dark:border-[#0b111e]" />
            <div className="flex-1 h-[2px] bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.5)]" />
            <div className="w-2 h-2 rounded-full bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.6)] -mr-1 border border-white dark:border-[#0b111e]" />
          </div>
        )}

        {/* Bottom Drop Indicator Bar */}
        {dropPosition === 'bottom' && !isRoot && (
          <div className="absolute -bottom-[2px] left-0 right-0 z-30 pointer-events-none flex items-center">
            <div className="w-2 h-2 rounded-full bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.6)] -ml-1 border border-white dark:border-[#0b111e]" />
            <div className="flex-1 h-[2px] bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.5)]" />
            <div className="w-2 h-2 rounded-full bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.6)] -mr-1 border border-white dark:border-[#0b111e]" />
          </div>
        )}

        {/* Block Header Banner (matching Image 1) */}
        <div
          draggable={!isRoot}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleBlockHeaderDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            e.stopPropagation();
            const isMulti = e.ctrlKey || e.metaKey;
            const isRange = e.shiftKey;
            selectNode(node.id, undefined, isMulti, isRange);
          }}
          className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all ${
            isExpanded ? 'rounded-t-md border-b border-black/10 dark:border-white/10' : 'rounded-md'
          } ${getBlockHeaderStyle()}`}
        >
          {/* Left Side: Collapse arrow, icon, title, subtext, count badge */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBlockExpand(node.id);
              }}
              className="p-0.5 rounded hover:bg-black/20 dark:hover:bg-white/20 text-white/90 shrink-0 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="shrink-0 flex items-center justify-center text-white/90">
              {getActionIcon()}
            </div>

            <div className="flex items-center space-x-2 truncate">
              <span className="font-bold text-xs text-white tracking-tight shrink-0">
                {displayText}
              </span>
              {subtext && (
                <span className="text-[11px] truncate font-mono text-cyan-200 dark:text-[#38bdf8]">
                  {subtext}
                </span>
              )}
            </div>

            {blockChildren.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-black/25 dark:bg-black/40 text-white/90 border border-white/15 shrink-0">
                {blockChildren.length} block
              </span>
            )}

            {dropPosition === 'inside' && (
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-500 text-white animate-pulse shrink-0 shadow-sm">
                Drop inside ↵
              </span>
            )}
          </div>

          {/* Right Side: Delete and Step number pill */}
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            {!isRoot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSelected) selectNode(node.id);
                  deleteSelectedNode();
                }}
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded hover:bg-black/30 text-white/80 hover:text-white transition-opacity"
                title="Delete (Del)"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}

            {/* Dark pill step badge like Image 1 */}
            <div className="w-6 h-5 rounded-full bg-black/35 text-white text-[11px] font-mono flex items-center justify-center border border-white/20">
              {stepNumber}
            </div>
          </div>
        </div>

        {/* Children Body inside the Block Box (matching Image 1!) */}
        {isExpanded && (
          <div className="p-2 pt-2 pb-2">
            {blockChildren.length === 0 ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'copy';
                  setIsEmptyZoneDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEmptyZoneDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEmptyZoneDragOver(false);
                  const rawAction = e.dataTransfer.getData('application/gpm-action');
                  if (rawAction) {
                    try {
                      const actionDef: ActionDefinition = JSON.parse(rawAction);
                      insertActionOrBlock(actionDef, node.id, 'inside');
                    } catch (err) {
                      console.error(err);
                    }
                    return;
                  }
                  const draggedNodeId = e.dataTransfer.getData('application/gpm-node-id');
                  if (draggedNodeId && draggedNodeId !== node.id) {
                    moveNode(draggedNodeId, node.id, 'inside');
                  }
                }}
                className={`min-h-[38px] flex items-center justify-center rounded-md border-2 border-dashed text-xs transition-all ${
                  isEmptyZoneDragOver
                    ? 'border-[#1677ff] dark:border-[#38bdf8] bg-blue-500/15 text-[#1677ff] dark:text-[#38bdf8] font-medium shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 hover:border-slate-300'
                }`}
              >
                {isEmptyZoneDragOver ? '+ Drop inside this block' : 'Drop actions here'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {blockChildren.map((childNode, idx) => (
                  <NodeRow
                    key={childNode.id}
                    node={childNode}
                    stepNumber={stepNumber + idx + 1}
                    depth={depth + 1}
                    parentId={node.id}
                    indexInParent={idx}
                  />
                ))}

                {/* Drop strip at the bottom of non-empty block */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy';
                    setIsContainerEndDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsContainerEndDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsContainerEndDragOver(false);
                    const rawAction = e.dataTransfer.getData('application/gpm-action');
                    if (rawAction) {
                      try {
                        const actionDef: ActionDefinition = JSON.parse(rawAction);
                        insertActionOrBlock(actionDef, node.id, 'inside');
                      } catch (err) {
                        console.error(err);
                      }
                      return;
                    }
                    const draggedNodeId = e.dataTransfer.getData('application/gpm-node-id');
                    if (draggedNodeId && draggedNodeId !== node.id) {
                      moveNode(draggedNodeId, node.id, 'inside');
                    }
                  }}
                  className={`h-1.5 transition-all relative rounded ${
                    isContainerEndDragOver ? 'h-6 my-1 bg-blue-500/10 border-2 border-dashed border-[#1677ff] dark:border-[#38bdf8]' : ''
                  }`}
                >
                  {isContainerEndDragOver && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-[#1677ff] dark:text-[#38bdf8] font-medium">
                      + Insert at end of block
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ACTION NODE (Image 2 style)
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleActionDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        e.stopPropagation();
        const isMulti = e.ctrlKey || e.metaKey;
        const isRange = e.shiftKey;
        selectNode(node.id, undefined, isMulti, isRange);
      }}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
        isSelected
          ? 'border-2 border-[#1677ff] dark:border-[#38bdf8] bg-blue-50/20 dark:bg-[#101e38] shadow-sm'
          : 'border border-[#e2e8f0] dark:border-[#1a2840] bg-white dark:bg-[#0c1424] hover:border-[#1677ff] dark:hover:border-[#38bdf8] text-[#1e293b] dark:text-[#f1f5f9]'
      } ${dropPosition ? 'ring-1 ring-[#1677ff]/60 dark:ring-[#38bdf8]/60' : ''} ${
        isDraggingThis ? 'opacity-35 border-dashed border-[#1677ff] dark:border-[#38bdf8] scale-[0.99]' : ''
      }`}
    >
      {/* Top Drop Indicator Bar */}
      {dropPosition === 'top' && (
        <div className="absolute -top-[2px] left-0 right-0 z-30 pointer-events-none flex items-center">
          <div className="w-2 h-2 rounded-full bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.6)] -ml-1 border border-white dark:border-[#0b111e]" />
          <div className="flex-1 h-[2px] bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.5)]" />
          <div className="w-2 h-2 rounded-full bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.6)] -mr-1 border border-white dark:border-[#0b111e]" />
        </div>
      )}

      {/* Bottom Drop Indicator Bar */}
      {dropPosition === 'bottom' && (
        <div className="absolute -bottom-[2px] left-0 right-0 z-30 pointer-events-none flex items-center">
          <div className="w-2 h-2 rounded-full bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.6)] -ml-1 border border-white dark:border-[#0b111e]" />
          <div className="flex-1 h-[2px] bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.5)]" />
          <div className="w-2 h-2 rounded-full bg-[#38bdf8] dark:bg-[#7dd3fc] shadow-[0_0_4px_rgba(56,189,248,0.6)] -mr-1 border border-white dark:border-[#0b111e]" />
        </div>
      )}

      {/* Left: Icon, Display Text, Subtext (cyan) */}
      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
        <div className="shrink-0 flex items-center justify-center">
          {getActionIcon()}
        </div>

        <div className="flex items-center space-x-2 truncate">
          <span className="font-semibold text-xs tracking-tight text-[#1e293b] dark:text-[#f8fafc] shrink-0">
            {displayText}
          </span>
          {subtext && (
            <span className="text-[11px] truncate font-mono text-[#0284c7] dark:text-[#38bdf8]">
              {subtext}
            </span>
          )}
        </div>
      </div>

      {/* Right: Delete button on hover & Step badge */}
      <div className="flex items-center space-x-2 shrink-0 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isSelected) selectNode(node.id);
            deleteSelectedNode();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-red-500 dark:text-red-400 transition-opacity"
          title="Delete (Del)"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        <div className="w-6 h-5 rounded-md bg-[#f1f5f9] dark:bg-black/40 text-[#64748b] dark:text-[#94a3b8] text-[11px] font-mono flex items-center justify-center border border-[#d9d9d9] dark:border-[#1e293b]">
          {stepNumber}
        </div>
      </div>
    </div>
  );
};

