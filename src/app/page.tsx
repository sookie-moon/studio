'use client';
import { useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';

import InitialSetup from '@/components/game/InitialSetup';
import GameModeSelection from '@/components/game/GameModeSelection';
import BattleLobby from '@/components/game/BattleLobby';
import MessageBox from '@/components/game/MessageBox';
import CategorySelection from '@/components/game/CategorySelection';
import GameArea from '@/components/game/GameArea';
import { Loader2 } from 'lucide-react';

import { useFirebase } from '@/contexts/FirebaseContext';
import { useSounds } from '@/contexts/SoundContext';
import * as GameService from '@/lib/gameService';
import type { GameMode, PlayerProfile, BattleData, SinglePlayerGame, MessageInfo } from '@/types';
import { ROUND_LENGTH, MAX_INCORRECT_GUESSES_PER_WORD } from '@/config/appConfig';

export default function HomePage() {
  const { user, loadingAuth, playerProfile } = useFirebase();
  const sounds = useSounds();

  const [currentGameMode, setCurrentGameMode] = useState<GameMode>('initialSetup');
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);
  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [singlePlayerGame, setSinglePlayerGame] = useState<SinglePlayerGame | null>(null);
  const [messageInfo, setMessageInfo] = useState<MessageInfo | null>(null);
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);


  // Store unsubscribe function in a ref to avoid re-triggering useEffect that depends on it
  const battleUnsubscribeRef = React.useRef<Unsubscribe | null>(null);
  
  useEffect(() => {
    if (!loadingAuth && playerProfile) {
       // If profile exists and name is not default "Player", or if it is default, stay on initialSetup
      if (playerProfile.displayName && playerProfile.displayName !== "Player") {
         setCurrentGameMode('gameModeSelection');
      } else {
         setCurrentGameMode('initialSetup');
      }
    } else if (!loadingAuth && !playerProfile) {
        setCurrentGameMode('initialSetup');
    }
  }, [loadingAuth, playerProfile]);
  
  useEffect(() => {
    return () => { 
      if (battleUnsubscribeRef.current) {
        battleUnsubscribeRef.current();
      }
    };
  }, []);

  const showMsg = useCallback((title: string, text: string, type: 'info' | 'success' | 'error' = 'info', onClose?: () => void) => {
    setMessageInfo({ title, text, type, onClose });
    setIsMessageBoxOpen(true);
  }, []);

  const handleNameSaved = useCallback(() => {
    setCurrentGameMode('gameModeSelection');
  }, []);

  const resetToGameModeSelection = useCallback(() => {
    if (battleUnsubscribeRef.current) {
      battleUnsubscribeRef.current();
      battleUnsubscribeRef.current = null;
    }
    setActiveBattleId(null);
    setBattleData(null);
    setSinglePlayerGame(null);
    setCurrentGameMode('gameModeSelection');
    setIsMessageBoxOpen(false); // Close any open message box
  }, []);


  const listenToBattle = useCallback((battleId: string) => {
    if (battleUnsubscribeRef.current) battleUnsubscribeRef.current();
    battleUnsubscribeRef.current = GameService.listenToBattleUpdates(battleId, (data) => {
      setBattleData(data);
      if (data) {
        if (data.status === 'waiting_for_player2' && data.player1Uid === user?.uid) {
            setCurrentGameMode('twoPlayer_lobby');
        } else if (data.status === 'category_selection') {
            setCurrentGameMode('twoPlayer_category');
            // If current user is P2 and P1 is choosing category, show waiting message
            if(user?.uid === data.player2Uid && data.currentPlayerUidTurn === data.player1Uid && !isMessageBoxOpen){
                // This message might be annoying if it keeps popping up. Consider if it's needed.
                // showMsg("Waiting", `${data.player1DisplayName} is choosing a category...`, "info");
            } else {
               setIsMessageBoxOpen(false); // Close "waiting for category" message if P1 selected or I am P1
            }
        } else if (data.status === 'in_progress' && data.currentWordState) {
            setCurrentGameMode('twoPlayer_game');
            setIsMessageBoxOpen(false); 
        } else if (data.status === 'completed') {
            let roundEndMessage = `Battle Over! Final Scores:\n${data.player1DisplayName}: ${data.player1Score}\n`;
            if(data.player2DisplayName) roundEndMessage += `${data.player2DisplayName}: ${data.player2Score}\n`;
            
            if (data.player1Score > data.player2Score) roundEndMessage += `${data.player1DisplayName} wins!`;
            else if (data.player2Score > data.player1Score) roundEndMessage += `${data.player2DisplayName} wins!`;
            else roundEndMessage += "It's a tie!";
            showMsg("Battle Complete!", roundEndMessage, "info", resetToGameModeSelection);
            if(battleUnsubscribeRef.current) battleUnsubscribeRef.current();
            setActiveBattleId(null);
        }
      } else { 
        showMsg("Battle Ended", "This battle no longer exists or was cancelled.", "info", resetToGameModeSelection);
        if(battleUnsubscribeRef.current) battleUnsubscribeRef.current();
        setActiveBattleId(null);
      }
    });
  }, [user, showMsg, resetToGameModeSelection, isMessageBoxOpen]);

  const handleModeSelected = useCallback(async (mode: 'singlePlayer_category' | 'twoPlayer_lobby' | 'twoPlayer_join', battleIdInput?: string) => {
    await sounds.initializeAudio(); 
    setIsLoadingAction(true);
    if (mode === 'singlePlayer_category') {
      setSinglePlayerGame(null); 
      setCurrentGameMode('singlePlayer_category');
    } else if (mode === 'twoPlayer_lobby') {
      if (!playerProfile) { setIsLoadingAction(false); return; }
      try {
        const newBattleId = await GameService.createNewBattle(playerProfile);
        setActiveBattleId(newBattleId);
        listenToBattle(newBattleId);
        setCurrentGameMode('twoPlayer_lobby');
      } catch (error: any) {
        showMsg("Error Creating Battle", error.message || "Could not create battle.", "error");
      }
    } else if (mode === 'twoPlayer_join' && battleIdInput) {
      if (!playerProfile) { setIsLoadingAction(false); return; }
      try {
        const joinedBattle = await GameService.joinBattle(battleIdInput, playerProfile);
        if (joinedBattle) {
          setActiveBattleId(joinedBattle.id);
          setBattleData(joinedBattle); 
          listenToBattle(joinedBattle.id);
          // Transition will be handled by listener based on status
        }
      } catch (error: any) {
        showMsg("Error Joining Battle", error.message || "Could not join battle.", "error");
      }
    }
    setIsLoadingAction(false);
  }, [playerProfile, sounds, listenToBattle, showMsg]);


  const handleCategorySelect = useCallback(async (categoryName: string) => {
    await sounds.initializeAudio();
    setIsLoadingAction(true);
    const words = GameService.generateWordsForRound(categoryName);
    if (words.length === 0) {
      showMsg("Error", `No words available for category: ${categoryName}. Choose another.`, "error");
      setIsLoadingAction(false);
      return;
    }

    if (currentGameMode === 'singlePlayer_category') {
      try {
        const gameSetup = GameService.startSinglePlayerGame(categoryName)
        setSinglePlayerGame(gameSetup);
        setCurrentGameMode('singlePlayer_game');
      } catch (error: any) {
        showMsg("Error Starting Game", error.message, "error");
      }
    } else if (currentGameMode === 'twoPlayer_category' && activeBattleId && battleData?.player1Uid === user?.uid) {
      try {
        await GameService.selectCategoryForBattle(activeBattleId, categoryName, words);
      } catch (error: any) {
        showMsg("Error Setting Category", error.message || "Could not set category for battle.", "error");
      }
    }
    setIsLoadingAction(false);
  }, [sounds, currentGameMode, activeBattleId, battleData, user, showMsg]);

  const handleLetterPress = useCallback(async (letter: string) => {
    await sounds.initializeAudio();
    if (currentGameMode === 'singlePlayer_game' && singlePlayerGame) {
      const { game: newGame, outcome } = GameService.handleSinglePlayerGuess(singlePlayerGame, letter);
      setSinglePlayerGame(newGame);
      
      if (outcome === 'correct_letter') sounds.playCorrectLetterSound();
      else if (outcome === 'incorrect_letter') sounds.playIncorrectLetterSound();
      
      if (outcome === 'word_solved') {
        sounds.playWordSolvedSound();
        showMsg("Correct!", `You guessed: ${newGame.currentWord.toUpperCase()}`, "success", () => {
          const nextState = GameService.nextSinglePlayerWord(newGame);
          if (nextState) setSinglePlayerGame(nextState);
          else showMsg("Round Over!", `You scored ${newGame.score} out of ${Math.min(newGame.currentQuestionIndex + 1, ROUND_LENGTH)}.`, "info", resetToGameModeSelection);
        });
      } else if (outcome === 'word_failed') {
        sounds.playWordFailedSound();
        showMsg("Incorrect!", `The word was: ${newGame.currentWord.toUpperCase()}.`, "error", () => {
          const nextState = GameService.nextSinglePlayerWord(newGame);
          if (nextState) setSinglePlayerGame(nextState);
          else showMsg("Round Over!", `You scored ${newGame.score} out of ${Math.min(newGame.currentQuestionIndex + 1, ROUND_LENGTH)}.`, "info", resetToGameModeSelection);
        });
      }
    } else if (currentGameMode === 'twoPlayer_game' && activeBattleId && battleData && user && battleData.currentWordState && battleData.currentPlayerUidTurn === user.uid) {
        // Optimistically play sound based on local check, Firebase update will confirm state
        const currentWordState = battleData.currentWordState;
        const correctGuess = currentWordState.word.toLowerCase().includes(letter);
        const alreadyGuessed = currentWordState.guessedLetters.includes(letter);
        const maxGuesses = currentWordState.incorrectGuesses >= MAX_INCORRECT_GUESSES_PER_WORD;

        if (!alreadyGuessed && !maxGuesses) {
            if (correctGuess) sounds.playCorrectLetterSound(); else sounds.playIncorrectLetterSound();
        }
        // Full word solved/failed sounds will be triggered by listener when state changes dramatically
        
        try {
            await GameService.submitPlayerGuess(activeBattleId, battleData, letter, user.uid);
        } catch (error: any) {
            showMsg("Error Submitting Guess", error.message || "Could not submit guess.", "error");
        }
    }
  }, [sounds, currentGameMode, singlePlayerGame, activeBattleId, battleData, user, showMsg, resetToGameModeSelection]);

  const handleCancelBattle = useCallback(async () => {
    if (activeBattleId) {
      setIsLoadingAction(true);
      try {
        await GameService.cancelBattle(activeBattleId);
        // Listener should pick up deletion and reset state, or we can force it.
        resetToGameModeSelection(); 
      } catch (error: any) {
        showMsg("Error Cancelling Battle", error.message || "Could not cancel battle.", "error");
      }
      setIsLoadingAction(false);
    } else {
       resetToGameModeSelection(); // If no active battle, just go back
    }
  }, [activeBattleId, showMsg, resetToGameModeSelection]);
  
  const handleEndRoundEarly = useCallback(async () => {
    await sounds.initializeAudio();
    setIsLoadingAction(true);
    if (currentGameMode === 'singlePlayer_game' && singlePlayerGame) {
      showMsg("Round Ended", `You scored ${singlePlayerGame.score} out of ${Math.min(singlePlayerGame.currentQuestionIndex +1, ROUND_LENGTH)}.`, "info", resetToGameModeSelection);
    } else if (currentGameMode === 'twoPlayer_game' && activeBattleId && battleData?.currentPlayerUidTurn === user?.uid) {
      try {
        await GameService.endBattleEarly(activeBattleId);
      } catch (error: any) {
        showMsg("Error Ending Round", error.message || "Could not end round.", "error");
      }
    }
    setIsLoadingAction(false);
  }, [sounds, currentGameMode, singlePlayerGame, activeBattleId, battleData, user, showMsg, resetToGameModeSelection]);


  const renderContent = () => {
    if (loadingAuth || isLoadingAction && currentGameMode !== 'initialSetup') { // Keep initialSetup responsive
      return <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4">Loading...</p></div>;
    }

    switch (currentGameMode) {
      case 'initialSetup':
        return <InitialSetup onNameSaved={handleNameSaved} showMessage={showMsg} />;
      case 'gameModeSelection':
        return <GameModeSelection onModeSelected={handleModeSelected} onBackToNameSetup={() => setCurrentGameMode('initialSetup')} showMessage={showMsg} />;
      case 'twoPlayer_lobby':
        return activeBattleId ? <BattleLobby battleId={activeBattleId} onCancelBattle={handleCancelBattle} /> : <GameModeSelection onModeSelected={handleModeSelected} onBackToNameSetup={() => setCurrentGameMode('initialSetup')} showMessage={showMsg} />;
      case 'singlePlayer_category':
      case 'twoPlayer_category':
        return <CategorySelection 
                  onCategorySelect={handleCategorySelect} 
                  title={currentGameMode === 'singlePlayer_category' ? "Choose a Category" : `Choose Category`}
                  isMyTurnToSelect={currentGameMode === 'singlePlayer_category' || (battleData?.status === 'category_selection' && battleData?.player1Uid === user?.uid)}
                  battleData={battleData}
                />;
      case 'singlePlayer_game':
        return singlePlayerGame ? <GameArea playerProfile={playerProfile} singlePlayerGame={singlePlayerGame} isMyTurn={true} onLetterPress={handleLetterPress} onLeaveGame={resetToGameModeSelection} onEndRoundEarly={handleEndRoundEarly} /> : <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4">Loading Game...</p></div>;
      case 'twoPlayer_game':
        return battleData && battleData.currentWordState ? <GameArea playerProfile={playerProfile} battleData={battleData} isMyTurn={battleData.currentPlayerUidTurn === user?.uid} onLetterPress={handleLetterPress} onLeaveGame={resetToGameModeSelection} onEndRoundEarly={handleEndRoundEarly} /> : <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4">Loading Battle...</p></div>;
      default:
        return <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4">Initializing...</p></div>;
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {renderContent()}
      {isMessageBoxOpen && messageInfo && <MessageBox messageInfo={messageInfo} isOpen={isMessageBoxOpen} onClose={() => { setIsMessageBoxOpen(false); if(messageInfo.onClose) messageInfo.onClose(); }} />}
    </main>
  );
}
