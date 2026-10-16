import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from './components/Canvas/Canvas';
import { TextLayer } from './components/TextLayer/TextLayer';
import { UIOverlay } from './components/UIOverlay/UIOverlay';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { useGardenNodes } from './hooks/useGardenNodes';
import { generateGarden } from './utils/generation';
import { themes } from './utils/themes';
import { downloadPNG, downloadSVG } from './utils/export';
import {
  parseGardenHash,
  serializeGardenHash,
  ZEN_FADE_TIMEOUT_MS,
  BLOOM_STAGGER_MS,
} from './utils/permalink';
import type { CharacterMeasurement } from './types';

function App() {
  // Parse initial URL hash if present
  const initialParsed = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return parseGardenHash(window.location.hash, themes.map(t => t.id));
    }
    return null;
  }, []);

  const { text, setText, inputRef, handleKeyDown, handleChange } = useKeyboardInput(initialParsed?.text ?? '');
  const [activeThemeId, setActiveThemeId] = useState(initialParsed?.themeId ?? themes[0].id);
  const [measurements, setMeasurements] = useState<CharacterMeasurement[]>([]);
  const [gardenSeed, setGardenSeed] = useState(() => Math.floor(Math.random() * 0xFFFFFF) + 1);
  const [posterMode, setPosterMode] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [haloMode, setHaloMode] = useState(false);
  const [isChromeFaded, setIsChromeFaded] = useState(false);
  const [isUiFocused, setIsUiFocused] = useState(false);
  const [isInitialBloom, setIsInitialBloom] = useState(Boolean(initialParsed?.text));
  const [ariaStatus, setAriaStatus] = useState(() => {
    if (initialParsed?.text) {
      const initialTheme = themes.find(t => t.id === initialParsed.themeId) || themes[0];
      return `Loaded shared garden: '${initialParsed.text}' in ${initialTheme.name} theme. Blooming ${initialParsed.text.length} letters.`;
    }
    return '';
  });

  const prevTextRef = useRef(text);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUiFocusedRef = useRef(isUiFocused);
  isUiFocusedRef.current = isUiFocused;

  // Roll a fresh random master seed and announce when text is cleared to empty
  useEffect(() => {
    if (text === '' && prevTextRef.current !== '') {
      setGardenSeed(Math.floor(Math.random() * 0xFFFFFF) + 1);
      setAriaStatus('Garden cleared.');
    }
    prevTextRef.current = text;
  }, [text]);

  // Clean up initial bloom state once initial sequential bloom completes
  useEffect(() => {
    if (isInitialBloom) {
      const duration = text.length * BLOOM_STAGGER_MS + 1200;
      const timer = setTimeout(() => {
        setIsInitialBloom(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isInitialBloom, text.length]);

  // Intercept standalone Enter key to roll a fresh seed even if pressed repeatedly
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setIsChromeFaded(false);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      if (!isUiFocused) {
        setIsChromeFaded(true);
      }
    }, ZEN_FADE_TIMEOUT_MS);

    if (e.key === 'Enter' && !e.shiftKey) {
      setGardenSeed(Math.floor(Math.random() * 0xFFFFFF) + 1);
    }
    handleKeyDown(e);
  }, [handleKeyDown, isUiFocused]);

  const onTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsChromeFaded(false);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      if (!isUiFocused) {
        setIsChromeFaded(true);
      }
    }, ZEN_FADE_TIMEOUT_MS);
    handleChange(e);
  }, [handleChange, isUiFocused]);

  // Memoize the callback so it doesn't trigger effect loops
  const handleMeasure = useCallback((newMeasurements: CharacterMeasurement[]) => {
    setMeasurements(newMeasurements);
  }, []);

  // Generate garden nodes from text, measurements, and current session master seed
  const rawTargetNodes = useMemo(
    () => generateGarden(text, measurements, gardenSeed),
    [text, measurements, gardenSeed]
  );

  // Sequential bloom on shared permalink load: stagger element animation delays across character indices
  const targetNodes = useMemo(() => {
    if (!isInitialBloom) return rawTargetNodes;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    return rawTargetNodes.map(node => ({
      ...node,
      elements: node.elements.map(el => ({
        ...el,
        delay: prefersReduced ? 0 : el.delay + node.index * BLOOM_STAGGER_MS,
      })),
    }));
  }, [rawTargetNodes, isInitialBloom]);
  
  // Handle withering animation states for backspace
  const displayNodes = useGardenNodes(targetNodes);

  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];
  const themeStyles = {
    '--color-bg': activeTheme.background,
    '--color-text': activeTheme.text,
    '--color-stem': activeTheme.stem,
    '--color-leaf': activeTheme.leaf,
    '--color-flower': activeTheme.flower,
    '--color-flower-center': activeTheme.flowerCenter,
  } as React.CSSProperties;

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const handleTogglePosterMode = useCallback(() => {
    setPosterMode(prev => !prev);
  }, []);

  // Zen Mode toggle & browser fullscreen integration
  const handleToggleZen = useCallback(() => {
    setZenMode(prev => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next) {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          setIsChromeFaded(true);
        } else {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
          setIsChromeFaded(false);
        }
      }
      setAriaStatus(next ? 'Zen mode enabled' : 'Zen mode disabled');
      return next;
    });
  }, []);

  // Sync fullscreenchange with zenMode state
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (typeof document !== 'undefined') {
        const isFull = Boolean(document.fullscreenElement);
        setZenMode(isFull);
        if (isFull) setIsChromeFaded(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // High-contrast text halo toggle
  const handleToggleHalo = useCallback(() => {
    setHaloMode(prev => {
      const next = !prev;
      setAriaStatus(next ? 'High-contrast text halo enabled' : 'High-contrast text halo disabled');
      return next;
    });
  }, []);

  // Theme change handler with ARIA announcement
  const handleThemeSelect = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    const newTheme = themes.find(t => t.id === themeId);
    if (newTheme) {
      setAriaStatus(`Theme changed to ${newTheme.name}.`);
    }
  }, []);

  // R1: Zen Auto-fading inactivity timer
  const resetInactivityTimer = useCallback(() => {
    setIsChromeFaded(false);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    fadeTimerRef.current = setTimeout(() => {
      if (!isUiFocusedRef.current) {
        setIsChromeFaded(true);
      }
    }, ZEN_FADE_TIMEOUT_MS);
  }, []);

  // Activity listeners: pointer movement, touch, keys
  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener('pointermove', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });

    fadeTimerRef.current = setTimeout(() => {
      if (!isUiFocusedRef.current) {
        setIsChromeFaded(true);
      }
    }, ZEN_FADE_TIMEOUT_MS);

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      window.removeEventListener('pointermove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [resetInactivityTimer]);

  // Global keyboard shortcuts: 'F' for Zen, 'H' for Halo (guarded against typing in textarea)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      const key = e.key.toLowerCase();
      const isFromInput = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;

      if (key === 'f') {
        if (!isFromInput || e.altKey) {
          e.preventDefault();
          handleToggleZen();
        }
      } else if (key === 'h') {
        if (!isFromInput || e.altKey) {
          e.preventDefault();
          handleToggleHalo();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleToggleZen, handleToggleHalo]);

  // R2: Real-time URL hash synchronization via replaceState (350ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const newHash = serializeGardenHash(text, activeThemeId);
        if (window.location.hash !== newHash) {
          window.history.replaceState(null, '', newHash);
        }
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [text, activeThemeId]);

  // Listen to hashchange for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const parsed = parseGardenHash(window.location.hash, themes.map(t => t.id));
        if (parsed.text !== text) {
          setText(parsed.text);
        }
        if (parsed.themeId !== activeThemeId) {
          setActiveThemeId(parsed.themeId);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [text, activeThemeId, setText]);

  const handleExportPNG = useCallback(() => {
    downloadPNG(targetNodes, activeTheme, text, haloMode);
  }, [targetNodes, activeTheme, text, haloMode]);

  const handleExportSVG = useCallback(() => {
    downloadSVG(targetNodes, activeTheme, text, haloMode);
  }, [targetNodes, activeTheme, text, haloMode]);

  return (
    <div 
      onClick={handleContainerClick}
      style={{
        ...themeStyles,
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-bg)',
        color: 'white',
        transition: 'background-color 0.4s ease, padding 0.4s ease',
        padding: posterMode ? '3.5vh 4.5vw' : '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Hidden textarea for capturing keyboard events */}
      <textarea
        ref={inputRef}
        value={text}
        onChange={onTextChange}
        onKeyDown={onKeyDown}
        className="visually-hidden"
        aria-label="Type here to grow your garden"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* Main Artwork Stage (with Poster Mode border styling when active) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          border: posterMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
          boxShadow: posterMode ? '0 30px 90px rgba(0, 0, 0, 0.75)' : 'none',
          borderRadius: posterMode ? '4px' : '0',
          transition: 'border 0.4s ease, box-shadow 0.4s ease',
          overflow: 'hidden',
        }}
      >
        {/* Botanical layer behind the letters */}
        <Canvas nodes={displayNodes} depth="back" />
        
        {/* Opaque, muted text: the trellis. Triggers measurement on render */}
        <TextLayer text={text} onMeasure={handleMeasure} haloMode={haloMode} />

        {/* Botanical layer in front of the letters */}
        <Canvas nodes={displayNodes} depth="front" />
      </div>

      {/* UI Overlay (Top & Floating Controls) */}
      <UIOverlay 
        themes={themes} 
        activeThemeId={activeThemeId} 
        onThemeSelect={handleThemeSelect} 
        posterMode={posterMode}
        onTogglePosterMode={handleTogglePosterMode}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        text={text}
        zenMode={zenMode}
        onToggleZen={handleToggleZen}
        haloMode={haloMode}
        onToggleHalo={handleToggleHalo}
        isChromeFaded={isChromeFaded}
        onFocusChange={setIsUiFocused}
        onPermalinkCopied={() => setAriaStatus('Garden permalink copied to clipboard.')}
      />

      {/* Screen reader live region to announce garden events gracefully */}
      <div 
        role="status"
        aria-live="polite" 
        aria-atomic="true"
        className="visually-hidden"
      >
        {ariaStatus}
      </div>
    </div>
  );
}

export default App;
