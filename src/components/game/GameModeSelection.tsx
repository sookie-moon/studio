'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useFirebase } from '@/contexts/FirebaseContext';
import { useSounds } from '@/contexts/SoundContext';

interface GameModeSelectionProps {
  onModeSelected: (mode: 'singlePlayer_category' | 'twoPlayer_lobby' | 'twoPlayer_join', battleId?: string) => void;
  onBackToNameSetup: () => void;
  showMessage: (title: string, text: string, type?: 'info' | 'success' | 'error') => void;
}

export default function GameModeSelection({ onModeSelected, onBackToNameSetup, showMessage }: GameModeSelectionProps) {
  const { playerProfile } = useFirebase();
  const { initializeAudio, playGeneralClickSound } = useSounds();
  const [joinBattleId, setJoinBattleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelection = async (mode: 'singlePlayer_category' | 'twoPlayer_lobby' | 'twoPlayer_join', battleId?: string) => {
    await initializeAudio();
    playGeneralClickSound();
    if (mode === 'twoPlayer_join' && !joinBattleId.trim()) {
      showMessage("Input Needed", "Please enter a Battle ID to join.", "error");
      return;
    }
    setIsLoading(true);
    await onModeSelected(mode, battleId || (mode === 'twoPlayer_join' ? joinBattleId.trim() : undefined));
    setIsLoading(false);
  };
  
  const handleBack = async () => {
    await initializeAudio();
    playGeneralClickSound();
    onBackToNameSetup();
  };

  return (
    <Card className="w-full max-w-md text-center bg-panel">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Hello, {playerProfile?.displayName || 'Player'}!</CardTitle>
        <CardDescription>How do you want to play?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          id="single-player-btn"
          onClick={() => handleSelection('singlePlayer_category')}
          className="w-full mode-btn bg-accent-success hover:bg-accent-success/90 btn-success-text"
          disabled={isLoading}
        >
          Play Single Player
        </Button>
        <Separator />
        <Button
          id="create-battle-btn"
          onClick={() => handleSelection('twoPlayer_lobby')}
          className="w-full mode-btn bg-primary hover:bg-primary/90 btn-primary-text"
          disabled={isLoading}
        >
          Create Two Player Battle
        </Button>
        <Input
          type="text"
          id="join-battle-id-input"
          placeholder="Enter Battle ID to Join"
          value={joinBattleId}
          onChange={(e) => setJoinBattleId(e.target.value)}
          className="w-full p-3"
          disabled={isLoading}
        />
        <Button
          id="join-battle-btn"
          onClick={() => handleSelection('twoPlayer_join')}
          className="w-full mode-btn bg-accent-success hover:bg-accent-success/90 btn-success-text"
          disabled={isLoading || !joinBattleId.trim()}
        >
          Join Battle
        </Button>
      </CardContent>
      <CardFooter>
        <Button
          id="back-to-name-setup-btn"
          variant="link"
          onClick={handleBack}
          className="text-xs text-muted-foreground hover:text-primary"
          disabled={isLoading}
        >
          Change Name
        </Button>
      </CardFooter>
    </Card>
  );
}
