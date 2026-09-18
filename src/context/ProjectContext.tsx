import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ProjectData, ActionNode, BaseNode, NormalBlockNode, BlockNode, WorkflowNode, ForBlockNode, IfBlockNode, WhileBlockNode, EditorFile } from '../types/gscript';
import { RecentProject, ActionDefinition, ActiveScreen } from '../types/ui';
import { createDefaultProject, createDefaultNormalBlock, generateGuid, serializeRawInput } from '../utils/gpmUtils';

export const SYSTEM_VARIABLES = [
  'profileName',
  'profileId',
  'profileProxy',
  'loopIndex',
  'inputExcel',
  'inputExcelFileLocation',
  'inputExcelTotalRows',
  'inputExcelCurrentRow',
];

export const extractProjectOutputVariables = (project: ProjectData | null): string[] => {
  if (!project || !project.script) return [];
  const vars = new Set<string>();

  const traverse = (node: WorkflowNode) => {
    if (!node) return;
    if ('output_variable_name' in node && (node as ActionNode).output_variable_name) {
      const name = (node as ActionNode).output_variable_name?.trim();
      if (name) {
        const clean = name.startsWith('$') ? name.substring(1) : name;
        if (clean) vars.add(clean);
      }
    }
    if ('nodes' in node && Array.isArray((node as any).nodes)) {
      for (const child of (node as any).nodes) {
        traverse(child);
      }
    }
  };

  if (project.script.before_init) traverse(project.script.before_init);
  if (project.script.main_logic) traverse(project.script.main_logic);
  if (project.script.after_quit) traverse(project.script.after_quit);

  return Array.from(vars);
};

