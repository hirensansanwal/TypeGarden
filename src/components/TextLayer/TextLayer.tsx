import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CharacterMeasurement } from '../../types';

interface TextLayerProps {
  text: string;
  onMeasure: (measurements: CharacterMeasurement[]) => void;
  haloMode?: boolean;
}

/**
 * Opaque, muted text that acts as the trellis. It must be opaque so that strands on the 'back'
 * layer are genuinely hidden behind the letters. The newest letters blend slightly toward the
 * background (still fully opaque) and settle to full tone as you keep typing.
 */
const FADE_FROM_END = [62, 78, 90]; // % of text colour for the last, 2nd-last, 3rd-last glyph

/**
 * Dynamically scales font size based on text length so short words look expansive,
 * while longer multiline thoughts scale gracefully without clipping.
 */
const getAdaptiveFontSize = (len: number) => {
  if (len <= 8) return 'clamp(3.5rem, 9.5vw, 13rem)';
  if (len <= 18) return 'clamp(2.8rem, 7vw, 9.5rem)';
  if (len <= 35) return 'clamp(2.2rem, 5.2vw, 6.8rem)';
  if (len <= 65) return 'clamp(1.75rem, 3.8vw, 4.8rem)';
  return 'clamp(1.4rem, 2.8vw, 3.6rem)';
};

export const TextLayer: React.FC<TextLayerProps> = React.memo(({ text, onMeasure, haloMode = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [viewportKey, setViewportKey] = useState(0);

  // Active typing state for cursor idle fade-out
  const [isTyping, setIsTyping] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!text) {
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [text]);

  // Re-measure when the viewport changes: wrapping and font size depend on it.
  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setViewportKey((k) => k + 1));
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current || !headingRef.current) return;
    const spans = containerRef.current.querySelectorAll('.char-span');
    const measurements: CharacterMeasurement[] = [];
    
    // Coordinates relative to container center
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const fontSize = parseFloat(getComputedStyle(headingRef.current).fontSize) || 100;

    spans.forEach((span, index) => {
      const el = span as HTMLElement;
      const spanCenterX = el.offsetLeft + el.offsetWidth / 2;
      const spanCenterY = el.offsetTop + el.offsetHeight / 2;
      
      measurements.push({
        char: text[index],
        index,
        x: spanCenterX - centerX,
        y: spanCenterY - centerY,
        width: el.offsetWidth,
        fontSize,
      });
    });

    onMeasure(measurements);
  }, [text, onMeasure, viewportKey]);

  const n = text.length;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none', 
        overflow: 'hidden',
        padding: '0 3vw', // Expanded canvas area (~94% viewport width)
        boxSizing: 'border-box',
      }}
    >
      <h1
        ref={headingRef}
        className={haloMode ? 'text-halo-active' : undefined}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: getAdaptiveFontSize(n), 
          color: 'var(--color-text)',
          textAlign: 'center',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          margin: 0,
          fontWeight: 400,
          lineHeight: 1.45,
          letterSpacing: '0.01em',
          transition: 'font-size 0.3s ease, color 0.3s ease',
        }}
        aria-hidden="true" 
      >
        {text.split('').map((char, i) => {
          const fromEnd = n - 1 - i;
          const mix = FADE_FROM_END[fromEnd];
          return (
            <span
              key={i}
              className="char-span"
              style={mix ? { color: `color-mix(in srgb, var(--color-text) ${mix}%, var(--color-bg))` } : undefined}
            >
              {char}
            </span>
          );
        })}
        {/* Cursor: active during typing, fades out after 1.5s idle */}
        <span className={`custom-cursor ${isTyping ? 'cursor-active' : 'cursor-idle'}`}>|</span>
      </h1>
    </div>
  );
});

TextLayer.displayName = 'TextLayer';
