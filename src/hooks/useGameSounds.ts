'use client'; // This hook is client-side only
import { useCallback, useEffect, useState, useRef } from 'react';
import * as Tone from 'tone';

export interface GameSounds {
  playGeneralClickSound: () => void;
  playCorrectLetterSound: () => void;
  playIncorrectLetterSound: () => void;
  playWordSolvedSound: () => void;
  playWordFailedSound: () => void;
  initializeAudio: () => Promise<void>;
  isSoundInitialized: boolean;
}

const useGameSounds = (): GameSounds => {
  const [isSoundInitialized, setIsSoundInitialized] = useState(false);
  
  const generalClickSynthRef = useRef<Tone.MembraneSynth | null>(null);
  const correctLetterSynthRef = useRef<Tone.PluckSynth | null>(null);
  const incorrectLetterSynthRef = useRef<Tone.Synth | null>(null);
  const wordSolvedSynthRef = useRef<Tone.PolySynth<Tone.Synth<Tone.SynthOptions>> | null>(null);
  const wordFailedSynthRef = useRef<Tone.Synth | null>(null);


  const initializeAudio = useCallback(async () => {
    if (!isSoundInitialized && typeof window !== 'undefined' && Tone.context.state !== 'running') {
      await Tone.start();
      
      generalClickSynthRef.current = new Tone.MembraneSynth({
        pitchDecay: 0.008, octaves: 2, oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.01 }
      }).toDestination();
      generalClickSynthRef.current.volume.value = -20;

      correctLetterSynthRef.current = new Tone.PluckSynth({
        attackNoise: 0.5, dampening: 2000, resonance: 0.9
      }).toDestination();
      correctLetterSynthRef.current.volume.value = -10;

      incorrectLetterSynthRef.current = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
      }).toDestination();
      incorrectLetterSynthRef.current.volume.value = -10;
      
      wordSolvedSynthRef.current = new Tone.PolySynth(Tone.Synth, {
         options: {
            oscillator: { type: "triangle8" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 }
         }
      }).toDestination();
      wordSolvedSynthRef.current.volume.value = -8;

      wordFailedSynthRef.current = new Tone.Synth({
        oscillator: { type: "pwm", modulationFrequency: 0.2 },
        envelope: { attack: 0.05, decay: 0.5, sustain: 0.1, release: 0.8 }
      }).toDestination();
      wordFailedSynthRef.current.volume.value = -5;

      setIsSoundInitialized(true);
      console.log("Audio context started and synths initialized.");
    } else if (Tone.context.state === 'running' && !isSoundInitialized) {
      // Context is running, but we haven't marked as initialized (e.g. SSR then client nav)
      // Re-run initialization logic if synths are not set up
       if (!generalClickSynthRef.current) { // Check one synth as a proxy
        // This block is largely same as above, could be refactored
        generalClickSynthRef.current = new Tone.MembraneSynth({ pitchDecay: 0.008, octaves: 2, oscillator: { type: "square" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.01 } }).toDestination();
        generalClickSynthRef.current.volume.value = -20;
        correctLetterSynthRef.current = new Tone.PluckSynth({ attackNoise: 0.5, dampening: 2000, resonance: 0.9 }).toDestination();
        correctLetterSynthRef.current.volume.value = -10;
        incorrectLetterSynthRef.current = new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 } }).toDestination();
        incorrectLetterSynthRef.current.volume.value = -10;
        wordSolvedSynthRef.current = new Tone.PolySynth(Tone.Synth, { options: { oscillator: { type: "triangle8" }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 } } }).toDestination();
        wordSolvedSynthRef.current.volume.value = -8;
        wordFailedSynthRef.current = new Tone.Synth({ oscillator: { type: "pwm", modulationFrequency: 0.2 }, envelope: { attack: 0.05, decay: 0.5, sustain: 0.1, release: 0.8 } }).toDestination();
        wordFailedSynthRef.current.volume.value = -5;
       }
      setIsSoundInitialized(true);
      console.log("Audio context already running, ensured synths initialized.");
    }
  }, [isSoundInitialized]);


  const playGeneralClickSound = useCallback(() => {
    if (!isSoundInitialized || !generalClickSynthRef.current) return;
    generalClickSynthRef.current.triggerAttackRelease("C2", "32n", Tone.now());
  }, [isSoundInitialized]);

  const playCorrectLetterSound = useCallback(() => {
    if (!isSoundInitialized || !correctLetterSynthRef.current) return;
    correctLetterSynthRef.current.triggerAttackRelease("G5", "16n", Tone.now());
  }, [isSoundInitialized]);

  const playIncorrectLetterSound = useCallback(() => {
    if (!isSoundInitialized || !incorrectLetterSynthRef.current) return;
    incorrectLetterSynthRef.current.triggerAttackRelease("C2", "8n", Tone.now());
  }, [isSoundInitialized]);

  const playWordSolvedSound = useCallback(() => {
    if (!isSoundInitialized || !wordSolvedSynthRef.current) return;
    const now = Tone.now();
    wordSolvedSynthRef.current.triggerAttackRelease(["C4", "E4", "G4", "C5"], "8n", now);
    wordSolvedSynthRef.current.triggerAttackRelease(["D4", "F#4", "A4", "D5"], "8n", now + 0.3);
  }, [isSoundInitialized]);

  const playWordFailedSound = useCallback(() => {
    if (!isSoundInitialized || !wordFailedSynthRef.current) return;
    wordFailedSynthRef.current.triggerAttackRelease("F#2", "2n", Tone.now());
  }, [isSoundInitialized]);
  
  useEffect(() => {
    return () => {
      // Optional: Dispose synths on unmount if they are not meant to be global singleton-like
      // generalClickSynthRef.current?.dispose();
      // correctLetterSynthRef.current?.dispose();
      // etc.
      // For this app, keeping them alive might be fine.
    };
  }, []);


  return {
    initializeAudio,
    isSoundInitialized,
    playGeneralClickSound,
    playCorrectLetterSound,
    playIncorrectLetterSound,
    playWordSolvedSound,
    playWordFailedSound,
  };
};

export default useGameSounds;
