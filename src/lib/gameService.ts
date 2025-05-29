'use client'; 

import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, 
  serverTimestamp, collection, addDoc, type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { APP_ID, WORD_CATEGORIES, ROUND_LENGTH, MAX_INCORRECT_GUESSES_PER_WORD } from '@/config/appConfig';
import type { BattleData, PlayerProfile, SinglePlayerGame, CurrentWordState } from '@/types';

export function generateWordsForRound(categoryName: string): string[] {
  const categoryWordsMasterList = WORD_CATEGORIES[categoryName] ? [...WORD_CATEGORIES[categoryName]] : [];
  if (categoryWordsMasterList.length === 0) return [];

  let words: string[] = [];
  let usedThisSelection: string[] = [];
  // Ensure ROUND_LENGTH doesn't exceed available unique words
  const numWordsToSelect = Math.min(ROUND_LENGTH, categoryWordsMasterList.length);


  for (let i = 0; i < numWordsToSelect; i++) {
    // Filter available words for this specific selection pass
    let availableCatWordsPass = categoryWordsMasterList.filter(w => !usedThisSelection.includes(w));
    
    // If all words from master list are used for this selection pass, and we still need more words (i < numWordsToSelect)
    // AND we allow duplicates across the entire round (but not within a pass)
    // then we could reset usedThisSelection and filter again.
    // However, current logic implies unique words up to numWordsToSelect or list size.
    if(availableCatWordsPass.length === 0) {
        // This case means we've exhausted unique words from categoryWordsMasterList
        // for the current `usedThisSelection` set.
        // If `numWordsToSelect` is greater than `categoryWordsMasterList.length`,
        // this loop structure already ensures we don't try to pick more than available.
        // If `ROUND_LENGTH` is very high and category is small, it will pick all unique words.
        break;
    }

    const randomIndex = Math.floor(Math.random() * availableCatWordsPass.length);
    const word = availableCatWordsPass[randomIndex];
    words.push(word);
    usedThisSelection.push(word); 
  }
  return words;
}

export async function createNewBattle(player: PlayerProfile): Promise<string> {
  if (!player.uid || !player.displayName) {
    throw new Error("Player information is missing.");
  }
  const battleDocRef = await addDoc(collection(db, "artifacts", APP_ID, "public", "data", "hangmanBattles"), {
    player1Uid: player.uid,
    player1DisplayName: player.displayName,
    player1Score: 0,
    player2Uid: null,
    player2DisplayName: null,
    player2Score: 0,
    category: null,
    wordsForRound: [],
    currentQuestionIndex: 0,
    currentWordState: null,
    currentPlayerUidTurn: player.uid, 
    status: 'waiting_for_player2',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as Omit<BattleData, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any });
  return battleDocRef.id;
}

export async function joinBattle(battleId: string, player: PlayerProfile): Promise<BattleData | null> {
  if (!player.uid || !player.displayName) {
    throw new Error("Your player information is missing.");
  }
  const battleDocRef = doc(db, "artifacts", APP_ID, "public", "data", "hangmanBattles", battleId);
  const battleDocSnap = await getDoc(battleDocRef);

  if (!battleDocSnap.exists()) {
    throw new Error("Battle ID not found.");
  }

  const currentBattleData = { id: battleDocSnap.id, ...battleDocSnap.data() } as BattleData;

  if (currentBattleData.player1Uid === player.uid) {
    return currentBattleData;
  }

  if (currentBattleData.status === "waiting_for_player2") {
    await updateDoc(battleDocRef, {
      player2Uid: player.uid,
      player2DisplayName: player.displayName,
      status: "category_selection", 
      currentPlayerUidTurn: currentBattleData.player1Uid, 
      updatedAt: serverTimestamp()
    });
    const updatedSnap = await getDoc(battleDocRef); 
    return { id: updatedSnap.id, ...updatedSnap.data() } as BattleData;

  } else if (currentBattleData.player2Uid === player.uid && currentBattleData.status !== "completed") {
     return currentBattleData;
  } else if (currentBattleData.status === "completed") {
    throw new Error("This battle has already been completed.");
  } else {
    throw new Error("This battle is already full or not joinable.");
  }
}

export async function cancelBattle(battleId: string): Promise<void> {
  const battleDocRef = doc(db, "artifacts", APP_ID, "public", "data", "hangmanBattles", battleId);
  await deleteDoc(battleDocRef);
}

export function listenToBattleUpdates(battleId: string, callback: (data: BattleData | null) => void): Unsubscribe {
  const battleDocRef = doc(db, "artifacts", APP_ID, "public", "data", "hangmanBattles", battleId);
  return onSnapshot(battleDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as BattleData);
    } else {
      callback(null); 
    }
  }, (error) => {
    console.error("Error listening to battle updates:", error);
  });
}

export async function selectCategoryForBattle(battleId: string, categoryName: string, words: string[]): Promise<void> {
  const battleDocRef = doc(db, "artifacts", APP_ID, "public", "data", "hangmanBattles", battleId);
  const firstWord = words[0];
  const initialWordState: CurrentWordState = {
    word: firstWord,
    guessedLetters: [],
    incorrectGuesses: 0,
  };
  await updateDoc(battleDocRef, {
    category: categoryName,
    wordsForRound: words,
    currentQuestionIndex: 0,
    currentWordState: initialWordState,
    status: 'in_progress',
    currentPlayerUidTurn: (await getDoc(battleDocRef)).data()?.player1Uid, // P1 starts the first word after category selection
    updatedAt: serverTimestamp()
  });
}