interface ProjectContextType {
  screen: ActiveScreen;
  setScreen: (screen: ActiveScreen) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentProject: ProjectData | null;
  recentProjects: RecentProject[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  selectedBlockKey: 'before_init' | 'main_logic' | 'after_quit';
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  showSaveToast: boolean;
  setShowSaveToast: (show: boolean) => void;
  showTestModal: boolean;
  setShowTestModal: (show: boolean) => void;
  showRuntimeModal: boolean;
  setShowRuntimeModal: (show: boolean) => void;
  allVariables: string[];
  customVariables: string[];
  createNewProject: (name: string, folderPath: string, meta?: { description?: string | null; author_info?: string; version?: string }) => Promise<void>;
  openProjectByPath: (path: string, name?: string) => Promise<void>;
  closeProject: () => void;
  saveProject: () => Promise<void>;
  selectNode: (id: string | null, blockKey?: 'before_init' | 'main_logic' | 'after_quit', isMulti?: boolean, isRange?: boolean) => void;
  selectAllNodes: () => void;
  updateNode: (id: string, updates: Partial<any>) => void;
  insertActionOrBlock: (actionDef: ActionDefinition, targetId?: string | null, position?: 'before' | 'after' | 'inside') => void;
  deleteSelectedNode: () => void;
  getSelectedNode: () => WorkflowNode | null;
  toggleBlockExpand: (blockId: string) => void;
  moveNode: (draggedId: string, targetId: string, position?: 'before' | 'after' | 'inside' | number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  copySelectedNode: () => void;
  cutSelectedNode: () => void;
  pasteCopiedNode: () => void;
  duplicateSelectedNode: () => void;
  clearWorkflow: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<ActiveScreen>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('gpm_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'light';
  });
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(() => {
    const saved = localStorage.getItem('gpm_recent_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedBlockKey, setSelectedBlockKey] = useState<'before_init' | 'main_logic' | 'after_quit'>('before_init');
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [showRuntimeModal, setShowRuntimeModal] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<EditorFile[]>([]);
  const [redoStack, setRedoStack] = useState<EditorFile[]>([]);
  const lastUpdateNodeIdRef = useRef<string | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Sync theme to <html> class
  useEffect(() => {
    localStorage.setItem('gpm_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('gpm_recent_projects', JSON.stringify(recentProjects));
  }, [recentProjects]);

  const createNewProject = async (
    name: string,
    folderPath: string,
    meta?: { description?: string | null; author_info?: string; version?: string }
  ) => {
    const newProj = createDefaultProject(name, folderPath);
    if (meta?.description !== undefined) newProj.info.description = meta.description;
    if (meta?.author_info) newProj.info.author_info = meta.author_info;
    if (meta?.version) newProj.info.version = meta.version;

    // Default 3 blocks
    newProj.script.before_init.expanded = true;
    newProj.script.main_logic.expanded = false;
    newProj.script.after_quit.expanded = false;

    // Save physically to disk if in Electron
    if ((window as any).electronAPI?.saveProjectToDisk) {
      await (window as any).electronAPI.saveProjectToDisk(newProj);
    }
    localStorage.setItem(`gpm_project_${folderPath}`, JSON.stringify(newProj));

    setCurrentProject(newProj);

    // Update Recents
    const existing = recentProjects.filter(p => p.path !== folderPath);
    setRecentProjects([
      { id: generateGuid(), name, path: folderPath, lastOpened: new Date().toISOString() },
      ...existing,
    ]);

    setScreen('editor');
    setUndoStack([]);
    setRedoStack([]);
    // Default select the first block
    setSelectedNodeId(newProj.script.before_init.id);
    setSelectedNodeIds([newProj.script.before_init.id]);
    setSelectedBlockKey('before_init');
  };

  const openProjectByPath = async (path: string, name?: string) => {
    let proj: ProjectData | null = null;

    if ((window as any).electronAPI?.readProjectFromDisk) {
      const res = await (window as any).electronAPI.readProjectFromDisk(path);
      if (res.success && res.project) {
        proj = res.project;
      }
    }

    if (!proj) {
      const saved = localStorage.getItem(`gpm_project_${path}`);
      if (saved) {
        proj = JSON.parse(saved);
      }
    }

    if (!proj) {
      const projName = name || path.split('\\').pop() || 'Project';
      proj = createDefaultProject(projName, path);
    }

    setCurrentProject(proj);
    setScreen('editor');
    setUndoStack([]);
    setRedoStack([]);
    setSelectedNodeId(proj.script.before_init.id);
    setSelectedNodeIds([proj.script.before_init.id]);
  };

  const closeProject = () => {
    setCurrentProject(null);
    setScreen('home');
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
    setUndoStack([]);
    setRedoStack([]);
  };

  const saveProject = async () => {
    if (!currentProject) return;
    if ((window as any).electronAPI?.saveProjectToDisk) {
      await (window as any).electronAPI.saveProjectToDisk(currentProject);
    }
    localStorage.setItem(`gpm_project_${currentProject.folderPath}`, JSON.stringify(currentProject));
    setShowSaveToast(true);
  };

  // Helper to get all nodes in flat array preserving tree order
  const getAllFlatNodes = (project: ProjectData | null): WorkflowNode[] => {
    if (!project || !project.script) return [];
    const list: WorkflowNode[] = [];
    const traverse = (node: WorkflowNode) => {
      if (!node) return;
      list.push(node);
      if ('nodes' in node && Array.isArray((node as any).nodes)) {
        for (const child of (node as any).nodes) {
          traverse(child);
        }
      }
    };
    if (project.script.before_init) traverse(project.script.before_init);
    if (project.script.main_logic) traverse(project.script.main_logic);
    if (project.script.after_quit) traverse(project.script.after_quit);
    return list;
  };

  const selectNode = (
    id: string | null,
    blockKey?: 'before_init' | 'main_logic' | 'after_quit',
    isMulti?: boolean,
    isRange?: boolean
  ) => {
    if (!id) {
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
      return;
    }

    if (blockKey) {
      setSelectedBlockKey(blockKey);
    }

    if (isMulti) {
      // Ctrl + Click: toggle this node into/out of selectedNodeIds
      setSelectedNodeIds(prev => {
        const exists = prev.includes(id);
        const next = exists ? prev.filter(x => x !== id) : [...prev, id];
        setSelectedNodeId(next.length > 0 ? next[next.length - 1] : null);
        return next;
      });
    } else if (isRange && selectedNodeId) {
      // Shift + Click: select contiguous range between previous selectedNodeId and clicked id
      const flat = getAllFlatNodes(currentProject);
      const startIdx = flat.findIndex(n => n.id === selectedNodeId);
      const endIdx = flat.findIndex(n => n.id === id);
      if (startIdx !== -1 && endIdx !== -1) {
        const low = Math.min(startIdx, endIdx);
        const high = Math.max(startIdx, endIdx);
        const rangeIds = flat.slice(low, high + 1).map(n => n.id);
        setSelectedNodeIds(rangeIds);
        setSelectedNodeId(id);
      } else {
        setSelectedNodeId(id);
        setSelectedNodeIds([id]);
      }
    } else {
      // Normal single selection
      setSelectedNodeId(id);
      setSelectedNodeIds([id]);
    }
  };

  const selectAllNodes = () => {
    if (!currentProject) return;
    const flat = getAllFlatNodes(currentProject);
    const rootIds = [
      currentProject.script.before_init.id,
      currentProject.script.main_logic.id,
      currentProject.script.after_quit.id,
    ];
    const selectable = flat.filter(n => !rootIds.includes(n.id)).map(n => n.id);
    if (selectable.length > 0) {
      setSelectedNodeIds(selectable);
      setSelectedNodeId(selectable[0]);
    }
  };

  // Helper to find a node recursively
  const findNodeRecursive = (nodes: WorkflowNode[], id: string): WorkflowNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if ('nodes' in n && Array.isArray((n as any).nodes)) {
        const found = findNodeRecursive((n as any).nodes, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getSelectedNode = (): WorkflowNode | null => {
    if (!currentProject || !selectedNodeId) return null;
    const roots = [currentProject.script.before_init, currentProject.script.main_logic, currentProject.script.after_quit];
    for (const r of roots) {
      if (r.id === selectedNodeId) return r;
      const found = findNodeRecursive(r.nodes, selectedNodeId);
      if (found) return found;
    }
    return null;
  };

  // Helper to find parent block of an id
  const findParentBlock = (parent: WorkflowNode, childId: string): WorkflowNode | null => {
    if (!('nodes' in parent)) return null;
    const children = (parent as any).nodes as WorkflowNode[];
    for (const ch of children) {
      if (ch.id === childId) return parent;
      if ('nodes' in ch) {
        const p = findParentBlock(ch, childId);
        if (p) return p;
      }
    }
    return null;
  };

  const updateNodeRecursive = (nodes: WorkflowNode[], id: string, updates: Partial<any>): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        nodes[i] = { ...nodes[i], ...updates };
        return true;
      }
      if ('nodes' in nodes[i] && Array.isArray((nodes[i] as any).nodes)) {
        if (updateNodeRecursive((nodes[i] as any).nodes, id, updates)) {
          return true;
        }
      }
    }
    return false;
  };

  const cloneNodeWithNewIds = (node: WorkflowNode): WorkflowNode => {
    const cloned = JSON.parse(JSON.stringify(node)) as WorkflowNode;
    const renewIds = (n: WorkflowNode) => {
      n.id = generateGuid();
      if ('nodes' in n && Array.isArray((n as any).nodes)) {
        (n as any).nodes.forEach((child: WorkflowNode) => renewIds(child));
      }
    };
    renewIds(cloned);
    return cloned;
  };

  const pushUndoSnapshot = (prevScript: EditorFile) => {
    setUndoStack(prev => {
      const next = [...prev, JSON.parse(JSON.stringify(prevScript))];
      if (next.length > 50) next.shift();
      return next;
    });
    setRedoStack([]);
  };

  const undo = () => {
    if (!currentProject || undoStack.length === 0) return;
    const prevScript = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const currentSnapshot = JSON.parse(JSON.stringify(currentProject.script));

    setRedoStack(prev => [...prev, currentSnapshot]);
    setUndoStack(newUndoStack);
    setCurrentProject({ ...currentProject, script: prevScript });
  };

  const redo = () => {
    if (!currentProject || redoStack.length === 0) return;
    const nextScript = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const currentSnapshot = JSON.parse(JSON.stringify(currentProject.script));

    setUndoStack(prev => [...prev, currentSnapshot]);
    setRedoStack(newRedoStack);
    setCurrentProject({ ...currentProject, script: nextScript });
  };

  const updateNode = (id: string, updates: Partial<any>) => {
    if (!currentProject) return;
    const now = Date.now();
    if (lastUpdateNodeIdRef.current !== id || now - lastUpdateTimeRef.current > 800) {
      pushUndoSnapshot(currentProject.script);
      lastUpdateNodeIdRef.current = id;
    }
    lastUpdateTimeRef.current = now;

    const newScript = { ...currentProject.script };
    const roots: ('before_init' | 'main_logic' | 'after_quit')[] = ['before_init', 'main_logic', 'after_quit'];

    for (const bk of roots) {
      const r = newScript[bk];
      if (r.id === id) {
        newScript[bk] = { ...r, ...updates };
        setCurrentProject({ ...currentProject, script: newScript });
        return;
      }
      if (updateNodeRecursive(r.nodes, id, updates)) {
        setCurrentProject({ ...currentProject, script: newScript });
        return;
      }
    }
  };

  const toggleBlockExpand = (blockId: string) => {
    if (!currentProject) return;
    const newScript = { ...currentProject.script };
    const roots: ('before_init' | 'main_logic' | 'after_quit')[] = ['before_init', 'main_logic', 'after_quit'];

    for (const bk of roots) {
      const r = newScript[bk];
      if (r.id === blockId) {
        r.expanded = !r.expanded;
        setCurrentProject({ ...currentProject, script: newScript });
        return;
      }
      const findAndToggle = (nodes: WorkflowNode[]): boolean => {
        for (const n of nodes) {
          if (n.id === blockId && 'nodes' in n) {
            (n as any).expanded = !(n as any).expanded;
            return true;
          }
          if ('nodes' in n && Array.isArray((n as any).nodes)) {
            if (findAndToggle((n as any).nodes)) return true;
          }
        }
        return false;
      };
      if (findAndToggle(r.nodes)) {
        setCurrentProject({ ...currentProject, script: newScript });
        return;
      }
    }
  };

  // MAIN INSERTION: Double click / drop adds to bottom of selected block
  const insertActionOrBlock = (
    actionDef: ActionDefinition,
    explicitTargetId?: string | null,
    position: 'before' | 'after' | 'inside' = 'after'
  ) => {
    if (!currentProject) return;
    pushUndoSnapshot(currentProject.script);

    const newScript = JSON.parse(JSON.stringify(currentProject.script)) as EditorFile;
    const roots = [newScript.before_init, newScript.main_logic, newScript.after_quit];

    // Determine target ID
    const targetId = explicitTargetId || selectedNodeId;

    // Create the node
    let newNode: WorkflowNode;

    // Check if it's a Block type
    if (actionDef.category === 'Block' || (actionDef.type >= 101 && actionDef.type <= 106)) {
      const baseBlock = {
        nodes: [],
        expanded: true,
        continue_on_error: false,
        id: generateGuid(),
        display_text: actionDef.name,
        raw_input: null,
        comment: null,
      };

      if (actionDef.name === 'For' || actionDef.type === 102) {
        newNode = {
          ...baseBlock,
          $type: 'GPMAutomateEditor.Models.ForBlockNode, GPMAutomateEditor.Models',
          start: '0',
          end: '10',
          step: '1',
        } as ForBlockNode;
      } else if (actionDef.name === 'While' || actionDef.type === 103) {
        newNode = {
          ...baseBlock,
          $type: 'GPMAutomateEditor.Models.WhileBlockNode, GPMAutomateEditor.Models',
          condition: 'hasElement(//div)',
        } as WhileBlockNode;
      } else if (actionDef.name.toLowerCase().includes('else if') || actionDef.type === 105) {
        newNode = {
          ...baseBlock,
          $type: 'GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models',
          condition: '$x = 2',
          display_text: 'Else if',
        } as IfBlockNode;
      } else if (actionDef.name.toLowerCase() === 'else' || actionDef.type === 106) {
        newNode = {
          ...baseBlock,
          $type: 'GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models',
          display_text: 'Else',
        } as NormalBlockNode;
      } else if (actionDef.name.startsWith('If') || actionDef.type === 104) {
        newNode = {
          ...baseBlock,
          $type: 'GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models',
          condition: '$x = 1',
        } as IfBlockNode;
      } else {
        newNode = {
          ...baseBlock,
          $type: 'GPMAutomateEditor.Models.NormalBlockNode, GPMAutomateEditor.Models',
        } as NormalBlockNode;
      }
    } else {
      // It's a standard ActionNode
      newNode = {
        $type: 'GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models',
        type: actionDef.type,
        element_xpath: actionDef.hasXPath ? '' : null,
        output_variable_name: actionDef.hasOutVar ? (actionDef.defaultOutVar || '') : null,
        delay: actionDef.defaultDelay !== undefined ? actionDef.defaultDelay : '0,0',
        continue_on_error: false,
        id: generateGuid(),
        display_text: actionDef.name,
        raw_input: actionDef.defaultRawInput ? serializeRawInput(actionDef.defaultRawInput) : '[]',
        comment: null,
      };
    }

    let inserted = false;

    if (targetId) {
      // 1. If target is one of the 3 root workflow blocks
      const matchedRoot = roots.find(r => r.id === targetId);
      if (matchedRoot) {
        if (position === 'before') {
          matchedRoot.nodes.unshift(newNode);
        } else {
          matchedRoot.nodes.push(newNode);
        }
        matchedRoot.expanded = true;
        inserted = true;
      } else {
        // 2. Search inside child trees
        const insertNearTarget = (arr: WorkflowNode[]): boolean => {
          const idx = arr.findIndex(n => n.id === targetId);
          if (idx !== -1) {
            const targetNode = arr[idx];
            if ('nodes' in targetNode && Array.isArray((targetNode as any).nodes) && position === 'inside') {
              (targetNode as any).nodes.push(newNode);
              (targetNode as any).expanded = true;
            } else if (position === 'before') {
              arr.splice(idx, 0, newNode);
            } else {
              // position === 'after'
              arr.splice(idx + 1, 0, newNode);
            }
            return true;
          }
          for (const item of arr) {
            if ('nodes' in item && Array.isArray((item as any).nodes)) {
              if (insertNearTarget((item as any).nodes)) return true;
            }
          }
          return false;
        };

        for (const r of roots) {
          if (insertNearTarget(r.nodes)) {
            inserted = true;
            break;
          }
        }
      }
    }

    // Default fallback if no target or target not found
    if (!inserted) {
      newScript[selectedBlockKey].nodes.push(newNode);
      newScript[selectedBlockKey].expanded = true;
    }

    setCurrentProject({ ...currentProject, script: newScript });
    setSelectedNodeId(newNode.id);
    setSelectedNodeIds([newNode.id]);
  };

  const deleteSelectedNode = () => {
    if (!currentProject) return;
    const roots = [
      currentProject.script.before_init.id,
      currentProject.script.main_logic.id,
      currentProject.script.after_quit.id,
    ];
    const targetIds = (selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []))
      .filter(id => !roots.includes(id));

    if (targetIds.length === 0) return;

    pushUndoSnapshot(currentProject.script);
    const newScript = JSON.parse(JSON.stringify(currentProject.script)) as EditorFile;
    const rootBlocks = [newScript.before_init, newScript.main_logic, newScript.after_quit];
    const targetSet = new Set(targetIds);

    const deleteRecursive = (arr: WorkflowNode[]) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (targetSet.has(arr[i].id)) {
          arr.splice(i, 1);
        } else if ('nodes' in arr[i] && Array.isArray((arr[i] as any).nodes)) {
          deleteRecursive((arr[i] as any).nodes);
        }
      }
    };

    for (const r of rootBlocks) {
      deleteRecursive(r.nodes);
    }

    setCurrentProject({ ...currentProject, script: newScript });
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
  };

  const copySelectedNode = () => {
    if (!currentProject) return;
    const roots = [
      currentProject.script.before_init.id,
      currentProject.script.main_logic.id,
      currentProject.script.after_quit.id,
    ];

    const targetIds = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
    const flat = getAllFlatNodes(currentProject);
    const nodesToCopy = flat.filter(n => targetIds.includes(n.id) && !roots.includes(n.id));

    if (nodesToCopy.length === 0) return;

    const serializedArray = JSON.stringify(nodesToCopy);
    sessionStorage.setItem('gpm_clipboard_nodes', serializedArray);
    sessionStorage.setItem('gpm_clipboard_node', JSON.stringify(nodesToCopy[0]));
    try {
      navigator.clipboard.writeText(serializedArray);
    } catch (_) {}
  };

  const cutSelectedNode = () => {
    copySelectedNode();
    deleteSelectedNode();
  };

  const pasteCopiedNode = () => {
    if (!currentProject) return;
    const rawList = sessionStorage.getItem('gpm_clipboard_nodes');
    const rawSingle = sessionStorage.getItem('gpm_clipboard_node');

    let sourceNodes: WorkflowNode[] = [];
    if (rawList) {
      try {
        const parsed = JSON.parse(rawList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          sourceNodes = parsed;
        }
      } catch (_) {}
    }
    if (sourceNodes.length === 0 && rawSingle) {
      try {
        const parsed = JSON.parse(rawSingle);
        if (parsed && typeof parsed === 'object') {
          sourceNodes = [parsed];
        }
      } catch (_) {}
    }

    if (sourceNodes.length === 0) return;

    const newNodes = sourceNodes.map(n => cloneNodeWithNewIds(n));
    const newIds = newNodes.map(n => n.id);

    const newScript = JSON.parse(JSON.stringify(currentProject.script)) as EditorFile;
    pushUndoSnapshot(currentProject.script);

    const rootBlocks = [newScript.before_init, newScript.main_logic, newScript.after_quit];
    let inserted = false;

    // Anchor at the last selected node or single selected node
    const anchorId = selectedNodeIds.length > 0 ? selectedNodeIds[selectedNodeIds.length - 1] : selectedNodeId;

    if (anchorId) {
      // If anchor is a root block
      const matchedRoot = rootBlocks.find(r => r.id === anchorId);
      if (matchedRoot) {
        matchedRoot.nodes.push(...newNodes);
        matchedRoot.expanded = true;
        inserted = true;
      } else {
        // If anchor is inside a block -> insert immediately after it
        const insertAfterChild = (arr: WorkflowNode[]): boolean => {
          const idx = arr.findIndex(n => n.id === anchorId);
          if (idx !== -1) {
            arr.splice(idx + 1, 0, ...newNodes);
            return true;
          }
          for (const ch of arr) {
            if ('nodes' in ch && Array.isArray((ch as any).nodes)) {
              if (insertAfterChild((ch as any).nodes)) return true;
            }
          }
          return false;
        };

        for (const root of rootBlocks) {
          if (insertAfterChild(root.nodes)) {
            inserted = true;
            break;
          }
        }

        // If not inserted after child, maybe anchor is a block -> append inside it
        if (!inserted) {
          const insertInBlock = (block: WorkflowNode): boolean => {
            if (block.id === anchorId && 'nodes' in block && Array.isArray((block as any).nodes)) {
              (block as any).nodes.push(...newNodes);
              (block as any).expanded = true;
              return true;
            }
            if ('nodes' in block && Array.isArray((block as any).nodes)) {
              for (const ch of (block as any).nodes) {
                if (insertInBlock(ch)) return true;
              }
            }
            return false;
          };

          for (const root of rootBlocks) {
            if (insertInBlock(root)) {
              inserted = true;
              break;
            }
          }
        }
      }
    }

    if (!inserted) {
      newScript[selectedBlockKey].nodes.push(...newNodes);
      newScript[selectedBlockKey].expanded = true;
    }

    setCurrentProject({ ...currentProject, script: newScript });
    setSelectedNodeIds(newIds);
    setSelectedNodeId(newIds[newIds.length - 1]);
  };

  const duplicateSelectedNode = () => {
    if (!currentProject) return;
    const roots = [
      currentProject.script.before_init.id,
      currentProject.script.main_logic.id,
      currentProject.script.after_quit.id,
    ];
    const targetIds = (selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []))
      .filter(id => !roots.includes(id));

    if (targetIds.length === 0) return;

    pushUndoSnapshot(currentProject.script);
    const newScript = JSON.parse(JSON.stringify(currentProject.script)) as EditorFile;
    const flat = getAllFlatNodes(currentProject);
    const nodesToDuplicate = flat.filter(n => targetIds.includes(n.id) && !roots.includes(n.id));
    if (nodesToDuplicate.length === 0) return;

    const clonedNodes = nodesToDuplicate.map(n => cloneNodeWithNewIds(n));
    const newIds = clonedNodes.map(n => n.id);

    // Insert after the last selected node
    const lastTargetId = targetIds[targetIds.length - 1];
    const rootBlocks = [newScript.before_init, newScript.main_logic, newScript.after_quit];

    let inserted = false;
    const insertAfterChild = (arr: WorkflowNode[]): boolean => {
      const idx = arr.findIndex(n => n.id === lastTargetId);
      if (idx !== -1) {
        arr.splice(idx + 1, 0, ...clonedNodes);
        return true;
      }
      for (const ch of arr) {
        if ('nodes' in ch && Array.isArray((ch as any).nodes)) {
          if (insertAfterChild((ch as any).nodes)) return true;
        }
      }
      return false;
    };

    for (const root of rootBlocks) {
      if (insertAfterChild(root.nodes)) {
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      newScript[selectedBlockKey].nodes.push(...clonedNodes);
    }

    setCurrentProject({ ...currentProject, script: newScript });
    setSelectedNodeIds(newIds);
    setSelectedNodeId(newIds[newIds.length - 1]);
  };

  const clearWorkflow = () => {
    if (!currentProject) return;
    if (confirm('Are you sure you want to clear all nodes in the current workflow?')) {
      pushUndoSnapshot(currentProject.script);
      const newScript = JSON.parse(JSON.stringify(currentProject.script)) as EditorFile;
      newScript[selectedBlockKey].nodes = [];
      setCurrentProject({ ...currentProject, script: newScript });
      setSelectedNodeId(null);
      setSelectedNodeIds([]);
    }
  };

  const moveNode = (
    draggedId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside' | number = 'after'
  ) => {
    if (!currentProject || draggedId === targetId) return;
    pushUndoSnapshot(currentProject.script);
    const newScript = JSON.parse(JSON.stringify(currentProject.script)) as EditorFile;
    const roots = [newScript.before_init, newScript.main_logic, newScript.after_quit];

    // 1. Remove dragged node from the tree
    let extracted: WorkflowNode | null = null;
    const removeRecursive = (arr: WorkflowNode[]): boolean => {
      const idx = arr.findIndex(n => n.id === draggedId);
      if (idx !== -1) {
        extracted = arr.splice(idx, 1)[0];
        return true;
      }
      for (const item of arr) {
        if ('nodes' in item && Array.isArray((item as any).nodes)) {
          if (removeRecursive((item as any).nodes)) return true;
        }
      }
      return false;
    };

    for (const r of roots) {
      if (removeRecursive(r.nodes)) break;
    }

    if (!extracted) return;

    // Guard: Prevent dragging a parent block into its own child/descendant
    const isDescendant = (parent: WorkflowNode, checkId: string): boolean => {
      if ('nodes' in parent && Array.isArray((parent as any).nodes)) {
        for (const ch of (parent as any).nodes) {
          if (ch.id === checkId) return true;
          if (isDescendant(ch, checkId)) return true;
        }
      }
      return false;
    };
    if (isDescendant(extracted, targetId)) {
      return;
    }

    const itemToInsert: WorkflowNode = extracted;

    // 2. Insert extracted node relative to targetId
    let inserted = false;

    // Check if target is one of the 3 root workflow blocks
    const matchedRoot = roots.find(r => r.id === targetId);
    if (matchedRoot) {
      if (position === 'before' || position === 0) {
        matchedRoot.nodes.unshift(itemToInsert);
      } else if (typeof position === 'number') {
        matchedRoot.nodes.splice(position, 0, itemToInsert);
      } else {
        matchedRoot.nodes.push(itemToInsert);
      }
      matchedRoot.expanded = true;
      inserted = true;
    } else {
      // Find targetId in child trees
      const insertNearTarget = (arr: WorkflowNode[]): boolean => {
        const idx = arr.findIndex(n => n.id === targetId);
        if (idx !== -1) {
          const targetNode = arr[idx];
          if (
            'nodes' in targetNode &&
            Array.isArray((targetNode as any).nodes) &&
            (position === 'inside' || typeof position === 'number')
          ) {
            if (typeof position === 'number') {
              (targetNode as any).nodes.splice(position, 0, itemToInsert);
            } else {
              (targetNode as any).nodes.push(itemToInsert);
            }
            (targetNode as any).expanded = true;
          } else if (position === 'before') {
            arr.splice(idx, 0, itemToInsert);
          } else {
            // 'after'
            arr.splice(idx + 1, 0, itemToInsert);
          }
          return true;
        }
        for (const item of arr) {
          if ('nodes' in item && Array.isArray((item as any).nodes)) {
            if (insertNearTarget((item as any).nodes)) return true;
          }
        }
        return false;
      };

      for (const r of roots) {
        if (insertNearTarget(r.nodes)) {
          inserted = true;
          break;
        }
      }
    }

    if (inserted) {
      setCurrentProject({ ...currentProject, script: newScript });
      setSelectedNodeId(draggedId);
      setSelectedNodeIds([draggedId]);
    }
  };

  // Global keyboard listener for all shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      // Ctrl+S or Cmd+S to Save workflow (always active, even if in input)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveProject();
        return;
      }

