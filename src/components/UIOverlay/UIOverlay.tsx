import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Theme } from '../../utils/themes';
import { getPermalinkUrl } from '../../utils/permalink';

interface UIOverlayProps {
  themes: Theme[];
  activeThemeId: string;
  onThemeSelect: (id: string) => void;
  posterMode: boolean;
  onTogglePosterMode: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  text?: string;
  zenMode?: boolean;
  onToggleZen?: () => void;
  haloMode?: boolean;
  onToggleHalo?: () => void;
  isChromeFaded?: boolean;
  onFocusChange?: (isFocused: boolean) => void;
  onPermalinkCopied?: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = React.memo(({
  themes,
  activeThemeId,
  onThemeSelect,
  posterMode,
  onTogglePosterMode,
  onExportPNG,
  onExportSVG,
  text = '',
  zenMode = false,
  onToggleZen,
  haloMode = false,
  onToggleHalo,
  isChromeFaded = false,
  onFocusChange,
  onPermalinkCopied,
}) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    let permalink = '';
    if (typeof window !== 'undefined') {
      permalink = getPermalinkUrl(window.location.href, text, activeThemeId);
    }

    let success = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(permalink);
        success = true;
      } catch {
        // Fallback to execCommand below
      }
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = permalink;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      setShowToast(true);
      onPermalinkCopied?.();

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2500);
    } else {
      // Fallback when clipboard permissions are blocked in restricted environments
      if (typeof window !== 'undefined') {
        window.prompt('Copy this garden link:', permalink);
      }
    }
  }, [text, activeThemeId, onPermalinkCopied]);

  return (
    <div
      className={`ui-overlay-container ${isChromeFaded ? 'ui-faded' : ''}`}
      onFocus={() => onFocusChange?.(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onFocusChange?.(false);
        }
      }}
    >
      {/* R2: Toast Notification Pill */}
      {showToast && (
        <div
          className="ui-toast-pill"
          role="status"
          aria-live="polite"
        >
          Garden permalink copied to clipboard!
        </div>
      )}

      {/* Top Header */}
      <div className="ui-overlay-header">
        {/* Top Left: Actions & Attribution */}
        <div className="ui-overlay-header-left">
          <div className="ui-overlay-actions">
            <button
              onClick={handleCopyLink}
              style={actionPillStyle}
              aria-label="Copy garden permalink"
            >
              {copied ? 'copied!' : 'copy link'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleZen?.(); }}
              style={{
                ...actionPillStyle,
                backgroundColor: zenMode ? 'rgba(255, 255, 255, 0.22)' : undefined,
                borderColor: zenMode ? 'rgba(255, 255, 255, 0.4)' : undefined,
                color: zenMode ? '#ffffff' : 'inherit',
              }}
              aria-pressed={zenMode}
              aria-label="Toggle Zen distraction-free mode (F)"
              title="Toggle Zen distraction-free mode (F)"
            >
              {zenMode ? 'zen on' : 'zen'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHalo?.(); }}
              style={{
                ...actionPillStyle,
                backgroundColor: haloMode ? 'rgba(255, 255, 255, 0.22)' : undefined,
                borderColor: haloMode ? 'rgba(255, 255, 255, 0.4)' : undefined,
                color: haloMode ? '#ffffff' : 'inherit',
              }}
              aria-pressed={haloMode}
              aria-label="Toggle high-contrast text halo (H)"
              title="Toggle high-contrast text halo (H)"
            >
              {haloMode ? 'halo on' : 'halo'}
            </button>
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ui-overlay-buy-coffee"
              style={{ ...actionPillStyle, textDecoration: 'none' }}
              aria-label="Buy me a coffee (opens in new tab)"
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
              aria-label="Switch to Type mode"
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
              aria-label="Switch to Poster mode"
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
