import React from 'react';
import { Folder } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export const RecentProjects: React.FC = () => {
  const { recentProjects, openProjectByPath } = useProject();

  if (recentProjects.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 select-none text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#162236]">
        <span className="text-xs font-semibold text-[#94a3b8]">Recent Project</span>
        <span className="text-xs text-[#64748b]">{recentProjects.length} project(s)</span>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {recentProjects.map((project) => (
          <div
            key={project.id || project.path}
            onClick={() => openProjectByPath(project.path, project.name)}
            className="flex items-start space-x-3 p-3 rounded-xl bg-[#0d1527] hover:bg-[#121c33] border border-[#1a263d] hover:border-[#38bdf8]/40 transition-all cursor-pointer group text-left shadow-xs"
          >
            <div className="mt-0.5 shrink-0">
              <Folder className="w-4 h-4 text-[#38bdf8] fill-[#38bdf8] group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold text-[#f1f5f9] group-hover:text-[#38bdf8] transition-colors">
                {project.name}
              </div>
              <div className="text-[11px] text-[#64748b] truncate font-normal mt-0.5">
                {project.path}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
