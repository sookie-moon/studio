'use client';
import { Button } from '@/components/ui/button';
import { useSounds } from '@/contexts/SoundContext';

interface KeyboardProps {
  guessedLetters: string[];
  onLetterPress: (letter: string) => void;
  disabled?: boolean;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export default function Keyboard({ guessedLetters, onLetterPress, disabled = false }: KeyboardProps) {
  const { playGeneralClickSound, initializeAudio } = useSounds();

  const handleClick = async (letter: string) => {
    await initializeAudio(); // Ensure audio is initialized before playing sound
    playGeneralClickSound();
    onLetterPress(letter);
  };

  return (
    <div id="keyboard" className="grid grid-cols-7 sm:grid-cols-9 gap-2 mb-6">
      {ALPHABET.map((letter) => {
        const isGuessed = guessedLetters.includes(letter);
        return (
          <Button
            key={letter}
            data-letter={letter}
            onClick={() => handleClick(letter)}
            disabled={isGuessed || disabled}
            className={`keyboard-btn text-xs sm:text-sm py-2 px-1 sm:py-3 sm:px-2
              ${isGuessed ? 'bg-muted text-muted-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}
          >
            {letter.toUpperCase()}
          </Button>
        );
      })}
    </div>
  );
}
