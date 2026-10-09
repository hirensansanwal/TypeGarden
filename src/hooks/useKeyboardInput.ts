import { useState, useEffect, useRef, useCallback } from 'react';

export function useKeyboardInput(initialText: string = '') {
  const [text, setText] = useState<string>(initialText);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    };
    
    // Initial focus
    focusInput();
    
    // Re-focus on clicks to ensure we don't lose the keyboard
    document.addEventListener('click', focusInput);
    document.addEventListener('touchstart', focusInput, { passive: true });
    
    return () => {
      document.removeEventListener('click', focusInput);
      document.removeEventListener('touchstart', focusInput);
    };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Intercept standalone Enter to clear text; Shift+Enter creates a natural line break without wiping
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        setText('');
      }
      // On Shift+Enter: allow default textarea behavior to insert \n and fire onChange
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  return { text, setText, inputRef, handleKeyDown, handleChange };
}

