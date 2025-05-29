import type { Timestamp } from 'firebase/firestore';

export type GameMode = 'initialSetup' | 'gameModeSelection' | 'singlePlayer_category' | 'singlePlayer_game' | 'twoPlayer_lobby' | 'twoPlayer_category' | 'twoPlayer_game' | 'showMessage';

export interface PlayerProfile {
  uid: string;
  displayName: string;
}

export interface CurrentWordState {
  word: string;
  guessedLetters: string[];
  incorrectGuesses: number;
}

export interface BattleData {
  id: string;
  player1Uid: string;
  player1DisplayName: string;
  player1Score: number;
  player2Uid: string | null;
  player2DisplayName: string | null;
  player2Score: number;
  category: string | null;
  wordsForRound: string[];
  currentQuestionIndex: number;
  currentWordState: CurrentWordState | null;
  currentPlayerUidTurn: string | null; // UID of the player whose turn it is
  status: 'waiting_for_player2' | 'category_selection' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SinglePlayerGame {
  category: string;
  wordsForRound: string[];
  currentQuestionIndex: number;
  currentWord: string;
  guessedLetters: string[];
  incorrectGuesses: number;
  score: number;
}

export interface MessageInfo {
  title: string;
  text: string;
  type: 'info' | 'success' | 'error';
  onClose?: () => void;
}
