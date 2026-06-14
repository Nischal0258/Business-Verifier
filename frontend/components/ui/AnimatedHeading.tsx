"use client";

import React, { useState, useEffect } from "react";

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  initialDelay?: number;
  charDelay?: number;
  transitionDuration?: number;
}

export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({
  text,
  className = "",
  initialDelay = 200,
  charDelay = 30,
  transitionDuration = 500,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, initialDelay);

    return () => clearTimeout(timer);
  }, [initialDelay]);

  const lines = text.split('\n');

  let totalCharsProcessed = 0;

  return (
    <h1 className={className} style={{ letterSpacing: '-0.04em' }}>
      {lines.map((line, lineIndex) => {
        const chars = line.split('');
        const lineStartCharIndex = totalCharsProcessed;
        totalCharsProcessed += chars.length;

        return (
          <div key={`line-${lineIndex}`} className="block">
            {chars.map((char, charIndex) => {
              const globalCharIndex = lineStartCharIndex + charIndex;
              const delay = globalCharIndex * charDelay;

              return (
                <span
                  key={`char-${lineIndex}-${charIndex}`}
                  className="inline-block"
                  style={{
                    opacity: isAnimating ? 1 : 0,
                    transform: isAnimating ? "translateX(0)" : "translateX(-18px)",
                    transitionProperty: "opacity, transform",
                    transitionDuration: `${transitionDuration}ms`,
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                    transitionDelay: `${delay}ms`,
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>
        );
      })}
    </h1>
  );
};
