'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useFirebase } from '@/contexts/FirebaseContext';
import { useSounds } from '@/contexts/SoundContext';

interface InitialSetupProps {
  onNameSaved: () => void;
  showMessage: (title: string, text: string, type?: 'info' | 'success' | 'error', onClose?: () => void) => void;
}

export default function InitialSetup({ onNameSaved, showMessage }: InitialSetupProps) {
  const { playerProfile, savePlayerName, loadingAuth, userIdDisplay } = useFirebase();
  const { initializeAudio, playGeneralClickSound } = useSounds();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (playerProfile && playerProfile.displayName !== "Player") { // Only set if not default "Player"
      setName(playerProfile.displayName);
    } else if (playerProfile && playerProfile.displayName === "Player") {
      setName(''); // Clear if it's the default "Player"
    }
  }, [playerProfile]);

  const handleSave = async () => {
    await initializeAudio(); // Ensure audio is ready for click sound
    playGeneralClickSound();
    if (!name.trim()) {
      showMessage("Input Needed", "Please enter your name.", "error");
      return;
    }
    setIsSaving(true);
    try {
      await savePlayerName(name.trim());
      onNameSaved();
    } catch (e) {
      showMessage("Error", "Could not save your name. Please try again.", "error");
    }
    setIsSaving(false);
  };

  return (
    <Card className="w-full max-w-md bg-panel">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-foreground text-center">Hangin’ with Jisook</CardTitle>
        <CardDescription className="text-center">
          Your User ID: <span className="font-mono text-xs">{userIdDisplay}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingAuth ? (
          <div className="flex flex-col justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 mt-2">Loading authentication...</p>
          </div>
        ) : (
          <Input
            type="text"
            id="player-name-input"
            placeholder="Enter Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 mb-4"
            disabled={isSaving}
          />
        )}
      </CardContent>
      <CardFooter>
        <Button
          id="save-player-name-btn"
          onClick={handleSave}
          className="w-full action-btn bg-primary hover:bg-primary/90 btn-primary-text"
          disabled={loadingAuth || isSaving || !name.trim()}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? 'Saving...' : 'Save Name & Continue'}
        </Button>
      </CardFooter>
    </Card>
  );
}
