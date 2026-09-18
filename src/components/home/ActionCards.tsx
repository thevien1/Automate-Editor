import React from 'react';
import { Plus, Folder, Settings } from 'lucide-react';

interface ActionCardsProps {
  onNewProject: () => void;
  onOpenProject: () => void;
  onSettings: () => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  onNewProject,
  onOpenProject,
  onSettings,
}) => {
  return (
    <div className="flex items-center justify-center space-x-6 my-10 select-none">
      {/* 1. New Project Card (Cyan Highlight Border) */}
      <button
        onClick={onNewProject}
        className="w-36 h-36 rounded-xl border-2 border-[#38bdf8] bg-[#0d172a] flex flex-col items-center justify-center p-4 hover:shadow-lg hover:shadow-cyan-500/20 hover:bg-[#101f38] transition-all duration-200 group active:scale-98"
      >
        <div className="w-10 h-10 flex items-center justify-center mb-3">
          <Plus className="w-8 h-8 text-[#38bdf8] stroke-[2.5] group-hover:scale-110 transition-transform" />
        </div>
        <span className="text-xs font-semibold text-[#f1f5f9]">
          New Project
        </span>
      </button>

      {/* 2. Open Project Card */}
      <button
        onClick={onOpenProject}
        className="w-36 h-36 rounded-xl border border-[#1e293b] bg-[#0d172a] flex flex-col items-center justify-center p-4 hover:border-[#38bdf8] hover:bg-[#101f38] hover:shadow-md transition-all duration-200 group active:scale-98"
      >
        <div className="w-10 h-10 flex items-center justify-center mb-3">
          <Folder className="w-7 h-7 text-[#38bdf8] fill-[#38bdf8]/20 group-hover:scale-110 transition-transform" />
        </div>
        <span className="text-xs font-medium text-[#f1f5f9]">
          Open Project
        </span>
      </button>

      {/* 3. Settings Card */}
      <button
        onClick={onSettings}
        className="w-36 h-36 rounded-xl border border-[#1e293b] bg-[#0d172a] flex flex-col items-center justify-center p-4 hover:border-[#38bdf8] hover:bg-[#101f38] hover:shadow-md transition-all duration-200 group active:scale-98"
      >
        <div className="w-10 h-10 flex items-center justify-center mb-3">
          <Settings className="w-7 h-7 text-[#38bdf8] group-hover:rotate-45 transition-transform duration-300" />
        </div>
        <span className="text-xs font-medium text-[#f1f5f9]">
          Settings
        </span>
      </button>
    </div>
  );
};