      // Ctrl+Shift+N: Open New Window
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if ((window as any).electronAPI?.newWindow) {
          (window as any).electronAPI.newWindow();
        }
        return;
      }

      // If user is typing in an input/textarea, do not intercept native editing shortcuts!
      if (isInputFocused) {
        return;
      }

      // Ctrl+A: Select all workflow nodes
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        selectAllNodes();
        return;
      }

      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+C: Copy selected node(s)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        copySelectedNode();
        return;
      }

      // Ctrl+V: Paste copied node(s)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        pasteCopiedNode();
        return;
      }

      // Ctrl+X: Cut selected node(s)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        cutSelectedNode();
        return;
      }

      // Ctrl+D: Duplicate selected node(s)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        duplicateSelectedNode();
        return;
      }

      // Delete or Backspace: Delete selected node(s)
      if (e.key === 'Delete' || e.key === 'Del' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNode();
        return;
      }

      // Ctrl+F: Open search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedNodeIds, currentProject, undoStack, redoStack, selectedBlockKey]);

  const customVariables = extractProjectOutputVariables(currentProject);
  const allVariables = Array.from(new Set([...SYSTEM_VARIABLES, ...customVariables]));

  return (
    <ProjectContext.Provider
      value={{
        screen,
        setScreen,
        theme,
        toggleTheme,
        currentProject,
        recentProjects,
        selectedNodeId,
        selectedNodeIds,
        selectedBlockKey,
        showShortcuts,
        setShowShortcuts,
        showSaveToast,
        setShowSaveToast,
        showTestModal,
        setShowTestModal,
        showRuntimeModal,
        setShowRuntimeModal,
        allVariables,
        customVariables,
        createNewProject,
        openProjectByPath,
        closeProject,
        saveProject,
        selectNode,
        selectAllNodes,
        updateNode,
        insertActionOrBlock,
        deleteSelectedNode,
        getSelectedNode,
        toggleBlockExpand,
        moveNode,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undo,
        redo,
        copySelectedNode,
        cutSelectedNode,
        pasteCopiedNode,
        duplicateSelectedNode,
        clearWorkflow,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};
