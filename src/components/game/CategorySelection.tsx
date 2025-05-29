'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WORD_CATEGORIES } from '@/config/appConfig';
import { useSounds } from '@/contexts/SoundContext';
import type { BattleData } from '@/types';
import { Loader2 } from 'lucide-react';

interface CategorySelectionProps {
  onCategorySelect: (category: string) => void;
  title: string;
  isMyTurnToSelect?: boolean; // For two-player mode
  battleData?: BattleData | null; // To display current P1 name
}

export default function CategorySelection({ onCategorySelect, title, isMyTurnToSelect = true, battleData }: CategorySelectionProps) {
  const { initializeAudio, playGeneralClickSound } = useSounds();
  
  const handleSelect = async (category: string) => {
    await initializeAudio();
    playGeneralClickSound();
    onCategorySelect(category);
  };

  return (
    <Card className="w-full max-w-lg bg-panel">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary text-center">{title}</CardTitle>
        {!isMyTurnToSelect && battleData && (
          <CardDescription className="text-center flex items-center justify-center pt-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Waiting for {battleData.player1DisplayName} to choose a category...
          </CardDescription>
        )}
      </CardHeader>
      {isMyTurnToSelect && (
        <CardContent id="category-buttons" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.keys(WORD_CATEGORIES).map((categoryName) => (
            <Button
              key={categoryName}
              onClick={() => handleSelect(categoryName)}
              className="category-btn bg-primary hover:bg-primary/90 btn-primary-text w-full"
            >
              {categoryName}
            </Button>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