export async function submitPlayerGuess(battleId: string, battleData: BattleData, guessedLetter: string, userId: string): Promise<void> {
    if (!battleData.currentWordState || battleData.currentPlayerUidTurn !== userId) {
        console.warn("Not player's turn or no current word state.");
        return;
    }

    let { word, guessedLetters, incorrectGuesses } = battleData.currentWordState;
    if (guessedLetters.includes(guessedLetter) || incorrectGuesses >= MAX_INCORRECT_GUESSES_PER_WORD) {
        console.warn("Letter already guessed or max incorrect guesses reached.");
        return;
    }

    const newGuessedLetters = [...guessedLetters, guessedLetter];
    const correctGuess = word.toLowerCase().includes(guessedLetter);
    let newIncorrectGuesses = incorrectGuesses;
    if (!correctGuess) {
        newIncorrectGuesses++;
    }

    const wordGuessed = word.toLowerCase().split('').filter(char => char !== ' ').every(char => newGuessedLetters.includes(char));
    const wordLost = newIncorrectGuesses >= MAX_INCORRECT_GUESSES_PER_WORD;

    let newPlayer1Score = battleData.player1Score;
    let newPlayer2Score = battleData.player2Score;
    
    if (wordGuessed) {
        if (userId === battleData.player1Uid) newPlayer1Score++;
        else newPlayer2Score++;
    }

    let nextPlayerUidTurn = battleData.currentPlayerUidTurn;
     if (!wordGuessed && !wordLost) { // If word is not resolved yet
        if (!correctGuess && battleData.player2Uid) { // Incorrect guess, switch turn if P2 exists
             nextPlayerUidTurn = userId === battleData.player1Uid ? battleData.player2Uid : battleData.player1Uid;
        }
        // If correct guess, current player continues
    }


    const updatedWordState: CurrentWordState = { ...battleData.currentWordState, guessedLetters: newGuessedLetters, incorrectGuesses: newIncorrectGuesses };

    const updatePayload: Partial<BattleData> & { updatedAt: any } = {
        currentWordState: updatedWordState,
        player1Score: newPlayer1Score,
        player2Score: newPlayer2Score,
        currentPlayerUidTurn: nextPlayerUidTurn, // Updated turn
        updatedAt: serverTimestamp()
    };
    
    if (wordGuessed || wordLost) {
        const newQuestionIndex = battleData.currentQuestionIndex + 1;
        if (newQuestionIndex >= battleData.wordsForRound.length || newQuestionIndex >= ROUND_LENGTH) {
            updatePayload.status = "completed";
            updatePayload.currentWordState = null; 
        } else {
            const nextWord = battleData.wordsForRound[newQuestionIndex];
            updatePayload.currentQuestionIndex = newQuestionIndex;
            updatePayload.currentWordState = { word: nextWord, guessedLetters: [], incorrectGuesses: 0 };
            // After a word is resolved (guessed/lost), it's the other player's turn to start the new word, or P1 if P2 doesn't exist
            if (battleData.player2Uid) {
                updatePayload.currentPlayerUidTurn = userId === battleData.player1Uid ? battleData.player2Uid : battleData.player1Uid;
            } else {
                updatePayload.currentPlayerUidTurn = battleData.player1Uid;
            }
        }
    }
    
    const battleDocRef = doc(db, "artifacts", APP_ID, "public", "data", "hangmanBattles", battleId);
    await updateDoc(battleDocRef, updatePayload);
}

export async function endBattleEarly(battleId: string): Promise<void> {
  const battleDocRef = doc(db, "artifacts", APP_ID, "public", "data", "hangmanBattles", battleId);
  await updateDoc(battleDocRef, {
    status: "completed",
    updatedAt: serverTimestamp()
  });
}

export function startSinglePlayerGame(categoryName: string): SinglePlayerGame {
  const words = generateWordsForRound(categoryName);
  if (words.length === 0) throw new Error("No words for category.");
  return {
    category: categoryName,
    wordsForRound: words,
    currentQuestionIndex: 0,
    currentWord: words[0],
    guessedLetters: [],
    incorrectGuesses: 0,
    score: 0,
  };
}

export function handleSinglePlayerGuess(game: SinglePlayerGame, letter: string): { game: SinglePlayerGame, outcome: 'correct_letter' | 'incorrect_letter' | 'word_solved' | 'word_failed' | 'already_guessed' } {
  if (game.guessedLetters.includes(letter)) return { game, outcome: 'already_guessed' };

  const newGuessedLetters = [...game.guessedLetters, letter];
  let newIncorrectGuesses = game.incorrectGuesses;
  let outcome: 'correct_letter' | 'incorrect_letter' | 'word_solved' | 'word_failed';

  if (game.currentWord.toLowerCase().includes(letter)) {
    outcome = 'correct_letter';
    const wordSolved = game.currentWord.toLowerCase().split('').filter(char => char !== ' ').every(char => newGuessedLetters.includes(char));
    if (wordSolved) {
      outcome = 'word_solved';
      const newGame = { ...game, guessedLetters: newGuessedLetters, score: game.score + 1 };
      return { game: newGame, outcome };
    }
  } else {
    newIncorrectGuesses++;
    outcome = 'incorrect_letter';
    if (newIncorrectGuesses >= MAX_INCORRECT_GUESSES_PER_WORD) {
      outcome = 'word_failed';
    }
  }
  const updatedGame = { ...game, guessedLetters: newGuessedLetters, incorrectGuesses: newIncorrectGuesses };
  return { game: updatedGame, outcome };
}

export function nextSinglePlayerWord(game: SinglePlayerGame): SinglePlayerGame | null {
  const newIndex = game.currentQuestionIndex + 1;
  if (newIndex >= game.wordsForRound.length || newIndex >= ROUND_LENGTH) {
    return null; // Game over
  }
  return {
    ...game,
    currentQuestionIndex: newIndex,
    currentWord: game.wordsForRound[newIndex],
    guessedLetters: [],
    incorrectGuesses: 0,
  };
}
