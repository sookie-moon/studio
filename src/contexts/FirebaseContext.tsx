'use client';
import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { APP_ID, CUSTOM_AUTH_TOKEN } from '@/config/appConfig';
import type { PlayerProfile } from '@/types';

interface FirebaseContextType {
  user: User | null;
  loadingAuth: boolean;
  playerProfile: PlayerProfile | null;
  savePlayerName: (name: string) => Promise<void>;
  userIdDisplay: string;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [userIdDisplay, setUserIdDisplay] = useState<string>("Signing in...");

  const loadPlayerProfile = useCallback(async (uid: string) => {
    try {
      const profileDocRef = doc(db, "artifacts", APP_ID, "users", uid, "hangmanProfiles", "profile");
      const docSnap = await getDoc(profileDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayerProfile({ uid, displayName: data.displayName || "Player" });
      } else {
        // If no profile exists, create a default one or set a default display name
        setPlayerProfile({ uid, displayName: "Player" });
      }
    } catch (error) {
      console.error("Error loading player profile:", error);
      setPlayerProfile({ uid, displayName: "Player" }); // Default profile on error
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingAuth(true);
      if (currentUser) {
        setUser(currentUser);
        setUserIdDisplay(currentUser.uid);
        await loadPlayerProfile(currentUser.uid);
      } else {
        setUser(null);
        setPlayerProfile(null);
        setUserIdDisplay("Signing in...");
        try {
          if (CUSTOM_AUTH_TOKEN) {
            await signInWithCustomToken(auth, CUSTOM_AUTH_TOKEN);
          } else {
            await signInAnonymously(auth);
          }
          // After sign-in, onAuthStateChanged will trigger again with the new user
        } catch (error) {
          console.error("Sign-in error:", error);
          setUserIdDisplay("Sign-in failed.");
          // Potentially show a global error message
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [loadPlayerProfile]);

  const savePlayerName = async (name: string) => {
    if (!user) return;
    try {
      const profileDocRef = doc(db, "artifacts", APP_ID, "users", user.uid, "hangmanProfiles", "profile");
      await setDoc(profileDocRef, { displayName: name, updatedAt: serverTimestamp() }, { merge: true });
      setPlayerProfile({ uid: user.uid, displayName: name });
    } catch (error) {
      console.error("Error saving player profile:", error);
      // Potentially show an error toast
      throw error; // Re-throw to be caught by caller
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loadingAuth, playerProfile, savePlayerName, userIdDisplay }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
