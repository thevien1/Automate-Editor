import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { AppLogo } from '../common/AppLogo';

interface TitleBarProps {
  projectName?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ projectName }) => {
  const { screen } = useProject();

  const handleMinimize = () => {
    if ((window as any).electronAPI?.minimize) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if ((window as any).electronAPI?.maximize) {
      (window as any).electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI?.close) {
      (window as any).electronAPI.close();
    }
  };

  return (
    <div className="h-8 bg-white dark:bg-[#070b16] border-b border-[#e2e8f0] dark:border-[#162236] flex items-center justify-between px-2 select-none text-xs text-[#64748b] dark:text-[#94a3b8] z-50 transition-colors">
      <div className="flex items-center space-x-2">
        <AppLogo size={18} />
        <span className="font-medium text-[#1e293b] dark:text-[#cbd5e1]">
          GPM Automate Editor v3.0.8-stable {screen === 'editor' && projectName ? `- ${projectName}` : ''}
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center">
        <button
          onClick={handleMinimize}
          className="w-9 h-7 flex items-center justify-center hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-9 h-7 flex items-center justify-center hover:bg-[#1e293b] text-[#94a3b8] hover:text-white transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-9 h-7 flex items-center justify-center hover:bg-[#ef4444] hover:text-white text-[#94a3b8] transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
