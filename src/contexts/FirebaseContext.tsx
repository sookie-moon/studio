
'use client';
import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { APP_ID, CUSTOM_AUTH_TOKEN, FIREBASE_CONFIG } from '@/config/appConfig'; // Added FIREBASE_CONFIG
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
    // Early check for placeholder Firebase API key
    if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
      const errorMessage =
        "Firebase API Key is a placeholder or missing. " +
        "Please set up your NEXT_PUBLIC_FIREBASE_CONFIG environment variable with your Firebase project's JSON configuration. " +
        "You can find this in your Firebase project settings (Project settings > General > Your apps > SDK setup and configuration). " +
        "The app will not function correctly until this is resolved.";
      console.error(errorMessage);
      setUserIdDisplay("Firebase not configured. Check console.");
      setPlayerProfile(null);
      setUser(null);
      setLoadingAuth(false);
      return; // Prevent further Firebase operations
    }

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
        } catch (error: any) {
          console.error("Firebase sign-in error:", error);
          // Differentiate API key error from other sign-in errors
          if (error.code === 'auth/invalid-api-key' || (error.message && error.message.includes('api-key-not-valid'))) {
             setUserIdDisplay("Firebase API Key invalid. Check config.");
          } else {
             setUserIdDisplay(`Sign-in failed: ${error.code || 'Unknown error'}`);
          }
          setPlayerProfile(null);
          setUser(null);
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [loadPlayerProfile]);

  const savePlayerName = async (name: string) => {
    if (!user) return;
    // Ensure db is available before trying to use it, in case of initialization issues
    if (!db) {
      console.error("Firestore DB instance is not available. Player name not saved.");
      throw new Error("Firestore DB instance is not available.");
    }
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
