import React from 'react';
import { MenuBar } from './MenuBar';
import { ToolBar } from './ToolBar';
import { ActionsSidebar } from './ActionsSidebar';
import { Canvas } from './Canvas';
import { PropertyPanel } from './PropertyPanel';
import { StatusBar } from '../layout/StatusBar';

interface EditorViewProps {
  onNewProject: () => void;
  onOpenProject: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  onNewProject,
  onOpenProject,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Menu Bar (File, Edit, Build, Support...) */}
      <MenuBar onNewProject={onNewProject} onOpenProject={onOpenProject} />

      {/* Tool Bar (Run, Test, Save, Undo, Redo, AI...) */}
      <ToolBar />

      {/* Main 3-Column Working Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Actions Library Panel */}
        <ActionsSidebar />

        {/* Center: Workflow Canvas & Blocks */}
        <Canvas />

        {/* Right: Property Inspector Panel */}
        <PropertyPanel />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
};
