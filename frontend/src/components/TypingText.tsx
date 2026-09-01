'use client';

import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export default function TypingText({ text, speed = 15, className = '', onComplete }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayedText(text);
      setIsTyping(false);
      onComplete?.();
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  const handleSkip = () => {
    setDisplayedText(text);
    setIsTyping(false);
    onComplete?.();
  };

  return (
    <div className="relative group">
      <span className={className}>
        {displayedText}
        {isTyping && <span className="inline-block w-1.5 h-4 ml-0.5 bg-indigo-400 animate-pulse align-middle" />}
      </span>
      {isTyping && (
        <button
          onClick={handleSkip}
          className="absolute -top-6 right-0 text-[11px] text-slate-400 hover:text-slate-200 underline opacity-70 hover:opacity-100 transition-opacity"
        >
          Skip animation
        </button>
      )}
    </div>
  );
}
