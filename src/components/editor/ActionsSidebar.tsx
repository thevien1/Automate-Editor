import React, { useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  Plus,
  GripVertical,
  Box,
  Repeat,
  RefreshCw,
  HelpCircle,
  GitBranch,
  ArrowRight,
  Variable,
  Minus,
  ListOrdered,
  Hourglass,
  Pause,
  SkipForward,
  LogOut,
  Square,
  FileText,
  Dices,
  Globe,
  Download,
  Eye,
  Camera,
  MousePointer,
  Move,
  Hand,
  Pointer,
  Mouse,
  Keyboard,
  Link,
  CornerDownRight,
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
  Trash2,
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
} from 'lucide-react';
import { ACTION_CATEGORIES } from '../../data/actionsCatalog';
import { useProject } from '../../context/ProjectContext';
import { ActionDefinition } from '../../types/ui';

export const ActionsSidebar: React.FC = () => {
  const { insertActionOrBlock } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    block: true,
    image_search: true,
    variables: false,
    workflow: false,
    text_number: false,
    file_folder: false,
    browser_nav: false,
  });

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getActionIcon = (action: ActionDefinition) => {
    const name = action.name.toLowerCase();
    const type = action.type;

    if (name === 'normal block') return <Box className="w-3.5 h-3.5 text-[#d97706]" />;
    if (name === 'for') return <Repeat className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'while') return <RefreshCw className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'if') return <GitBranch className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('else if')) return <GitBranch className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('else')) return <CornerDownRight className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;

    if (name === 'delay' || type === 7) return <Clock className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('exit') || type === 5) return <LogOut className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('next') || type === 6) return <SkipForward className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'stop' || type === 76) return <Square className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8] fill-current" />;
    if (name === 'throw' || type === 117) return <AlertTriangle className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8] fill-current" />;
    if (name === 'random text' || type === 8) return <Shuffle className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'split text' || type === 9) return <Scissors className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'read json' || type === 10) return <FileText className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'regex' || type === 82) return <Asterisk className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'random number' || type === 11) return <Dices className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'math execute' || type === 12) return <Calculator className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === '2fa code' || type === 81) return <Key className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'file exists' || type === 13) return <FileCheck className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'copy file' || type === 14) return <Copy className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('move') || name.includes('rename') || type === 15) return <FileEdit className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'delete file' || type === 16) return <Trash2 className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'file read all text' || type === 17) return <FileText className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'file read all lines' || type === 18) return <FileText className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'file read random line' || type === 184) return <FileText className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'file write all text' || type === 19) return <Pencil className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'file append line' || type === 20) return <FilePlus className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'create empty excel' || type === 74) return <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'read excel file' || type === 21) return <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'write excel file' || type === 22) return <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'append excel file' || type === 71) return <FileSpreadsheet className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'folder exists' || type === 23) return <FolderCheck className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'create folder' || type === 24) return <FolderPlus className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if ((name.includes('move') && name.includes('folder')) || type === 26) return <FolderEdit className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'delete folder' || type === 25) return <FolderX className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'folder get file list' || type === 72) return <FolderTree className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'get clipboard text' || type === 27) return <ClipboardCopy className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'set clipboard text' || type === 28) return <ClipboardPaste className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;

    if (name.includes('increase')) return <Plus className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('decrease')) return <Minus className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('count')) return <ListOrdered className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'set variable' || type === 1) return <span className="font-bold font-mono text-[11px] text-[#1677ff] dark:text-[#38bdf8]">√x</span>;
    if (name.includes('variable')) return <Variable className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;

    if (name === 'wait to image' || type === 107) return <Hourglass className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'image exists' || type === 108) return <ImageIcon className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'image search' || type === 109) return <Search className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'image to base64' || type === 110) return <FileImage className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;

    if (name.includes('http request') || type === 29) return <Globe className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('download') || type === 30) return <Download className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('json') || name.includes('file')) return <FileText className="w-3.5 h-3.5 text-[#64748b] dark:text-[#e2e8f0]" />;
    if (name.includes('random')) return <Dices className="w-3.5 h-3.5 text-[#64748b] dark:text-[#e2e8f0]" />;

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

    // Browser - Mouse actions
    if (name === 'mouse move' || type === 50) return <Move className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'mouse press and hold' || type === 51) return <Hand className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'mouse release' || type === 52) return <Pointer className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'mouse scroll' || type === 53) return <Mouse className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name.includes('mouse') || name.includes('click')) return <MousePointer className="w-3.5 h-3.5 text-[#1677ff] dark:text-[#38bdf8]" />;
    if (name === 'key press' || type === 54 || name.includes('key')) return <Keyboard className="w-3.5 h-3.5 text-[#a855f7]" />;

    return <Layers className="w-3.5 h-3.5 text-[#64748b] dark:text-[#94a3b8]" />;
  };

  const filteredCategories = ACTION_CATEGORIES.map(cat => {
    if (!searchTerm.trim()) return cat;
    const matchedActions = cat.actions.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      ...cat,
      actions: matchedActions,
      count: matchedActions.length,
    };
  }).filter(cat => !searchTerm.trim() || cat.actions.length > 0);

  const handleDoubleClick = (action: ActionDefinition) => {
    insertActionOrBlock(action);
  };

  const handleDragStart = (e: React.DragEvent, action: ActionDefinition) => {
    e.dataTransfer.setData('application/gpm-action', JSON.stringify(action));
    e.dataTransfer.effectAllowed = 'all';
  };

  return (
    <div className="w-64 bg-white dark:bg-[#080d19] border-r border-[#e2e8f0] dark:border-[#162236] flex flex-col h-full select-none text-left transition-colors">
      {/* Search Input Box */}
      <div className="p-2.5 pb-2 text-left">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] dark:text-[#64748b] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search actions..."
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] border border-[#d9d9d9] dark:border-[#1e293b] rounded hover:border-[#1677ff] dark:hover:border-[#38bdf8] focus:border-[#1677ff] dark:focus:border-[#38bdf8] focus:outline-none transition-colors placeholder-[#94a3b8]"
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 text-xs text-left">
        {filteredCategories.map((category) => {
          const isExpanded = searchTerm ? true : !!expandedCategories[category.id];

          return (
            <div key={category.id} className="mb-0.5">
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category.id)}
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#f1f5f9] dark:hover:bg-[#111c30] cursor-pointer text-[#475569] dark:text-[#cbd5e1] group transition-colors text-left"
              >
                <div className="flex items-center space-x-1.5">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] dark:text-[#64748b]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8] dark:text-[#64748b]" />
                  )}
                  <span className="font-medium text-xs text-[#334155] dark:text-[#94a3b8] group-hover:text-black dark:group-hover:text-white">
                    {category.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#64748b] bg-[#f1f5f9] dark:bg-[#0f172a] group-hover:bg-[#e2e8f0] dark:group-hover:bg-[#1e293b] px-1.5 py-0.2 rounded-full min-w-[18px] text-center border border-[#e2e8f0] dark:border-[#1e293b]">
                  {category.count}
                </span>
              </div>

              {/* Sub Actions List (Draggable & Double-Clickable) */}
              {isExpanded && (
                <div className="pl-4 pr-1 py-0.5 space-y-0.5 border-l border-[#e2e8f0] dark:border-[#162236] ml-3 mt-0.5">
                  {category.actions.map((action) => (
                    <div
                      key={action.type + action.name}
                      draggable
                      onDragStart={(e) => handleDragStart(e, action)}
                      onDoubleClick={() => handleDoubleClick(action)}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-[#e6f4ff] dark:hover:bg-[#15233c] hover:text-[#1677ff] dark:hover:text-white text-[#334155] dark:text-[#cbd5e1] cursor-grab active:cursor-grabbing group transition-colors"
                      title={`${action.description} (Double-click to append to selected block)`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                          {getActionIcon(action)}
                        </div>
                        <span className="truncate text-xs font-normal">{action.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDoubleClick(action);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-blue-600/20 text-[#1677ff] dark:text-[#38bdf8] transition-opacity"
                        title="Add to selected block"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
