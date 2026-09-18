import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [authorInfo, setAuthorInfo] = useState('GPM Softwares - gpmsoftwares.com');
  const [defaultDelay, setDefaultDelay] = useState('1000,2000');
  const [defaultTimeout, setDefaultTimeout] = useState('60');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 select-none animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e8e8e8]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f0f0] bg-[#fafafa]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-[#1677ff] flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#1f1f1f]">Preferences & Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8c8c8c] hover:text-[#262626] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#595959] mb-1.5">
              Default Author Info (SKILL.md)
            </label>
            <input
              type="text"
              value={authorInfo}
              onChange={(e) => setAuthorInfo(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#d9d9d9] rounded-lg hover:border-[#4096ff] focus:border-[#1677ff] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#595959] mb-1.5">
              Default Action Delay (ms)
            </label>
            <input
              type="text"
              value={defaultDelay}
              onChange={(e) => setDefaultDelay(e.target.value)}
              placeholder="1000,2000"
              className="w-full px-3 py-1.5 text-xs border border-[#d9d9d9] rounded-lg hover:border-[#4096ff] focus:border-[#1677ff] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#595959] mb-1.5">
              Default Browser Timeout (s)
            </label>
            <input
              type="number"
              value={defaultTimeout}
              onChange={(e) => setDefaultTimeout(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#d9d9d9] rounded-lg hover:border-[#4096ff] focus:border-[#1677ff] focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#f0f0f0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-[#595959] hover:bg-[#f5f5f5] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition-colors shadow-sm"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
