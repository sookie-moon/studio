'use client';
import type React from 'react';
import { createContext, useContext } from 'react';
import useGameSounds, { type GameSounds } from '@/hooks/useGameSounds';

const SoundContext = createContext<GameSounds | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const gameSounds = useGameSounds();
  return <SoundContext.Provider value={gameSounds}>{children}</SoundContext.Provider>;
};

export const useSounds = (): GameSounds => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSounds must be used within a SoundProvider');
  }
  return context;
};
