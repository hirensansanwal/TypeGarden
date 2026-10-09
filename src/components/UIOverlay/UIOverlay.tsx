import React, { useState } from 'react';
import type { Theme } from '../../utils/themes';

interface UIOverlayProps {
  themes: Theme[];
  activeThemeId: string;
  onThemeSelect: (id: string) => void;
  posterMode: boolean;
  onTogglePosterMode: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = React.memo(({
  themes,
  activeThemeId,
  onThemeSelect,
  posterMode,
  onTogglePosterMode,
  onExportPNG,
  onExportSVG,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('https://github.com/type-garden').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ui-overlay-container">
      {/* Top Header */}
      <div className="ui-overlay-header">
        {/* Top Left: Actions & Attribution */}
        <div className="ui-overlay-header-left">
          <div className="ui-overlay-actions">
            <button
              onClick={handleCopyCode}
              style={actionPillStyle}
              aria-label="Copy project link"
            >
              {copied ? 'copied!' : 'copy link'}
            </button>
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ui-overlay-buy-coffee"
              style={{ ...actionPillStyle, textDecoration: 'none' }}
            >
              buy me a coffee
            </a>
          </div>
          <div className="ui-overlay-subtitle">
            a generative type garden
          </div>
        </div>
        
        {/* Top Right: Mode Switcher (Type vs Poster) */}
        <div className="ui-overlay-header-right">
          <div
            role="group"
            aria-label="View Mode"
            style={{
              display: 'inline-flex',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '999px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); if (posterMode) onTogglePosterMode(); }}
              style={{
                ...togglePillStyle,
                backgroundColor: !posterMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: !posterMode ? '#fff' : 'inherit',
                opacity: !posterMode ? 1 : 0.6,
              }}
            >
              Type
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (!posterMode) onTogglePosterMode(); }}
              style={{
                ...togglePillStyle,
                backgroundColor: posterMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: posterMode ? '#fff' : 'inherit',
                opacity: posterMode ? 1 : 0.6,
              }}
            >
              Poster
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="ui-overlay-footer">
        {/* Bottom Left: Help commands */}
        <div className="ui-overlay-help">
          <span>type to grow</span>
          <span>•</span>
          <span>space cuts</span>
          <span>•</span>
          <span>backspace withers</span>
          <span>•</span>
          <span>enter clears</span>
        </div>
        
        {/* Bottom Right: Themes + Export PNG/SVG */}
        <div className="ui-overlay-footer-right">
          {/* Theme Swatches */}
          <div className="ui-swatches-group" role="group" aria-label="Color Themes">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={(e) => { e.stopPropagation(); onThemeSelect(t.id); }}
                aria-label={t.name}
                title={t.name}
                aria-pressed={t.id === activeThemeId}
                className="ui-swatch-btn"
              >
                <span
                  className="ui-swatch-dot"
                  style={{
                    backgroundColor: t.flower,
                    border: t.id === activeThemeId ? `2px solid #ffffff` : `2px solid rgba(255, 255, 255, 0.15)`,
                    boxShadow: t.id === activeThemeId ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                  }}
                />
              </button>
            ))}
          </div>
          
          {/* Active Export Controls */}
          <div className="ui-export-group">
            <button
              onClick={(e) => { e.stopPropagation(); onExportPNG(); }}
              aria-label="Export high-resolution PNG"
              style={exportBtnStyle}
            >
              PNG
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onExportSVG(); }}
              aria-label="Export vector SVG"
              style={exportBtnStyle}
            >
              SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const actionPillStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '999px',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: '0.7rem',
  textTransform: 'inherit',
  letterSpacing: 'inherit',
  cursor: 'pointer',
  padding: '0.35rem 0.85rem',
  transition: 'background 0.2s, border-color 0.2s',
};

const togglePillStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontFamily: 'inherit',
  fontSize: '0.75rem',
  textTransform: 'inherit',
  letterSpacing: 'inherit',
  cursor: 'pointer',
  padding: '0.3rem 0.9rem',
  borderRadius: '999px',
  transition: 'all 0.2s ease',
};

const exportBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: '0.75rem',
  textTransform: 'inherit',
  letterSpacing: 'inherit',
  cursor: 'pointer',
  padding: '0.2rem 0.5rem',
  minHeight: '36px',
  minWidth: '36px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.65,
  transition: 'opacity 0.2s',
};

UIOverlay.displayName = 'UIOverlay';
