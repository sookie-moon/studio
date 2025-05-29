'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useSounds } from '@/contexts/SoundContext';

interface BattleLobbyProps {
  battleId: string;
  onCancelBattle: () => void;
}

export default function BattleLobby({ battleId, onCancelBattle }: BattleLobbyProps) {
  const { playGeneralClickSound } = useSounds();

  const handleCancel = () => {
    playGeneralClickSound();
    onCancelBattle();
  };

  return (
    <Card className="w-full max-w-md text-center bg-panel">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Battle Created!</CardTitle>
        <CardDescription>Share this Battle ID with your friend:</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p id="battle-id-text" className="text-2xl font-mono bg-secondary p-3 rounded-md break-all">
          {battleId}
        </p>
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <p>Waiting for Player 2 to join...</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          id="cancel-battle-creation-btn"
          onClick={handleCancel}
          className="w-full action-btn bg-accent-error hover:bg-accent-error/90 btn-error-text"
        >
          Cancel Battle
        </Button>
      </CardFooter>
    </Card>
  );
}
