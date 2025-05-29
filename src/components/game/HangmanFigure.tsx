'use client';
import type { SVGProps } from 'react';

interface HangmanFigureProps extends SVGProps<SVGSVGElement> {
  incorrectGuesses: number;
}

export default function HangmanFigure({ incorrectGuesses, className, ...props }: HangmanFigureProps) {
  const bodyParts = [
    { key: "head", Component: <circle className="body-part head" cx="60" cy="35" r="10" /> },
    { key: "torso", Component: <line className="body-part torso" x1="60" y1="45" x2="60" y2="75" /> },
    { key: "arm-left", Component: <line className="body-part arm-left" x1="60" y1="55" x2="45" y2="45" /> },
    { key: "arm-right", Component: <line className="body-part arm-right" x1="60" y1="55" x2="75" y2="45" /> },
    { key: "leg-left", Component: <line className="body-part leg-left" x1="60" y1="75" x2="45" y2="95" /> },
    { key: "leg-right", Component: <line className="body-part leg-right" x1="60" y1="75" x2="75" y2="95" /> },
  ];

  return (
    <svg className={`hangman-svg ${className || ''}`} viewBox="0 0 100 120" {...props}>
      {/* Gallows structure */}
      <line x1="10" y1="110" x2="70" y2="110" /> {/* Base */}
      <line x1="20" y1="110" x2="20" y2="10" />  {/* Post */}
      <line x1="20" y1="10" x2="60" y2="10" />   {/* Beam */}
      <line x1="60" y1="10" x2="60" y2="25" />   {/* Noose line */}
      
      {/* Body parts: conditionally render based on incorrectGuesses */}
      {bodyParts.map((part, index) => (
         <g key={part.key} style={{ display: index < incorrectGuesses ? 'inline' : 'none' }}>{part.Component}</g>
      ))}
    </svg>
  );
}
