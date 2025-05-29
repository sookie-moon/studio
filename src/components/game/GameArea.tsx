'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Removed unused CardDescription, CardFooter
import HangmanFigure from './HangmanFigure';
import Keyboard from './Keyboard';
import { MAX_INCORRECT_GUESSES_PER_WORD, ROUND_LENGTH } from '@/config/appConfig';
import type { BattleData, PlayerProfile, SinglePlayerGame } from '@/types';
import { useSounds } from '@/contexts/SoundContext';

interface GameAreaProps {
  playerProfile: PlayerProfile | null;
  singlePlayerGame?: SinglePlayerGame;
  battleData?: BattleData | null;
  isMyTurn?: boolean;
  onLetterPress: (letter: string) => void;
  onLeaveGame: () => void;
  onEndRoundEarly?: () => void; 
}

export default function GameArea({
  playerProfile,
  singlePlayerGame,
  battleData,
  isMyTurn,
  onLetterPress,
  onLeaveGame,
  onEndRoundEarly,
}: GameAreaProps) {
  const { playGeneralClickSound } = useSounds();

  const gameMode = singlePlayerGame ? 'singlePlayer' : (battleData ? 'twoPlayer' : null);
  
  const currentCategory = singlePlayerGame?.category || battleData?.category;
  const currentQuestionIndex = singlePlayerGame?.currentQuestionIndex ?? battleData?.currentQuestionIndex ?? 0;
  const wordToGuess = singlePlayerGame?.currentWord || battleData?.currentWordState?.word;
  const guessedLetters = singlePlayerGame?.guessedLetters || battleData?.currentWordState?.guessedLetters || [];
  const incorrectGuessesCount = singlePlayerGame?.incorrectGuesses || battleData?.currentWordState?.incorrectGuesses || 0;
  
  const displayWord = wordToGuess
    ? wordToGuess.split('').map((char, idx) => {
        if (char === ' ') return <span key={`space-${idx}`} className="inline-block w-3 sm:w-4"> </span>;
        const lowerChar = char.toLowerCase();
        return (
          <span
            key={`${char}-${idx}`}
            className={`inline-block w-6 sm:w-8 text-center border-b-2 ${
              guessedLetters.includes(lowerChar) ? 'border-primary' : 'border-panel-light'
            }`}
          >
            {guessedLetters.includes(lowerChar) ? char.toUpperCase() : '_'}
          </span>
        );
      })
    : "Loading word...";

  const incorrectLettersDisplay = guessedLetters
    .filter(l => wordToGuess && !wordToGuess.toLowerCase().includes(l) && l !== ' ')
    .join(', ')
    .toUpperCase();

  const guessesLeft = MAX_INCORRECT_GUESSES_PER_WORD - incorrectGuessesCount;

  const handleLeave = () => {
    playGeneralClickSound();
    onLeaveGame();
  };

  const handleEndRound = () => {
    if (onEndRoundEarly) {
      playGeneralClickSound();
      onEndRoundEarly();
    }
  };

  return (
    <Card className="w-full max-w-2xl text-center bg-panel">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm text-left">
              P1: <span className="font-semibold text-primary">{singlePlayerGame ? playerProfile?.displayName : battleData?.player1DisplayName}</span>
              {' - Score: '}
              <span className="font-semibold text-accent-success">{singlePlayerGame ? singlePlayerGame.score : battleData?.player1Score || 0}</span>
            </p>
            {battleData && (
              <p className="text-sm text-left">
                P2: <span className="font-semibold text-primary">{battleData.player2DisplayName || 'Waiting...'}</span>
                {' - Score: '}
                <span className="font-semibold text-accent-success">{battleData.player2Score || 0}</span>
              </p>
            )}
          </div>
          <Button variant="link" onClick={handleLeave} className="text-xs text-accent-error hover:underline ml-4 !p-0 h-auto">
            Back to Modes
          </Button>
        </div>
        {battleData && (
          <p className="text-lg font-semibold text-primary">
            Turn: <span >{battleData.currentPlayerUidTurn === battleData.player1Uid ? battleData.player1DisplayName : battleData.player2DisplayName}</span>
          </p>
        )}
      </CardHeader>

      <CardContent>
        <CardTitle className="text-xl font-bold mb-1 text-primary">Category: {currentCategory || 'N/A'}</CardTitle>
        <div className="text-sm mb-4">
          <span>Question: <span className="font-semibold text-accent-success">{Math.min(currentQuestionIndex + 1, ROUND_LENGTH)}/{ROUND_LENGTH}</span></span>
        </div>
        
        <div className="mb-6 flex justify-center">
          <HangmanFigure incorrectGuesses={incorrectGuessesCount} />
        </div>
        
        <div id="word-display" className="text-2xl sm:text-3xl font-semibold tracking-widest mb-6 min-h-[3rem] flex items-center justify-center flex-wrap space-x-1 sm:space-x-2">
          {displayWord}
        </div>
        
        <div className="mb-6 min-h-[2.5rem] text-sm">
          <p>Incorrect Guesses: <span className="font-semibold text-accent-error">{incorrectLettersDisplay || 'None'}</span></p>
          <p>Guesses Left: <span className="font-semibold text-accent-success">{guessesLeft}</span></p>
        </div>
        
        <Keyboard 
          guessedLetters={guessedLetters} 
          onLetterPress={onLetterPress} 
          disabled={gameMode === 'twoPlayer' && !isMyTurn} 
        />
      
        {onEndRoundEarly && (
           <Button
            id="end-round-early-btn"
            onClick={handleEndRound}
            className="action-btn bg-accent-error hover:bg-accent-error/90 btn-error-text w-full mt-2"
            disabled={gameMode === 'twoPlayer' && !isMyTurn}
          >
            End Round & See Results
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
