import React from 'react';
import { HomeSidebar } from './HomeSidebar';
import { ActionCards } from './ActionCards';
import { RecentProjects } from './RecentProjects';

interface HomeViewProps {
  onNewProject: () => void;
  onOpenProject: () => void;
  onSettings: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNewProject,
  onOpenProject,
  onSettings,
}) => {
  return (
    <div className="flex-1 flex overflow-hidden bg-[#090d18] text-[#f1f5f9]">
      {/* Sidebar */}
      <HomeSidebar onOpenSettings={onSettings} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 overflow-y-auto">
        <div className="w-full max-w-2xl text-center">
          {/* Header Title */}
          <h1 className="text-2xl font-bold text-[#f8fafc] tracking-tight">
            Build, debug, and ship automation flows
          </h1>
          <p className="text-xs text-[#94a3b8] mt-2">
            Visual workflow editor — from idea to product in just a few drag and drops.
          </p>

          {/* 3 Action Cards */}
          <ActionCards
            onNewProject={onNewProject}
            onOpenProject={onOpenProject}
            onSettings={onSettings}
          />

          {/* Recent Projects Section */}
          <RecentProjects />
        </div>
      </div>
    </div>
  );
};
