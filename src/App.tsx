import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from './components/Canvas/Canvas';
import { TextLayer } from './components/TextLayer/TextLayer';
import { UIOverlay } from './components/UIOverlay/UIOverlay';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { useGardenNodes } from './hooks/useGardenNodes';
import { generateGarden } from './utils/generation';
import { themes } from './utils/themes';
import { downloadPNG, downloadSVG } from './utils/export';
import type { CharacterMeasurement } from './types';

function App() {
  const { text, inputRef, handleKeyDown, handleChange } = useKeyboardInput('');
  const [activeThemeId, setActiveThemeId] = useState(themes[0].id);
  const [measurements, setMeasurements] = useState<CharacterMeasurement[]>([]);
  const [gardenSeed, setGardenSeed] = useState(() => Math.floor(Math.random() * 0xFFFFFF) + 1);
  const [posterMode, setPosterMode] = useState(false);
  const prevTextRef = useRef(text);

  // Roll a fresh random master seed whenever text is cleared to empty (e.g. backspacing to 0)
  useEffect(() => {
    if (text === '' && prevTextRef.current !== '') {
      setGardenSeed(Math.floor(Math.random() * 0xFFFFFF) + 1);
    }
    prevTextRef.current = text;
  }, [text]);

  // Intercept standalone Enter key to roll a fresh seed even if pressed repeatedly
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      setGardenSeed(Math.floor(Math.random() * 0xFFFFFF) + 1);
    }
    handleKeyDown(e);
  }, [handleKeyDown]);

  // Memoize the callback so it doesn't trigger effect loops
  const handleMeasure = useCallback((newMeasurements: CharacterMeasurement[]) => {
    setMeasurements(newMeasurements);
  }, []);

  // Generate garden nodes from text, measurements, and current session master seed
  const targetNodes = useMemo(
    () => generateGarden(text, measurements, gardenSeed),
    [text, measurements, gardenSeed]
  );
  
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

  const handleExportPNG = useCallback(() => {
    downloadPNG(targetNodes, activeTheme, text);
  }, [targetNodes, activeTheme, text]);

  const handleExportSVG = useCallback(() => {
    downloadSVG(targetNodes, activeTheme, text);
  }, [targetNodes, activeTheme, text]);

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
        onChange={handleChange}
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
        <TextLayer text={text} onMeasure={handleMeasure} />

        {/* Botanical layer in front of the letters */}
        <Canvas nodes={displayNodes} depth="front" />
      </div>

      {/* UI Overlay (Top & Floating Controls) */}
      <UIOverlay 
        themes={themes} 
        activeThemeId={activeThemeId} 
        onThemeSelect={setActiveThemeId} 
        posterMode={posterMode}
        onTogglePosterMode={handleTogglePosterMode}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
      />

      {/* Screen reader live region to announce typed text gracefully */}
      <div 
        aria-live="polite" 
        className="visually-hidden"
      >
        {text}
      </div>
    </div>
  );
}

export default App;
