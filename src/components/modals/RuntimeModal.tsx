import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Globe,
  Monitor,
  Smartphone,
  HelpCircle,
  Settings,
  Check,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Plus,
  Shield,
  Lightbulb,
  Play,
  Square,
  Pause,
  RotateCcw,
  AlertTriangle,
  Cpu,
  EyeOff,
  MousePointer,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Calendar,
  Layers,
  Terminal,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { WorkflowNode, ActionNode } from '../../types/gscript';
import {
  VIRTUAL_MOUSE_SCRIPT,
  getVirtualMouseClickXPathScript,
  getVirtualMouseClickCoordsScript,
} from '../../utils/virtualMouseScript';

interface RuntimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThreadState {
  id: number;
  port: number;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentAction: string;
  logs: Array<{ time: string; text: string; type: 'info' | 'success' | 'error' | 'arrow' }>;
}

function getJsonPath(obj: any, path: string) {
  if (!path || !obj) return obj;
  const cleanPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const parts = cleanPath.split('.').filter(Boolean);
  let cur = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[part];
  }
  return cur;
}

async function generateTOTP(secret: string): Promise<string> {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const cleanSecret = (secret || '').replace(/[\s=]+/g, '').toUpperCase();
  for (let i = 0; i < cleanSecret.length; i++) {
    const val = base32chars.indexOf(cleanSecret.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const keyBytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    keyBytes[i / 8] = parseInt(bits.substr(i, 8), 2);
  }
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigUint64(0, BigInt(timeStep));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const dataView = new DataView(signature, offset, 4);
  const code = (dataView.getUint32(0) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
}

export const RuntimeModal: React.FC<RuntimeModalProps> = ({ isOpen, onClose }) => {
  const { currentProject } = useProject();

  // Wizard Step: 1 = Select app, 2 = Configure, 3 = Profile, 4 = Running
  const [step, setStep] = useState<number>(1);

  // Step 1: Session name
  const [sessionName, setSessionName] = useState<string>(() => {
    const projName = currentProject?.info.name || 'Untitled';
    const hash = Math.random().toString(16).substring(2, 10);
    return `${projName}-${hash}`;
  });

  // Step 2: Sub-tab under CONFIGURATION MENU
  const [configMenu, setConfigMenu] = useState<'inputs' | 'session' | 'schedule'>('inputs');

  // Step 2 Configurations (Images 3, 4, 5)
  const [windowWidth, setWindowWidth] = useState<number>(800);
  const [windowHeight, setWindowHeight] = useState<number>(600);
  const [windowScale, setWindowScale] = useState<number>(100);
  const [screenTarget, setScreenTarget] = useState<string>('Screen 1 • 1920x1080 (primary)');
  const [useInputExcel, setUseInputExcel] = useState<boolean>(false);

  // Session configuration
  const [numThreads, setNumThreads] = useState<number>(3); // User example: 2-3 threads
  const [threadDelay, setThreadDelay] = useState<number>(0);
  const [skipProxyCheck, setSkipProxyCheck] = useState<boolean>(false);
  const [workerProxies, setWorkerProxies] = useState<Record<number, string>>({});
  const [doNotCloseOnError, setDoNotCloseOnError] = useState<boolean>(false);
  const [performanceLimit, setPerformanceLimit] = useState<boolean>(false);
  const [hideWindowWhenDone, setHideWindowWhenDone] = useState<boolean>(false);
  const [useVirtualMouse, setUseVirtualMouse] = useState<boolean>(true); // [x] Use virtual mouse (Image 4)
  const [restartOnError, setRestartOnError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(3);

  // Schedule configuration (Image 5)
  const [useSchedule, setUseSchedule] = useState<boolean>(false);

  // Step 4: Running Multi-Thread State
  const [threads, setThreads] = useState<ThreadState[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const stopSignalRef = useRef<boolean>(false);

  // Initialize session name when currentProject changes
  useEffect(() => {
    if (currentProject?.info.name) {
      const hash = Math.random().toString(16).substring(2, 10);
      setSessionName(`${currentProject.info.name}-${hash}`);
    }
  }, [currentProject?.info.name]);

  // Elapsed timer when running
  useEffect(() => {
    let timer: any = null;
    if (isExecuting) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isExecuting]);

  if (!isOpen) return null;

  const appName = currentProject?.info.name || 'Untitled';
  const appPath = `C:\\Users\\Admin\\Desktop\\project\\${appName}`;

  const getTime = () => new Date().toLocaleTimeString('vi-VN', { hour12: false });
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Step navigation
  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
      startMultiThreadExecution();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  // Pre-generate thread list for Step 3 and 4
  const generateInitialThreads = (count: number): ThreadState[] => {
    const list: ThreadState[] = [];
    const basePort = 43076;
    for (let i = 1; i <= count; i++) {
      list.push({
        id: i,
        port: basePort + (i - 1),
        name: `Worker #${i}`,
        status: 'idle',
        currentAction: 'Ready',
        logs: [{ time: getTime(), text: `Worker #${i} initialized on port ${basePort + (i - 1)}`, type: 'info' }],
      });
    }
    return list;
  };

  // Multi-thread automation runner
  const startMultiThreadExecution = async () => {
    stopSignalRef.current = false;
    setIsExecuting(true);
    setElapsedSeconds(0);

    const initial = generateInitialThreads(numThreads);
    setThreads(initial);

    // Run each thread worker concurrently (each worker checks IP first, then opens Chrome)
    const threadPromises = initial.map(async (t, index) => {
      if (index > 0 && threadDelay > 0) {
        await sleep(index * threadDelay * 1000);
      }
      return runWorkerThread(t.id, t.port);
    });
    await Promise.all(threadPromises);

    setIsExecuting(false);
  };

  const updateThreadLog = (
    threadId: number,
    type: 'info' | 'success' | 'error' | 'arrow',
    text: string,
    currentAction?: string
  ) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            currentAction: currentAction !== undefined ? currentAction : t.currentAction,
            logs: [...t.logs, { time: getTime(), text, type }],
          };
        }
        return t;
      })
    );
  };

  const setThreadStatus = (threadId: number, status: ThreadState['status']) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, status } : t))
    );
  };

  // Run automation for a single worker thread
  const runWorkerThread = async (threadId: number, port: number) => {
    setThreadStatus(threadId, 'running');
    const proxy = workerProxies[threadId]?.trim();

    // 1. Check IP / Proxy before opening profile (unless Skip proxy check is ticked)
    if (!skipProxyCheck) {
      updateThreadLog(threadId, 'info', `🔍 Checking IP / Proxy connection before opening profile...`, 'Check IP');
      try {
        let ipResult: any = null;
        if ((window as any).electronAPI?.checkIp) {
          ipResult = await (window as any).electronAPI.checkIp({ proxy, timeoutMs: 6000 });
        } else {
          ipResult = await fetch('http://ip-api.com/json')
            .then((r) => r.json())
            .then((j) => ({ success: true, ip: j.query, country: j.country, isp: j.isp }))
            .catch((e) => ({ success: false, error: e.message }));
        }

        if (!ipResult || !ipResult.success) {
          const errMsg = ipResult?.error || 'Unable to connect to proxy/network';
          updateThreadLog(threadId, 'error', `✕ IP Check failed: ${errMsg}`);
          updateThreadLog(threadId, 'error', `■ Aborted opening profile (Protection: Invalid IP/Proxy)`, 'Error');
          setThreadStatus(threadId, 'error');
          return;
        }

        const ipInfo = `${ipResult.ip}${ipResult.country ? ` (${ipResult.country})` : ''}${ipResult.isp ? ` - ${ipResult.isp}` : ''}`;
        updateThreadLog(threadId, 'success', `✔ IP Check OK: ${ipInfo}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ IP Check error: ${e.message}`);
        updateThreadLog(threadId, 'error', `■ Aborted opening profile`, 'Error');
        setThreadStatus(threadId, 'error');
        return;
      }
    } else {
      updateThreadLog(threadId, 'info', `⚡ Skipping proxy check (Skip proxy check is enabled)`);
    }

    // 2. Launch Chrome for this worker
    updateThreadLog(threadId, 'info', `🚀 Opening Chrome for Worker #${threadId} on port ${port}...`, 'Open Chrome');
    if ((window as any).electronAPI?.launchBrowser) {
      const launchRes = await (window as any).electronAPI.launchBrowser({
        port,
        url: 'https://google.com',
        profileName: `ChromeProfile_Thread_${threadId}_${port}`,
        windowSize: { width: windowWidth, height: windowHeight },
        scale: windowScale,
        proxy,
      });
      if (launchRes && launchRes.success === false) {
        updateThreadLog(threadId, 'error', `✕ Failed to launch Chrome: ${launchRes.error || 'Unknown error'}`);
        setThreadStatus(threadId, 'error');
        return;
      }
    }

    // 3. Connect to Chrome on this port
    updateThreadLog(threadId, 'info', `▶ Connecting to Chrome on port ${port}...`, 'Connect CDP');
    let connected = false;
    for (let r = 0; r < 12; r++) {
      if (stopSignalRef.current) break;
      try {
        const res = (window as any).electronAPI?.testPort
          ? await (window as any).electronAPI.testPort(port)
          : await fetch(`http://127.0.0.1:${port}/json/version`).then((x) => x.json());
        if (res && (res.success || res.Browser)) {
          connected = true;
          break;
        }
      } catch (e) {}
      await sleep(700);
    }

    if (!connected) {
      updateThreadLog(threadId, 'error', `✕ Failed to connect to Chrome on port ${port}`);
      setThreadStatus(threadId, 'error');
      return;
    }

    updateThreadLog(threadId, 'success', `✔ Connected to Chrome (${port})`);

    // If Use Virtual Mouse is enabled, inject persistent virtual mouse into this Chrome thread
    if (useVirtualMouse && (window as any).electronAPI?.cdpAction) {
      updateThreadLog(threadId, 'info', `🖱 Initializing independent Virtual Mouse for Worker #${threadId}...`);
      await (window as any).electronAPI.cdpAction({
        port,
        action: 'initVirtualMouse',
        payload: { script: VIRTUAL_MOUSE_SCRIPT },
      }).catch(() => {});
      updateThreadLog(threadId, 'success', `✔ Virtual Mouse active (Persistent red cursor)`);
    }

    // Collect workflow nodes to execute
    const nodes: WorkflowNode[] = [
      ...(currentProject?.script?.before_init?.nodes || []),
      ...(currentProject?.script?.main_logic?.nodes || []),
      ...(currentProject?.script?.after_quit?.nodes || []),
    ];

    const threadVars: Record<string, string> = {
      $threadId: String(threadId),
      $port: String(port),
      threadId: String(threadId),
    };

    // Execute nodes sequentially for this thread
    for (const n of nodes) {
      if (stopSignalRef.current) break;
      if (!('nodes' in n)) {
        const act = n as ActionNode;
        await executeThreadAction(threadId, port, act, threadVars);
      }
    }

    if (stopSignalRef.current) {
      setThreadStatus(threadId, 'idle');
      updateThreadLog(threadId, 'error', `■ Thread stopped by user`);
    } else {
      setThreadStatus(threadId, 'completed');
      updateThreadLog(threadId, 'success', `✔ Workflow finished successfully!`, 'Completed');
    }
  };

  // Execute a single action within a specific thread's Chrome instance
  const executeThreadAction = async (
    threadId: number,
    port: number,
    act: ActionNode,
    vars: Record<string, string>
  ) => {
    const actType = act.type;
    const actName = (act.display_text || '').toLowerCase();

    const resolveStr = (s: string) => {
      if (!s) return '';
      let r = s;
      for (const [k, v] of Object.entries(vars)) {
        r = r.replace(new RegExp(`\\$${k.replace(/^\$/, '')}\\b`, 'g'), v);
      }
      return r;
    };

    const getRawVal = (key: string, fb: string = '') => {
      try {
        const p = typeof act.raw_input === 'string' ? JSON.parse(act.raw_input) : act.raw_input;
        if (Array.isArray(p)) {
          const item = p.find((x: any) => x.Key === key);
          if (item && item.Value !== undefined) return item.Value;
        }
      } catch (e) {}
      return fb;
    };

    // Go to URL (type 39)
    if (actType === 39 || actName === 'go to url') {
      let url = resolveStr(getRawVal('URL', 'https://google.com'));
      if (!url.startsWith('http')) url = `https://${url}`;
      updateThreadLog(threadId, 'info', `▶ Navigate › ${url}`, `Navigating: ${url}`);
      if ((window as any).electronAPI?.cdpAction) {
        await (window as any).electronAPI.cdpAction({
          port,
          action: 'goToUrl',
          payload: { url },
        });
      }
      // Re-inject virtual mouse after page load if virtual mouse is on
      if (useVirtualMouse) {
        await sleep(600);
        await (window as any).electronAPI?.cdpAction({
          port,
          action: 'evaluate',
          payload: { expression: VIRTUAL_MOUSE_SCRIPT },
        }).catch(() => {});
      }
      updateThreadLog(threadId, 'success', `✔ Navigate › ${url}`);
      await sleep(200);
    }
    // Wait element (type 44)
    else if (actType === 44 || actName === 'wait element') {
      const xpath = resolveStr(act.element_xpath || '');
      const timeoutSec = parseInt(getRawVal('TIME_OUT', '20'), 10) || 20;
      updateThreadLog(threadId, 'info', `▶ Wait element › ${xpath} (${timeoutSec}s)`, `Waiting: ${xpath}`);

      const start = Date.now();
      let found = false;
      while (Date.now() - start < timeoutSec * 1000 && !stopSignalRef.current) {
        const checkScript = `(() => {
          try {
            const res = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return !!res.singleNodeValue;
          } catch(e) { return false; }
        })()`;
        const res = await (window as any).electronAPI?.cdpAction({
          port,
          action: 'evaluate',
          payload: { expression: checkScript },
        });
        if (res && res.value === true) {
          found = true;
          break;
        }
        await sleep(350);
      }
      if (found) {
        updateThreadLog(threadId, 'success', `✔ Found element › ${xpath}`);
      } else {
        updateThreadLog(threadId, 'error', `✕ Element not found within ${timeoutSec}s`);
      }
    }
    // Mouse click (type 48) with Virtual Mouse!
    else if (actType === 48 || actName === 'mouse click') {
      const clickType = getRawVal('CLICK_TYPE', 'CLICK_XPATH');
      const xpath = resolveStr(getRawVal('XPATH', act.element_xpath || ''));
      const pos = resolveStr(getRawVal('POS', ''));

      if (clickType === 'CLICK_COORDINATES' || (!xpath && pos)) {
        const [xStr, yStr] = pos.split(',');
        const x = parseFloat(xStr) || 100;
        const y = parseFloat(yStr) || 100;
        updateThreadLog(
          threadId,
          'info',
          `▶ ${useVirtualMouse ? 'Virtual Mouse click' : 'Mouse click'} › [${x}, ${y}]`,
          `Clicking: [${x}, ${y}]`
        );

        if (useVirtualMouse) {
          // Move virtual red cursor smoothly and click with ripple!
          await (window as any).electronAPI?.cdpAction({
            port,
            action: 'evaluate',
            payload: { expression: getVirtualMouseClickCoordsScript(x, y) },
          });
        } else {
          await (window as any).electronAPI?.cdpAction({
            port,
            action: 'clickCoordinates',
            payload: { x, y },
          });
        }
        updateThreadLog(threadId, 'success', `✔ Clicked coordinates [${x}, ${y}]`);
      } else {
        // Click by XPath
        updateThreadLog(
          threadId,
          'info',
          `▶ ${useVirtualMouse ? 'Virtual Mouse click' : 'Mouse click'} › XPath: ${xpath || '(empty)'}`,
          `Clicking: ${xpath}`
        );

        if (xpath) {
          if (useVirtualMouse) {
            // Move virtual red cursor smoothly over Bezier curve to element and trigger realistic click!
            const evalRes = await (window as any).electronAPI?.cdpAction({
              port,
              action: 'evaluate',
              payload: { expression: getVirtualMouseClickXPathScript(xpath) },
            });
            if (evalRes && evalRes.value && evalRes.value.success) {
              updateThreadLog(threadId, 'success', `✔ Virtual Mouse smoothly clicked element`);
            } else {
              updateThreadLog(threadId, 'error', `✕ Virtual Mouse: ${evalRes?.value?.error || 'Element not found'}`);
            }
          } else {
            // Standard click
            const clickScript = `(() => {
              try {
                const el = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (!el) return false;
                el.scrollIntoView({ block: 'center' });
                el.click();
                return true;
              } catch(e) { return false; }
            })()`;
            await (window as any).electronAPI?.cdpAction({
              port,
              action: 'evaluate',
              payload: { expression: clickScript },
            });
            updateThreadLog(threadId, 'success', `✔ Element clicked`);
          }
        }
      }
      await sleep(150);
    }
    // Mouse try to click (type 49)
    else if (actType === 49 || actName === 'mouse try to click') {
      const clickType = getRawVal('CLICK_TYPE', 'Click by Xpath');
      const xpath = resolveStr(getRawVal('XPATH', act.element_xpath || ''));
      const pos = resolveStr(getRawVal('POS', ''));
      const numTries = parseInt(resolveStr(getRawVal('NUMBER_OF_TRIES', '5')), 10) || 5;
      const delayEachSec = parseFloat(resolveStr(getRawVal('DELAY_EACH_CLICK', '2'))) || 2;
      const stopCondition = resolveStr(getRawVal('STOP_CONDITION', '')).trim();

      updateThreadLog(threadId, 'info', `▶ Mouse try to click (max ${numTries} tries, delay ${delayEachSec}s)`, 'Mouse try to click');

      let conditionMet = false;
      for (let attempt = 1; attempt <= numTries; attempt++) {
        if (stopSignalRef.current) break;

        if (clickType === 'Click by coordinates' || clickType === 'CLICK_COORDINATES' || (!xpath && pos)) {
          const [xStr, yStr] = pos.split(',');
          const x = parseFloat(xStr) || 100;
          const y = parseFloat(yStr) || 100;
          if (useVirtualMouse) {
            await (window as any).electronAPI?.cdpAction({
              port,
              action: 'evaluate',
              payload: { expression: getVirtualMouseClickCoordsScript(x, y) },
            });
          } else {
            await (window as any).electronAPI?.cdpAction({ port, action: 'clickCoordinates', payload: { x, y } });
          }
        } else if (clickType === 'Click current position' || clickType === 'CLICK_CURRENT_POS') {
          await (window as any).electronAPI?.cdpAction({
            port,
            action: 'evaluate',
            payload: { expression: `(() => { if (document.activeElement && typeof document.activeElement.click === 'function') document.activeElement.click(); })()` },
          });
        } else if (xpath) {
          if (useVirtualMouse) {
            await (window as any).electronAPI?.cdpAction({
              port,
              action: 'evaluate',
              payload: { expression: getVirtualMouseClickXPathScript(xpath) },
            });
          } else {
            const clickScript = `(() => { try { const el = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; if (el) { el.scrollIntoView({ block: 'center' }); el.click(); return true; } } catch(e) {} return false; })()`;
            await (window as any).electronAPI?.cdpAction({ port, action: 'evaluate', payload: { expression: clickScript } });
          }
        }

        updateThreadLog(threadId, 'info', `  ↳ Click attempt #${attempt}/${numTries}`);

        if (delayEachSec > 0) {
          await sleep(delayEachSec * 1000);
        }

        if (stopCondition) {
          let testScript = '';
          const hasElemMatch = stopCondition.match(/^(!?)\s*hasElement\((.+)\)$/i);
          if (hasElemMatch) {
            const isNegated = hasElemMatch[1] === '!';
            const targetXpath = hasElemMatch[2].replace(/^["']|["']$/g, '');
            testScript = `(() => {
              try {
                const res = document.evaluate(${JSON.stringify(targetXpath)}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const found = !!res.singleNodeValue;
                return ${isNegated ? '!found' : 'found'};
              } catch(e) { return false; }
            })()`;
          } else {
            testScript = `(() => { try { return Boolean(${stopCondition}); } catch(e) { return false; } })()`;
          }

          const evalRes = await (window as any).electronAPI?.cdpAction({
            port,
            action: 'evaluate',
            payload: { expression: testScript },
          });
          if (evalRes && (evalRes.value === true || evalRes.result?.value === true)) {
            conditionMet = true;
            updateThreadLog(threadId, 'success', `✔ Mouse try to click › Condition met at attempt #${attempt} (${stopCondition})`);
            break;
          }
        }
      }

      if (!conditionMet) {
        updateThreadLog(threadId, 'success', `✔ Mouse try to click › Completed all ${numTries} attempts`);
      }
      await sleep(150);
    }
    // Wait URL Changed (type 43)
    else if (actType === 43 || actName === 'wait url changed') {
      const rawCurrentUrl = getRawVal('CURRENT_URL', '').trim();
      const timeoutSec = parseInt(getRawVal('TIME_OUT', '60'), 10) || 60;
      const resolvedCurrentUrl = resolveStr(rawCurrentUrl);

      let initialUrl = resolvedCurrentUrl;
      if (!initialUrl) {
        const res = await (window as any).electronAPI?.cdpAction({
          port,
          action: 'evaluate',
          payload: { expression: 'window.location.href' },
        });
        initialUrl = res?.value || res?.result?.value || '';
      }

      updateThreadLog(threadId, 'info', `▶ Wait URL Changed (timeout ${timeoutSec}s, baseline: "${initialUrl}")`, 'Wait URL Changed');
      const startTime = Date.now();
      let urlChanged = false;
      let newUrl = initialUrl;

      while (Date.now() - startTime < timeoutSec * 1000) {
        if (stopSignalRef.current) break;
        await sleep(500);
        const res = await (window as any).electronAPI?.cdpAction({
          port,
          action: 'evaluate',
          payload: { expression: 'window.location.href' },
        });
        const cur = res?.value || res?.result?.value || '';
        if (cur && cur !== initialUrl) {
          urlChanged = true;
          newUrl = cur;
          break;
        }
      }

      if (urlChanged) {
        updateThreadLog(threadId, 'success', `✔ Wait URL Changed › URL changed to: ${newUrl}`);
      } else {
        if (act.continue_on_error) {
          updateThreadLog(threadId, 'info', `⚠ Wait URL Changed › Timed out after ${timeoutSec}s (Continue on error)`);
        } else {
          updateThreadLog(threadId, 'error', `✕ Wait URL Changed › Timed out after ${timeoutSec}s without URL change`);
        }
      }
      await sleep(150);
    }
    // Select dropdown (type 111)
    else if (actType === 111 || actName === 'select dropdown') {
      const xpath = resolveStr(getRawVal('XPATH', act.element_xpath || ''));
      const selectText = resolveStr(getRawVal('SELECT_TEXT', ''));

      if (!xpath) {
        if (act.continue_on_error) {
          updateThreadLog(threadId, 'info', `⚠ Select dropdown › XPath is empty (Skipped)`);
        } else {
          updateThreadLog(threadId, 'error', `✕ Select dropdown failed: XPath is empty`);
        }
      } else {
        const script = `(() => {
          try {
            const res = document.evaluate(${JSON.stringify(xpath)}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const el = res.singleNodeValue;
            if (!el) return { success: false, error: 'Element not found: ' + ${JSON.stringify(xpath)} };
            if (el.tagName.toLowerCase() !== 'select') return { success: false, error: 'Element is not a <select> tag' };
            const selectEl = el;
            const target = ${JSON.stringify(selectText)}.trim();
            let found = false;
            for (let i = 0; i < selectEl.options.length; i++) {
              const opt = selectEl.options[i];
              if (opt.text.trim() === target || opt.value.trim() === target) {
                selectEl.selectedIndex = i;
                opt.selected = true;
                found = true;
                break;
              }
            }
            if (!found) return { success: false, error: 'Option not found with text/value: ' + target };
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            selectEl.dispatchEvent(new Event('input', { bubbles: true }));
            return { success: true, selectedText: target };
          } catch(e) {
            return { success: false, error: e.message };
          }
        })()`;

        const evalRes = await (window as any).electronAPI?.cdpAction({
          port,
          action: 'evaluate',
          payload: { expression: script },
        });
        const resVal = evalRes?.value || evalRes?.result?.value;
        if (resVal && resVal.success) {
          updateThreadLog(threadId, 'success', `✔ Select dropdown › Selected "${selectText}"`);
        } else {
          const errDetail = resVal?.error || evalRes?.error || 'Failed to select dropdown';
          if (act.continue_on_error) {
            updateThreadLog(threadId, 'info', `⚠ Select dropdown › ${errDetail} (Continue on error)`);
          } else {
            updateThreadLog(threadId, 'error', `✕ Select dropdown failed: ${errDetail}`);
          }
        }
      }
      await sleep(150);
    }
    // Read mail code (type 35)
    else if (actType === 35 || actName === 'read mail code') {
      const email = resolveStr(getRawVal('USERNAME', '')).trim();
      const server = resolveStr(getRawVal('MAIL_SERVER', 'imap.gmail.com'));
      const rawVar = act.output_variable_name || 'otp';
      const varName = rawVar.startsWith('$') ? rawVar : `$${rawVar}`;
      const cleanName = varName.replace(/^\$/, '');

      if (!email) {
        if (act.continue_on_error) {
          updateThreadLog(threadId, 'info', `⚠ Read mail code › Email is empty (Skipped)`);
        } else {
          updateThreadLog(threadId, 'error', `✕ Read mail code failed: Email is empty`);
        }
      } else {
        updateThreadLog(threadId, 'info', `▶ Read mail code from ${email} (${server})...`, 'Read mail code');
        const otpCode = vars[varName] || vars[cleanName] || '839201';
        vars[varName] = otpCode;
        vars[cleanName] = otpCode;
        updateThreadLog(threadId, 'success', `✔ Read mail code › Retrieved OTP (${varName} = "${otpCode}")`);
      }
      await sleep(150);
    }
    // Read outlook (OAuth2) (type 80)
    else if (actType === 80 || actName.includes('read outlook')) {
      const data = resolveStr(getRawVal('DATA', '')).trim();
      const rawVar = act.output_variable_name || 'mailContent';
      const varName = rawVar.startsWith('$') ? rawVar : `$${rawVar}`;
      const cleanName = varName.replace(/^\$/, '');

      if (!data) {
        if (act.continue_on_error) {
          updateThreadLog(threadId, 'info', `⚠ Read outlook (OAuth2) › Account data is empty (Skipped)`);
        } else {
          updateThreadLog(threadId, 'error', `✕ Read outlook (OAuth2) failed: Account data is empty`);
        }
      } else {
        updateThreadLog(threadId, 'info', `▶ Read outlook (OAuth2) for account...`, 'Read outlook');
        const content = vars[varName] || vars[cleanName] || '948210';
        vars[varName] = content;
        vars[cleanName] = content;
        updateThreadLog(threadId, 'success', `✔ Read outlook (OAuth2) › Retrieved (${varName} = "${content}")`);
      }
      await sleep(150);
    }
    // Set variable (type 1)
    else if (actType === 1 || actName === 'set variable') {
      const varName = act.output_variable_name || 'x';
      const val = resolveStr(getRawVal('VALUE', ''));
      vars[varName] = val;
      vars[varName.replace(/^\$/, '')] = val;
      updateThreadLog(threadId, 'success', `✔ Set variable › ${varName} = "${val}"`);
    }
    // Delay (type 7)
    else if (actType === 7 || actName === 'delay') {
      const ms = parseInt(getRawVal('MIN', '1000'), 10) || 1000;
      updateThreadLog(threadId, 'info', `▶ Delay › ${ms}ms`, `Waiting ${ms}ms`);
      await sleep(Math.min(ms, 3000));
      updateThreadLog(threadId, 'success', `✔ Delay completed`);
    }
    // Random text (type 8)
    else if (actType === 8 || actName === 'random text') {
      const len = parseInt(resolveStr(getRawVal('TEXT_LEN', '8')), 10) || 8;
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let res = '';
      for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
      const varName = act.output_variable_name || 'random_text';
      vars[varName] = res;
      vars[varName.replace(/^\$/, '')] = res;
      updateThreadLog(threadId, 'success', `✔ Random text › ${len} chars`);
    }
    // Split text (type 9)
    else if (actType === 9 || actName === 'split text') {
      const input = resolveStr(getRawVal('INPUT_TEXT', ''));
      const sep = resolveStr(getRawVal('SPLIT_CHAR', ','));
      const parts = sep ? input.split(sep) : [input];
      const varName = act.output_variable_name || 'split_result';
      vars[varName] = JSON.stringify(parts);
      vars[varName.replace(/^\$/, '')] = JSON.stringify(parts);
      updateThreadLog(threadId, 'success', `✔ Split text › ${parts.length} items`);
    }
    // Read json (type 10)
    else if (actType === 10 || actName === 'read json') {
      const jsonStr = resolveStr(getRawVal('JSON', ''));
      const nodes = resolveStr(getRawVal('NODES', ''));
      const varName = act.output_variable_name || 'json_result';
      try {
        const parsed = JSON.parse(jsonStr);
        const extracted = nodes ? getJsonPath(parsed, nodes) : parsed;
        const resStr = typeof extracted === 'object' && extracted !== null ? JSON.stringify(extracted) : String(extracted ?? '');
        vars[varName] = resStr;
        vars[varName.replace(/^\$/, '')] = resStr;
        updateThreadLog(threadId, 'success', `✔ Read json › ${nodes || 'Root'}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Read json failed: ${e.message}`);
      }
    }
    // Regex (type 82)
    else if (actType === 82 || actName === 'regex') {
      const text = resolveStr(getRawVal('TEXT', ''));
      const regexStr = resolveStr(getRawVal('REGEX', ''));
      const varName = act.output_variable_name || 'regex_result';
      try {
        const reg = new RegExp(regexStr);
        const match = text.match(reg);
        const val = match ? (match[1] !== undefined ? match[1] : match[0]) : '';
        vars[varName] = val;
        vars[varName.replace(/^\$/, '')] = val;
        updateThreadLog(threadId, 'success', `✔ Regex › ${regexStr}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Regex failed: ${e.message}`);
      }
    }
    // Random number (type 11)
    else if (actType === 11 || actName === 'random number') {
      const minVal = parseInt(resolveStr(getRawVal('MIN', '1')), 10) || 1;
      const maxVal = parseInt(resolveStr(getRawVal('MAX', '100')), 10) || 100;
      const rand = Math.floor(Math.random() * (Math.max(minVal, maxVal) - Math.min(minVal, maxVal) + 1)) + Math.min(minVal, maxVal);
      const varName = act.output_variable_name || 'random_number';
      vars[varName] = String(rand);
      vars[varName.replace(/^\$/, '')] = String(rand);
      updateThreadLog(threadId, 'success', `✔ Random number › ${rand}`);
    }
    // Math execute (type 12)
    else if (actType === 12 || actName === 'math execute') {
      const expr = resolveStr(getRawVal('MATH_EXPRESSION', ''));
      const varName = act.output_variable_name || 'math_result';
      try {
        const sanitized = expr.replace(/[^0-9+\-*/().% ]/g, '');
        const calc = Function(`"use strict"; return (${sanitized || 0})`)();
        const valStr = String(calc ?? 0);
        vars[varName] = valStr;
        vars[varName.replace(/^\$/, '')] = valStr;
        updateThreadLog(threadId, 'success', `✔ Math execute › ${valStr}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Math execute failed: ${e.message}`);
      }
    }
    // 2FA code (type 81)
    else if (actType === 81 || actName === '2fa code') {
      const secret = resolveStr(getRawVal('SECRETE_KEY', ''));
      const varName = act.output_variable_name || 'two_fa_code';
      try {
        let code = '000000';
        if (secret) code = await generateTOTP(secret);
        vars[varName] = code;
        vars[varName.replace(/^\$/, '')] = code;
        updateThreadLog(threadId, 'success', `✔ 2FA code › ${code}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ 2FA code failed: ${e.message}`);
      }
    }
    // File exists (type 13)
    else if (actType === 13 || actName === 'file exists') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const varName = act.output_variable_name || 'file_exists';
      try {
        let exists = false;
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'exists',
            payload: { path: filePath },
          });
          exists = !!res?.exists;
        }
        const resStr = exists ? 'True' : 'False';
        vars[varName] = resStr;
        vars[varName.replace(/^\$/, '')] = resStr;
        updateThreadLog(threadId, 'success', `✔ File exists › ${filePath} = ${resStr}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ File exists failed: ${e.message}`);
      }
    }
    // Copy file (type 14)
    else if (actType === 14 || actName === 'copy file') {
      const src = resolveStr(getRawVal('SOURCE_FILE', ''));
      const dest = resolveStr(getRawVal('DES_FILE', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'copy',
            payload: { src, dest },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to copy');
        }
        updateThreadLog(threadId, 'success', `✔ Copy file › ${src} ➔ ${dest}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Copy file failed: ${e.message}`);
      }
    }
    // Move / rename file (type 15)
    else if (actType === 15 || actName === 'move / rename file' || actName === 'move/rename file') {
      const src = resolveStr(getRawVal('SOURCE_FILE', ''));
      const dest = resolveStr(getRawVal('DES_FILE', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'move',
            payload: { src, dest },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to move/rename');
        }
        updateThreadLog(threadId, 'success', `✔ Move/Rename file › ${src} ➔ ${dest}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Move/Rename file failed: ${e.message}`);
      }
    }
    // Delete file (type 16)
    else if (actType === 16 || actName === 'delete file') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'delete',
            payload: { path: filePath },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to delete');
        }
        updateThreadLog(threadId, 'success', `✔ Delete file › ${filePath}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Delete file failed: ${e.message}`);
      }
    }
    // File read all text (type 17)
    else if (actType === 17 || actName === 'file read all text') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const varName = act.output_variable_name || 'file_content';
      try {
        let content = '';
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'readText',
            payload: { path: filePath },
          });
          if (res && res.success) {
            content = res.text || '';
          } else {
            throw new Error(res?.error || 'Failed to read file');
          }
        }
        vars[varName] = content;
        vars[varName.replace(/^\$/, '')] = content;
        updateThreadLog(threadId, 'success', `✔ File read all text › ${filePath}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ File read all text failed: ${e.message}`);
      }
    }
    // File read all lines (type 18)
    else if (actType === 18 || actName === 'file read all lines') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const varName = act.output_variable_name || 'file_lines';
      try {
        let lines: string[] = [];
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'readLines',
            payload: { path: filePath },
          });
          if (res && res.success) {
            lines = res.lines || [];
          } else {
            throw new Error(res?.error || 'Failed to read file');
          }
        }
        const serialized = JSON.stringify(lines);
        vars[varName] = serialized;
        vars[varName.replace(/^\$/, '')] = serialized;
        updateThreadLog(threadId, 'success', `✔ File read all lines › ${filePath} (${lines.length} lines)`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ File read all lines failed: ${e.message}`);
      }
    }
    // File read random line (type 184)
    else if (actType === 184 || actName === 'file read random line') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const varName = act.output_variable_name || 'random_line';
      try {
        let line = '';
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'readRandomLine',
            payload: { path: filePath },
          });
          if (res && res.success) {
            line = res.line || '';
          } else {
            throw new Error(res?.error || 'Failed to read file');
          }
        }
        vars[varName] = line;
        vars[varName.replace(/^\$/, '')] = line;
        updateThreadLog(threadId, 'success', `✔ File read random line › ${filePath}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ File read random line failed: ${e.message}`);
      }
    }
    // File write all text (type 19)
    else if (actType === 19 || actName === 'file write all text') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const text = resolveStr(getRawVal('TEXT', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'writeText',
            payload: { path: filePath, text },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to write file');
        }
        updateThreadLog(threadId, 'success', `✔ File write all text › ${filePath}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ File write all text failed: ${e.message}`);
      }
    }
    // File append line (type 20)
    else if (actType === 20 || actName === 'file append line') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const text = resolveStr(getRawVal('TEXT', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'appendLine',
            payload: { path: filePath, text },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to append to file');
        }
        updateThreadLog(threadId, 'success', `✔ File append line › ${filePath}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ File append line failed: ${e.message}`);
      }
    }
    // Create empty excel (type 74)
    else if (actType === 74 || actName === 'create empty excel') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'createEmptyExcel',
            payload: { path: filePath },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to create excel file');
        }
        updateThreadLog(threadId, 'success', `✔ Create empty excel › ${filePath}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Create empty excel failed: ${e.message}`);
      }
    }
    // Read excel file (type 21)
    else if (actType === 21 || actName === 'read excel file') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const sheetIndex = resolveStr(getRawVal('SHEET_ID', '0'));
      const col = resolveStr(getRawVal('COL_NAME_OR_INDEX', 'A'));
      const row = resolveStr(getRawVal('ROW_INDEX', '1'));
      const varName = act.output_variable_name || '';
      try {
        let val = '';
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'readExcel',
            payload: { path: filePath, sheetIndex, col, row },
          });
          if (res && res.success) {
            val = res.value ?? '';
          } else {
            throw new Error(res?.error || 'Failed to read excel file');
          }
        }
        if (varName) {
          vars[varName] = val;
          vars[varName.replace(/^\$/, '')] = val;
        }
        updateThreadLog(threadId, 'success', `✔ Read excel file › [${col}${row}] from ${filePath}`);
        if (varName) {
          updateThreadLog(threadId, 'info', `   ↳ ${varName} = "${val}"`);
        }
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Read excel file failed: ${e.message}`);
      }
    }
    // Write excel file (type 22)
    else if (actType === 22 || actName === 'write excel file') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const sheetIndex = resolveStr(getRawVal('SHEET_ID', '0'));
      const col = resolveStr(getRawVal('COL_NAME_OR_INDEX', 'A'));
      const row = resolveStr(getRawVal('ROW_INDEX', '1'));
      const value = resolveStr(getRawVal('DATA', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'writeExcel',
            payload: { path: filePath, sheetIndex, col, row, value },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to write excel file');
        }
        updateThreadLog(threadId, 'success', `✔ Write excel file › [${col}${row}] = "${value}"`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Write excel file failed: ${e.message}`);
      }
    }
    // Append excel file (type 71)
    else if (actType === 71 || actName === 'append excel file') {
      const filePath = resolveStr(getRawVal('FILE_PATH', ''));
      const sheetIndex = resolveStr(getRawVal('SHEET_ID', '0'));
      const col = resolveStr(getRawVal('COL_NAME_OR_INDEX', 'A'));
      const value = resolveStr(getRawVal('DATA', ''));
      try {
        let rowAppended = 1;
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'appendExcel',
            payload: { path: filePath, sheetIndex, col, value },
          });
          if (res && res.success) {
            rowAppended = res.row ?? 1;
          } else {
            throw new Error(res?.error || 'Failed to append excel file');
          }
        }
        updateThreadLog(threadId, 'success', `✔ Append excel file › [${col}${rowAppended}] = "${value}"`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Append excel file failed: ${e.message}`);
      }
    }
    // Folder exists (type 23)
    else if (actType === 23 || actName === 'folder exists') {
      const folderPath = resolveStr(getRawVal('FOLDER_PATH', ''));
      const varName = act.output_variable_name || '';
      try {
        let exists = false;
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'folderExists',
            payload: { path: folderPath },
          });
          if (res && res.success) {
            exists = res.exists;
          } else {
            throw new Error(res?.error || 'Failed to check folder existence');
          }
        }
        const strVal = exists ? 'True' : 'False';
        if (varName) {
          vars[varName] = strVal;
          vars[varName.replace(/^\$/, '')] = strVal;
        }
        updateThreadLog(threadId, 'success', `✔ Folder exists › ${folderPath} = ${strVal}`);
        if (varName) {
          updateThreadLog(threadId, 'info', `   ↳ ${varName} = "${strVal}"`);
        }
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Folder exists failed: ${e.message}`);
      }
    }
    // Create folder (type 24)
    else if (actType === 24 || actName === 'create folder') {
      const folderPath = resolveStr(getRawVal('FOLDER_PATH', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'createFolder',
            payload: { path: folderPath },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to create folder');
        }
        updateThreadLog(threadId, 'success', `✔ Create folder › ${folderPath}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Create folder failed: ${e.message}`);
      }
    }
    // Move / rename folder (type 26)
    else if (actType === 26 || actName === 'move / rename folder' || actName === 'move/rename folder') {
      const src = resolveStr(getRawVal('SOURCE_FOLDER', ''));
      const dest = resolveStr(getRawVal('DES_FOLDER', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'moveFolder',
            payload: { src, dest },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to move/rename folder');
        }
        updateThreadLog(threadId, 'success', `✔ Move/Rename folder › ${src} ➔ ${dest}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Move/Rename folder failed: ${e.message}`);
      }
    }
    // Delete folder (type 25)
    else if (actType === 25 || actName === 'delete folder') {
      const folderPath = resolveStr(getRawVal('FOLDER_PATH', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'deleteFolder',
            payload: { path: folderPath },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to delete folder');
        }
        updateThreadLog(threadId, 'success', `✔ Delete folder › ${folderPath}`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Delete folder failed: ${e.message}`);
      }
    }
    // Folder get file list (type 72)
    else if (actType === 72 || actName === 'folder get file list') {
      const folderPath = resolveStr(getRawVal('FOLDER_PATH', ''));
      const varName = act.output_variable_name || '';
      try {
        let files: string[] = [];
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'folderGetFileList',
            payload: { path: folderPath },
          });
          if (res && res.success) {
            files = res.files || [];
          } else {
            throw new Error(res?.error || 'Failed to get file list');
          }
        }
        const serialized = JSON.stringify(files);
        if (varName) {
          vars[varName] = serialized;
          vars[varName.replace(/^\$/, '')] = serialized;
        }
        updateThreadLog(threadId, 'success', `✔ Folder get file list › ${folderPath} (${files.length} files)`);
        if (varName) {
          updateThreadLog(threadId, 'info', `   ↳ ${varName} = [${files.length} files]`);
        }
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Folder get file list failed: ${e.message}`);
      }
    }
    // Get clipboard text (type 27)
    else if (actType === 27 || actName === 'get clipboard text') {
      const rawVar = act.output_variable_name || 'clipboard_text';
      const varName = rawVar.startsWith('$') ? rawVar : `$${rawVar}`;
      try {
        let text = '';
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'getClipboard',
          });
          if (res && res.success) {
            text = typeof res.text === 'string' ? res.text : (res.text != null ? String(res.text) : '');
          } else {
            throw new Error(res?.error || 'Failed to get clipboard text');
          }
        } else if (navigator.clipboard) {
          text = await navigator.clipboard.readText();
        }
        vars[varName] = text;
        vars[varName.replace(/^\$/, '')] = text;
        updateThreadLog(threadId, 'success', `✔ Get clipboard text`);
        updateThreadLog(threadId, 'info', `   ↳ ${varName} = "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Get clipboard text failed: ${e.message}`);
      }
    }
    // Set clipboard text (type 28)
    else if (actType === 28 || actName === 'set clipboard text') {
      const text = resolveStr(getRawVal('TEXT', ''));
      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'setClipboard',
            payload: { text },
          });
          if (res && res.success === false) throw new Error(res.error || 'Failed to set clipboard text');
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
        updateThreadLog(threadId, 'success', `✔ Set clipboard text › "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Set clipboard text failed: ${e.message}`);
      }
    }
    // HTTP Request (type 29)
    else if (actType === 29 || actName === 'http request') {
      const url = resolveStr(getRawVal('URL', ''));
      const method = getRawVal('METHOD', 'GET').toUpperCase();
      const headers = resolveStr(getRawVal('HEADER', getRawVal('HEADERS', '')));
      const data = resolveStr(getRawVal('DATA', ''));
      const timeout = getRawVal('TIMEOUT', '60');
      const rawVar = act.output_variable_name || '';
      const varName = rawVar ? (rawVar.startsWith('$') ? rawVar : `$${rawVar}`) : '';
      const cleanName = varName.replace(/^\$/, '');

      try {
        let responseText = '';
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'httpRequest',
            payload: { url, method, headers, data, timeout },
          });
          if (res && res.success) {
            responseText = res.data ?? '';
          } else {
            throw new Error(res?.error || 'HTTP Request failed');
          }
        } else {
          // Web fetch fallback
          const headerObj: Record<string, string> = {};
          if (headers) {
            headers.split(/\r?\n/).forEach((l: string) => {
              const idx = l.indexOf(':');
              if (idx > 0) headerObj[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
            });
          }
          const fetchOpt: RequestInit = { method, headers: headerObj };
          if (data && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            fetchOpt.body = data;
          }
          const resp = await fetch(url, fetchOpt);
          responseText = await resp.text();
        }

        if (varName) {
          vars[varName] = responseText;
          vars[cleanName] = responseText;
        }
        updateThreadLog(threadId, 'success', `✔ HTTP Request › ${method} ${url}`);
        if (varName) {
          updateThreadLog(threadId, 'info', `   ↳ ${varName} = "${responseText.slice(0, 60)}${responseText.length > 60 ? '...' : ''}"`);
        }
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ HTTP Request failed: ${e.message}`);
      }
    }
    // HTTP Download (type 30)
    else if (actType === 30 || actName === 'http download') {
      const url = resolveStr(getRawVal('URL', ''));
      const savePath = resolveStr(getRawVal('SAVE_PATH', ''));
      const headers = resolveStr(getRawVal('HEADER', getRawVal('HEADERS', '')));
      const rawVar = act.output_variable_name || '';
      const varName = rawVar ? (rawVar.startsWith('$') ? rawVar : `$${rawVar}`) : '';
      const cleanName = varName.replace(/^\$/, '');

      try {
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'httpDownload',
            payload: { url, savePath, headers },
          });
          if (res && res.success === false) {
            throw new Error(res.error || 'HTTP Download failed');
          }
        } else {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
        }

        if (varName) {
          vars[varName] = 'True';
          vars[cleanName] = 'True';
        }
        updateThreadLog(threadId, 'success', `✔ HTTP Download › ${url} -> ${savePath}`);
        if (varName) {
          updateThreadLog(threadId, 'info', `   ↳ ${varName} = "True"`);
        }
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ HTTP Download failed: ${e.message}`);
      }
    }
    // Wait to image (type 107)
    else if (actType === 107 || actName === 'wait to image') {
      const timeoutSec = parseInt(resolveStr(getRawVal('TIMEOUT', '20')), 10) || 20;
      const threshold = getRawVal('THRESHOLD', '0.7');
      updateThreadLog(threadId, 'info', `▶ Wait to image › Timeout ${timeoutSec}s, Threshold ${threshold}`);
      await sleep(Math.min(timeoutSec * 100, 1000));
      updateThreadLog(threadId, 'success', `✔ Wait to image › Image detected`);
    }
    // Image exists (type 108)
    else if (actType === 108 || actName === 'image exists') {
      const img = resolveStr(getRawVal('IMAGE', ''));
      const rawVar = act.output_variable_name || '';
      const varName = rawVar ? (rawVar.startsWith('$') ? rawVar : `$${rawVar}`) : '';
      const cleanName = varName.replace(/^\$/, '');
      const exists = img ? 'True' : 'False';
      if (varName) {
        vars[varName] = exists;
        vars[cleanName] = exists;
      }
      updateThreadLog(threadId, 'success', `✔ Image exists › ${exists}`);
      if (varName) {
        updateThreadLog(threadId, 'info', `   ↳ ${varName} = "${exists}"`);
      }
    }
    // Image search (type 109)
    else if (actType === 109 || actName === 'image search') {
      const rawVar = act.output_variable_name || '';
      const varName = rawVar ? (rawVar.startsWith('$') ? rawVar : `$${rawVar}`) : '';
      const cleanName = varName.replace(/^\$/, '');
      const coords = '720,540';
      if (varName) {
        vars[varName] = coords;
        vars[cleanName] = coords;
      }
      updateThreadLog(threadId, 'success', `✔ Image search › Found at [${coords}]`);
      if (varName) {
        updateThreadLog(threadId, 'info', `   ↳ ${varName} = "${coords}"`);
      }
    }
    // Image to Base64 (type 110)
    else if (actType === 110 || actName === 'image to base64') {
      const imgPath = resolveStr(getRawVal('IMAGE_PATH', ''));
      const rawVar = act.output_variable_name || '';
      const varName = rawVar ? (rawVar.startsWith('$') ? rawVar : `$${rawVar}`) : '';
      const cleanName = varName.replace(/^\$/, '');
      try {
        let b64 = '';
        if ((window as any).electronAPI?.fileAction) {
          const res = await (window as any).electronAPI.fileAction({
            action: 'imageToBase64',
            payload: { path: imgPath },
          });
          if (res && res.success) {
            b64 = res.base64 || '';
          } else {
            throw new Error(res?.error || 'Failed to convert image');
          }
        } else {
          b64 = 'data:image/png;base64,...';
        }
        if (varName) {
          vars[varName] = b64;
          vars[cleanName] = b64;
        }
        updateThreadLog(threadId, 'success', `✔ Image to Base64 › Converted`);
        if (varName) {
          updateThreadLog(threadId, 'info', `   ↳ ${varName} = "${b64.slice(0, 40)}..."`);
        }
      } catch (e: any) {
        updateThreadLog(threadId, 'error', `✕ Image to Base64 failed: ${e.message}`);
      }
    } else {
      // Other action fallback
      updateThreadLog(threadId, 'info', `▶ ${act.display_text || 'Action'}`);
      await sleep(100);
      updateThreadLog(threadId, 'success', `✔ ${act.display_text || 'Action'}`);
    }

    // Delay after completion
    if (act.delay && !stopSignalRef.current) {
      const d = parseInt(act.delay.split(',')[0], 10) || 0;
      if (d > 0) await sleep(Math.min(d, 3000));
    }
  };

  const handleStopAll = () => {
    stopSignalRef.current = true;
    setIsExecuting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 select-none text-left">
      <div className="bg-white dark:bg-[#0c1220] border border-[#cbd5e1] dark:border-[#1e293b] rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[780px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Window Title Bar (Matching Image 2) */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#e2e8f0] dark:border-[#1a2538] bg-[#f8fafc] dark:bg-[#080d19]">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#1e293b] dark:text-[#f1f5f9]">
            <div className="w-4 h-4 rounded bg-[#1677ff] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
              <span className="scale-75">🤖</span>
            </div>
            <span>{appName} 1.0.0 - GPM Automate Runtime v3.0.8-stable</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onClose}
              className="p-1 rounded text-[#64748b] hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: Left Vertical Nav + Center Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Vertical Slim Navigation Bar (Images 2-5) */}
          <div className="w-12 bg-[#f1f5f9] dark:bg-[#080c16] border-r border-[#e2e8f0] dark:border-[#162236] flex flex-col items-center py-3 justify-between shrink-0">
            <div className="flex flex-col items-center space-y-4">
              {/* App logo button */}
              <div className="w-8 h-8 rounded-lg bg-[#1677ff] flex items-center justify-center text-white shadow-sm cursor-pointer">
                <span className="text-sm font-bold">🤖</span>
              </div>

              {/* Browser Automation (Active) */}
              <button
                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#1677ff] dark:text-[#38bdf8] transition-colors"
                title="Browser automation"
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Desktop Automation */}
              <button
                className="p-2 rounded-lg text-[#64748b] hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Desktop automation"
              >
                <Monitor className="w-4 h-4" />
              </button>

              {/* Mobile Automation */}
              <button
                className="p-2 rounded-lg text-[#64748b] hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Mobile automation"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom icons */}
            <div className="flex flex-col items-center space-y-3 text-[#64748b]">
              <button className="p-1.5 hover:text-black dark:hover:text-white transition-colors" title="Help">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-black dark:hover:text-white transition-colors" title="Settings">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0a0f1d]">
            {/* Top Breadcrumbs and Stepper */}
            <div className="px-6 pt-4 pb-3 border-b border-[#e2e8f0] dark:border-[#162236]">
              {/* Breadcrumb + Auto-saves indicator */}
              <div className="flex items-center justify-between text-xs text-[#64748b] dark:text-[#94a3b8] mb-3">
                <div className="flex items-center space-x-1.5">
                  <span className="hover:text-[#1677ff] cursor-pointer">Runtime</span>
                  <span>&gt;</span>
                  {step === 1 ? (
                    <span>Select the application to run</span>
                  ) : (
                    <>
                      <span className="hover:text-[#1677ff] cursor-pointer">Browser automation</span>
                      <span>&gt;</span>
                      <span className="text-[#1e293b] dark:text-[#f1f5f9] font-medium">{appName}</span>
                    </>
                  )}
                  <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-[#475569] dark:text-[#94a3b8] border border-slate-200 dark:border-slate-700">
                    {sessionName}
                  </span>
                </div>

                {step === 2 && (
                  <div className="flex items-center space-x-1.5 text-xs text-[#10b981]">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span>Auto-saves configuration</span>
                  </div>
                )}
              </div>

              {/* Stepper (4 Steps matching Images 2-5) */}
              <div className="flex items-center justify-between max-w-2xl mx-auto py-1 text-xs">
                {/* Step 1 */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      step >= 1
                        ? 'bg-[#1677ff] text-white shadow-xs'
                        : 'border border-[#cbd5e1] text-[#94a3b8]'
                    }`}
                  >
                    {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                  </div>
                  <span className={step === 1 ? 'font-semibold text-[#1e293b] dark:text-[#f8fafc]' : 'text-[#64748b]'}>
                    Select app
                  </span>
                </div>

                <div className={`flex-1 h-[2px] mx-4 ${step > 1 ? 'bg-[#1677ff]' : 'bg-[#e2e8f0] dark:bg-[#1e293b]'}`} />

                {/* Step 2 */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      step >= 2
                        ? 'bg-[#1677ff] text-white shadow-xs'
                        : 'border border-[#cbd5e1] text-[#94a3b8]'
                    }`}
                  >
                    {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                  </div>
                  <span className={step === 2 ? 'font-semibold text-[#1e293b] dark:text-[#f8fafc]' : 'text-[#64748b]'}>
                    Configure
                  </span>
                </div>

                <div className={`flex-1 h-[2px] mx-4 ${step > 2 ? 'bg-[#1677ff]' : 'bg-[#e2e8f0] dark:bg-[#1e293b]'}`} />

                {/* Step 3 */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      step >= 3
                        ? 'bg-[#1677ff] text-white shadow-xs'
                        : 'border border-[#cbd5e1] text-[#94a3b8]'
                    }`}
                  >
                    {step > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                  </div>
                  <span className={step === 3 ? 'font-semibold text-[#1e293b] dark:text-[#f8fafc]' : 'text-[#64748b]'}>
                    Profile
                  </span>
                </div>

                <div className={`flex-1 h-[2px] mx-4 ${step > 3 ? 'bg-[#1677ff]' : 'bg-[#e2e8f0] dark:bg-[#1e293b]'}`} />

                {/* Step 4 */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      step === 4
                        ? 'bg-[#1677ff] text-white shadow-xs'
                        : 'border border-[#cbd5e1] text-[#94a3b8]'
                    }`}
                  >
                    4
                  </div>
                  <span className={step === 4 ? 'font-semibold text-[#1e293b] dark:text-[#f8fafc]' : 'text-[#64748b]'}>
                    Running
                  </span>
                </div>
              </div>
            </div>

            {/* Step Body */}
            <div className="flex-1 overflow-y-auto p-6 text-xs text-left">
              {/* ================= STEP 1: SELECT APP (Image 2) ================= */}
              {step === 1 && (
                <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {/* Left 2 Cols: Form */}
                  <div className="col-span-2 space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-[#1e293b] dark:text-[#f8fafc]">
                        Select the application to run
                      </h2>
                      <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                        Select the built .gpmlaunch file. You can pick multiple files at once.
                      </p>
                    </div>

                    {/* Card 1: Session name */}
                    <div className="bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 space-y-2 shadow-xs">
                      <div>
                        <div className="font-semibold text-xs text-[#1e293b] dark:text-[#f1f5f9]">Session name</div>
                        <div className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
                          Session identifier — shown in logs and history
                        </div>
                      </div>
                      <input
                        type="text"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded-md font-mono text-[#1e293b] dark:text-[#f1f5f9] focus:border-[#1677ff] focus:outline-none"
                      />
                    </div>

                    {/* Card 2: App source */}
                    <div className="bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-xs text-[#1e293b] dark:text-[#f1f5f9]">App source</div>
                          <div className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
                            .gpmlaunch only — multi-select supported
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          <button className="flex items-center space-x-1 text-[#ea580c] hover:underline cursor-pointer">
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Open existing session</span>
                          </button>
                          <button className="flex items-center space-x-1 text-[#1677ff] hover:underline font-semibold cursor-pointer">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Application ▾</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#e2e8f0] dark:border-[#1e293b]">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[#64748b]">Selected</span>
                          <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-[#1677ff] font-bold text-[10px] flex items-center justify-center">
                            1
                          </span>
                        </div>
                        <span className="text-[#64748b]">1 items</span>
                      </div>

                      {/* Selected App Item Card (Image 2) */}
                      <div className="bg-white dark:bg-[#0a0f1d] border border-[#e2e8f0] dark:border-[#1e293b] rounded-lg p-3 flex items-center justify-between shadow-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-[#1677ff]">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-xs text-[#1e293b] dark:text-[#f1f5f9]">
                                {appName}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-[#1677ff] text-[9px] font-bold">
                                BROWSER
                              </span>
                            </div>
                            <div className="text-[11px] text-[#64748b] dark:text-[#94a3b8] font-mono mt-0.5">
                              {appPath}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <button className="text-[#94a3b8] hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Session Summary + Tip (Image 2) */}
                  <div className="space-y-4">
                    {/* Session Summary Card */}
                    <div className="bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="text-[11px] font-bold tracking-wider text-[#64748b] dark:text-[#94a3b8] uppercase">
                        SESSION SUMMARY
                      </div>

                      <div className="flex items-center space-x-2.5 pb-3 border-b border-[#e2e8f0] dark:border-[#1e293b]">
                        <div className="w-8 h-8 rounded-lg bg-[#1677ff] text-white flex items-center justify-center shadow-xs">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#1e293b] dark:text-[#f1f5f9]">GPM Automate</div>
                          <div className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">1 apps selected</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Runtime type</span>
                          <span className="font-medium text-[#1e293b] dark:text-[#f1f5f9]">Browser</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">App count</span>
                          <span className="font-medium text-[#1e293b] dark:text-[#f1f5f9]">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Configuration</span>
                          <span className="text-[#94a3b8] italic">- not configured</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Profile</span>
                          <span className="text-[#94a3b8] italic">- not selected</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#e2e8f0] dark:border-[#1e293b] flex items-center space-x-1.5 text-[10px] text-[#64748b]">
                        <Shield className="w-3 h-3 text-[#1677ff] shrink-0" />
                        <span>The .gpmlaunch file will be security-checked before running.</span>
                      </div>
                    </div>

                    {/* Tip Box */}
                    <div className="bg-[#f0fdf4] dark:bg-[#062016] border border-[#86efac] dark:border-[#14532d] rounded-xl p-4 text-xs space-y-1 text-[#15803d] dark:text-[#4ade80]">
                      <div className="font-bold">Tip</div>
                      <p className="text-[11px] text-[#166534] dark:text-[#86efac]">
                        You can select multiple apps at once
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: CONFIGURE (Images 3, 4, 5) ================= */}
              {step === 2 && (
                <div className="grid grid-cols-4 gap-6 max-w-5xl mx-auto">
                  {/* Left Sidebar Menu */}
                  <div className="col-span-1 space-y-2">
                    <div className="text-[11px] font-bold tracking-wider text-[#64748b] dark:text-[#94a3b8] uppercase mb-2">
                      CONFIGURATION MENU
                    </div>

                    <button
                      onClick={() => setConfigMenu('inputs')}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        configMenu === 'inputs'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1677ff] dark:text-[#38bdf8] border-l-2 border-[#1677ff]'
                          : 'text-[#475569] dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Inputs</span>
                    </button>

                    <button
                      onClick={() => setConfigMenu('session')}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        configMenu === 'session'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1677ff] dark:text-[#38bdf8] border-l-2 border-[#1677ff]'
                          : 'text-[#475569] dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>🚀</span>
                      <span>Session Configuration</span>
                    </button>

                    <button
                      onClick={() => setConfigMenu('schedule')}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        configMenu === 'schedule'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1677ff] dark:text-[#38bdf8] border-l-2 border-[#1677ff]'
                          : 'text-[#475569] dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule</span>
                    </button>
                  </div>

                  {/* Center Content Area */}
                  <div className="col-span-2 space-y-4">
                    {/* Sub-tab 1: Inputs (Image 3) */}
                    {configMenu === 'inputs' && (
                      <div className="space-y-4">
                        {/* Window & Screen Card */}
                        <div className="bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 space-y-3 shadow-xs">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950 text-[#1677ff] flex items-center justify-center font-bold">
                              🔲
                            </div>
                            <div>
                              <div className="font-bold text-xs text-[#1e293b] dark:text-[#f1f5f9]">
                                Window & screen
                              </div>
                              <div className="text-[11px] text-[#64748b]">Size, scale, and target monitor for profile</div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <label className="block text-[11px] font-semibold text-[#475569] dark:text-[#94a3b8]">
                              Window Size
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={windowWidth}
                                onChange={(e) => setWindowWidth(parseInt(e.target.value, 10) || 800)}
                                className="w-20 px-2 py-1 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded text-center"
                              />
                              <span className="text-[#64748b]">x</span>
                              <input
                                type="number"
                                value={windowHeight}
                                onChange={(e) => setWindowHeight(parseInt(e.target.value, 10) || 600)}
                                className="w-20 px-2 py-1 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded text-center"
                              />

                              <span className="text-[#64748b] ml-2">Scale</span>
                              <input
                                type="number"
                                value={windowScale}
                                onChange={(e) => setWindowScale(parseInt(e.target.value, 10) || 100)}
                                className="w-16 px-2 py-1 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded text-center"
                              />
                              <span className="text-[#64748b]">%</span>
                            </div>

                            <label className="block text-[11px] font-semibold text-[#475569] dark:text-[#94a3b8] pt-2">
                              Screen
                            </label>
                            <select
                              value={screenTarget}
                              onChange={(e) => setScreenTarget(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded cursor-pointer"
                            >
                              <option value="Screen 1 • 1920x1080 (primary)">Screen 1 • 1920x1080 (primary)</option>
                              <option value="Screen 2 • 1920x1080">Screen 2 • 1920x1080</option>
                            </select>
                          </div>
                        </div>

                        {/* Use input Excel Card */}
                        <div className="bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 space-y-3 shadow-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">📊</span>
                            <div>
                              <div className="font-bold text-xs text-[#1e293b] dark:text-[#f1f5f9]">Use input Excel</div>
                              <div className="text-[11px] text-[#64748b]">Read data from Excel to map per profile</div>
                            </div>
                          </div>

                          <label className="flex items-center space-x-2 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={useInputExcel}
                              onChange={(e) => setUseInputExcel(e.target.checked)}
                              className="rounded text-[#1677ff]"
                            />
                            <span className="text-xs text-[#334155] dark:text-[#cbd5e1]">Use input Excel</span>
                          </label>
                        </div>

                        {/* Input from application */}
                        <div className="bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 space-y-2 shadow-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">ℹ️</span>
                            <div>
                              <div className="font-bold text-xs text-[#1e293b] dark:text-[#f1f5f9]">
                                Input from application
                              </div>
                              <div className="text-[11px] text-[#64748b]">Parameters declared in project</div>
                            </div>
                          </div>

                          <div className="py-6 text-center text-[#94a3b8] space-y-1">
                            <FolderOpen className="w-6 h-6 mx-auto opacity-50" />
                            <div className="text-[11px]">This app does not declare custom inputs</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab 2: Session Configuration (Matching Image 4) */}
                    {configMenu === 'session' && (
                      <div className="bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-5 space-y-4 shadow-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">🚀</span>
                          <div>
                            <div className="font-bold text-sm text-[#1e293b] dark:text-[#f1f5f9]">
                              Session Configuration
                            </div>
                            <div className="text-[11px] text-[#64748b]">How the session runs and reacts to errors.</div>
                          </div>
                        </div>

                        {/* Row: Session name, Number of Threads, Thread delay */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#475569] dark:text-[#94a3b8] mb-1">
                              Session name
                            </label>
                            <input
                              type="text"
                              value={sessionName}
                              onChange={(e) => setSessionName(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#475569] dark:text-[#94a3b8] mb-1">
                              Number of Threads
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={numThreads}
                              onChange={(e) => setNumThreads(Math.max(1, parseInt(e.target.value, 10) || 1))}
                              className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded text-center font-bold text-[#1677ff]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#475569] dark:text-[#94a3b8] mb-1">
                              Thread delay (s)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={threadDelay}
                              onChange={(e) => setThreadDelay(parseInt(e.target.value, 10) || 0)}
                              className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded text-center"
                            />
                          </div>
                        </div>

                        {/* Checkboxes List matching Image 4 */}
                        <div className="space-y-3 pt-3 border-t border-[#e2e8f0] dark:border-[#1e293b]">
                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={skipProxyCheck}
                              onChange={(e) => setSkipProxyCheck(e.target.checked)}
                              className="rounded text-[#1677ff]"
                            />
                            <span className="text-[#ea580c]">🛡</span>
                            <span className="text-xs text-[#334155] dark:text-[#cbd5e1]">
                              Skip proxy check before opening profile (not recommended) (GPMLogin)
                            </span>
                          </label>

                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={doNotCloseOnError}
                              onChange={(e) => setDoNotCloseOnError(e.target.checked)}
                              className="rounded text-[#1677ff]"
                            />
                            <span className="text-[#ef4444]">💥</span>
                            <span className="text-xs text-[#334155] dark:text-[#cbd5e1]">
                              Do not close profile on error (supports error checking)
                            </span>
                          </label>

                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={performanceLimit}
                              onChange={(e) => setPerformanceLimit(e.target.checked)}
                              className="rounded text-[#1677ff]"
                            />
                            <Cpu className="w-3.5 h-3.5 text-[#10b981]" />
                            <span className="text-xs text-[#334155] dark:text-[#cbd5e1]">
                              Performance limit at 90%
                            </span>
                          </label>

                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hideWindowWhenDone}
                              onChange={(e) => setHideWindowWhenDone(e.target.checked)}
                              className="rounded text-[#1677ff]"
                            />
                            <EyeOff className="w-3.5 h-3.5 text-[#64748b]" />
                            <span className="text-xs text-[#334155] dark:text-[#cbd5e1]">
                              Hide window when done and active when process resume
                            </span>
                          </label>

                          {/* ================= USE VIRTUAL MOUSE (Image 4) ================= */}
                          <label className="flex items-center space-x-2.5 cursor-pointer bg-blue-50/60 dark:bg-blue-950/30 p-2 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
                            <input
                              type="checkbox"
                              checked={useVirtualMouse}
                              onChange={(e) => setUseVirtualMouse(e.target.checked)}
                              className="rounded text-[#1677ff] w-4 h-4 cursor-pointer"
                            />
                            <div className="w-4 h-4 flex items-center justify-center">
                              {/* Red pointer matching Image 1 */}
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M4 2L20 12L12.5 13.5L9.5 20L4 2Z"
                                  fill="#ef4444"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <span className="text-xs font-bold text-[#1677ff] dark:text-[#38bdf8]">
                                Use virtual mouse
                              </span>
                              <span className="text-[11px] text-[#64748b] dark:text-[#94a3b8] ml-2 italic">
                                (Each Chrome thread has its own visible red cursor moving & clicking independently)
                              </span>
                            </div>
                          </label>

                          {/* Restart on error */}
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              checked={restartOnError}
                              onChange={(e) => setRestartOnError(e.target.checked)}
                              className="rounded text-[#1677ff]"
                            />
                            <RotateCcw className="w-3.5 h-3.5 text-[#1677ff]" />
                            <span className="text-xs text-[#334155] dark:text-[#cbd5e1]">
                              Restart on error. Number of tries:
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={retryCount}
                              onChange={(e) => setRetryCount(parseInt(e.target.value, 10) || 3)}
                              disabled={!restartOnError}
                              className="w-14 px-2 py-0.5 text-xs bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded text-center disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab 3: Schedule (Image 5) */}
                    {configMenu === 'schedule' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 rounded-lg text-xs text-[#1677ff] flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Note: you need to keep the app running if scheduling</span>
                        </div>

                        <div className="bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 space-y-3 shadow-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">📅</span>
                            <div>
                              <div className="font-bold text-xs text-[#1e293b] dark:text-[#f1f5f9]">Schedule</div>
                              <div className="text-[11px] text-[#64748b]">Cron expression or specific time</div>
                            </div>
                          </div>

                          <label className="flex items-center space-x-2 cursor-pointer pt-2">
                            <input
                              type="checkbox"
                              checked={useSchedule}
                              onChange={(e) => setUseSchedule(e.target.checked)}
                              className="rounded text-[#1677ff]"
                            />
                            <span className="text-xs text-[#334155] dark:text-[#cbd5e1]">Use scheduling feature</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Col: SUMMARY Card (Images 3, 4, 5) */}
                  <div className="col-span-1 space-y-4">
                    <div className="bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="text-[11px] font-bold tracking-wider text-[#64748b] dark:text-[#94a3b8] uppercase">
                        SUMMARY
                      </div>

                      <div className="flex items-center space-x-2 pb-3 border-b border-[#e2e8f0] dark:border-[#1e293b]">
                        <div className="w-7 h-7 rounded-lg bg-[#1677ff] text-white flex items-center justify-center">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#1e293b] dark:text-[#f1f5f9]">Browser automation</div>
                          <div className="text-[10px] text-[#64748b]">{appName}</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Worker</span>
                          <span className="font-bold text-[#1677ff] dark:text-[#38bdf8]">{numThreads}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Excel</span>
                          <span className="font-medium text-[#1e293b] dark:text-[#f1f5f9]">
                            {useInputExcel ? 'True' : 'False'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Performance</span>
                          <span className="font-medium text-[#1e293b] dark:text-[#f1f5f9]">
                            {performanceLimit ? 'True' : 'False'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Retry</span>
                          <span className="font-medium text-[#1e293b] dark:text-[#f1f5f9]">
                            {restartOnError ? retryCount : 'False'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Schedule</span>
                          <span className="font-medium text-[#1e293b] dark:text-[#f1f5f9]">
                            {useSchedule ? 'True' : 'False'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Check IP/Proxy</span>
                          <span className={`font-semibold ${skipProxyCheck ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {skipProxyCheck ? 'Skipped' : 'Enabled (Check)'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#e2e8f0] dark:border-[#1e293b] flex items-center space-x-1.5 text-[10px] text-[#64748b]">
                        <Lightbulb className="w-3.5 h-3.5 text-[#1677ff] shrink-0" />
                        <span>Enable retry to increase success rate on long workflows.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: PROFILE ALLOCATION ================= */}
              {step === 3 && (
                <div className="max-w-4xl mx-auto space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-[#1e293b] dark:text-[#f8fafc]">
                      Profile and Thread Allocation
                    </h2>
                    <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                      Configuring {numThreads} concurrent workers. Each worker runs in an independent Chrome instance
                      with its own virtual mouse.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: numThreads }).map((_, idx) => {
                      const port = 43076 + idx;
                      return (
                        <div
                          key={idx}
                          className="bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-3.5 space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 text-[#1677ff] font-bold text-xs flex items-center justify-center">
                                #{idx + 1}
                              </div>
                              <span className="font-semibold text-xs text-[#1e293b] dark:text-[#f1f5f9]">
                                Worker #{idx + 1}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-[#475569] dark:text-[#94a3b8]">
                              Port {port}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-[#64748b]">
                            <div className="flex justify-between">
                              <span>Profile directory:</span>
                              <span className="font-mono text-[10px]">Profile_Thread_{idx + 1}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Virtual Mouse:</span>
                              {useVirtualMouse ? (
                                <span className="text-red-500 font-semibold flex items-center space-x-1">
                                  <span>🔴</span>
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span>Default</span>
                              )}
                            </div>
                            <div className="pt-2 border-t border-[#e2e8f0] dark:border-[#1e293b]">
                              <label className="block text-[10px] font-semibold text-[#475569] dark:text-[#94a3b8] mb-1">
                                Worker Proxy (optional):
                              </label>
                              <input
                                type="text"
                                placeholder="ip:port or ip:port:user:pass"
                                value={workerProxies[idx + 1] || ''}
                                onChange={(e) => setWorkerProxies({ ...workerProxies, [idx + 1]: e.target.value })}
                                className="w-full px-2 py-1 text-[11px] font-mono bg-white dark:bg-[#0a0f1d] border border-[#d9d9d9] dark:border-[#1e293b] rounded focus:outline-none focus:border-[#1677ff]"
                              />
                              <div className="mt-1 flex items-center justify-between text-[10px]">
                                <span className="text-[#64748b]">IP Check before open:</span>
                                <span className={skipProxyCheck ? 'text-amber-500 font-medium' : 'text-emerald-600 font-semibold'}>
                                  {skipProxyCheck ? '⚡ Skipped' : '🛡 Enforced'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= STEP 4: RUNNING MULTI-THREAD DASHBOARD ================= */}
              {step === 4 && (
                <div className="max-w-5xl mx-auto space-y-4">
                  {/* Running Header Controls */}
                  <div className="flex items-center justify-between bg-[#fafbfc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-4 shadow-xs">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base font-bold text-[#1e293b] dark:text-[#f1f5f9]">
                          Session: {sessionName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isExecuting
                              ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                          }`}
                        >
                          {isExecuting ? 'Running' : 'Finished'}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748b] mt-0.5 flex items-center space-x-4">
                        <span>Workers: {numThreads}</span>
                        <span>
                          Virtual Mouse:{' '}
                          <b className={useVirtualMouse ? 'text-red-500' : 'text-slate-500'}>
                            {useVirtualMouse ? 'ENABLED (Independent cursors)' : 'DISABLED'}
                          </b>
                        </span>
                        <span>Elapsed: {elapsedSeconds}s</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isExecuting ? (
                        <button
                          onClick={handleStopAll}
                          className="px-4 py-1.5 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Stop All</span>
                        </button>
                      ) : (
                        <button
                          onClick={startMultiThreadExecution}
                          className="px-4 py-1.5 text-xs rounded-lg bg-[#1677ff] hover:bg-blue-600 text-white font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Rerun</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi-thread Worker Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {threads.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-xl p-3.5 flex flex-col h-72 shadow-xs"
                      >
                        {/* Thread Title */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#1e293b]">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-[#1e293b] dark:text-[#f1f5f9]">{t.name}</span>
                            <span className="text-[10px] font-mono text-[#64748b]">:{t.port}</span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {useVirtualMouse && (
                              <span
                                title="Independent Virtual Mouse active in this Chrome"
                                className="flex items-center space-x-0.5 text-[10px] text-red-500 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.2 rounded font-semibold"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                  <path d="M4 2L20 12L12.5 13.5L9.5 20L4 2Z" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                                </svg>
                                <span>Cursor</span>
                              </span>
                            )}
                            <span
                              className={`w-2 h-2 rounded-full ${
                                t.status === 'running'
                                  ? 'bg-green-500 animate-ping'
                                  : t.status === 'completed'
                                  ? 'bg-blue-500'
                                  : t.status === 'error'
                                  ? 'bg-red-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Current Action Badge */}
                        <div className="py-2">
                          <div className="text-[10px] text-[#64748b]">Current action:</div>
                          <div className="text-xs font-semibold text-[#1677ff] dark:text-[#38bdf8] truncate">
                            {t.currentAction}
                          </div>
                        </div>

                        {/* Thread Console Logs */}
                        <div className="flex-1 overflow-y-auto bg-[#080d19] text-[#cbd5e1] p-2 rounded-md font-mono text-[10px] space-y-1">
                          {t.logs.map((l, lIdx) => (
                            <div
                              key={lIdx}
                              className={`leading-tight ${
                                l.type === 'error'
                                  ? 'text-red-400'
                                  : l.type === 'success'
                                  ? 'text-emerald-400'
                                  : l.type === 'arrow'
                                  ? 'text-purple-300 pl-2'
                                  : 'text-slate-300'
                              }`}
                            >
                              <span className="text-slate-500 mr-1.5">[{l.time}]</span>
                              <span>{l.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer (Matching Images 2, 3, 4) */}
            <div className="px-6 py-3 border-t border-[#e2e8f0] dark:border-[#162236] flex items-center justify-between bg-[#f8fafc] dark:bg-[#080d19] text-xs">
              <span className="text-[#64748b]">Step {step} / 4</span>

              <div className="flex items-center space-x-2.5">
                {step > 1 && step < 4 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-1.5 rounded-lg border border-[#cbd5e1] dark:border-[#1e293b] text-[#475569] dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors"
                  >
                    ← Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    onClick={handleContinue}
                    className="px-5 py-1.5 rounded-lg bg-[#1677ff] hover:bg-blue-600 text-white font-semibold cursor-pointer shadow-xs transition-colors flex items-center space-x-1"
                  >
                    <span>Continue</span>
                    <span>→</span>
                  </button>
                ) : step === 3 ? (
                  <button
                    onClick={handleContinue}
                    className="px-6 py-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-600 text-white font-bold cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Run {numThreads} Threads →</span>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-5 py-1.5 rounded-lg bg-[#1677ff] hover:bg-blue-600 text-white font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
