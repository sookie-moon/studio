export const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'default-hangman-app';

// Firebase configuration placeholder - replace with your actual config
// It's highly recommended to use environment variables for this
const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

let firebaseConfigFromEnv = {};
if (firebaseConfigString) {
  try {
    firebaseConfigFromEnv = JSON.parse(firebaseConfigString);
  } catch (e) {
    console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG:", e);
    // Provide default/empty config or throw error if critical
    firebaseConfigFromEnv = {
      apiKey: "YOUR_API_KEY", // Placeholder
      authDomain: "YOUR_AUTH_DOMAIN", // Placeholder
      projectId: "YOUR_PROJECT_ID", // Placeholder
      storageBucket: "YOUR_STORAGE_BUCKET", // Placeholder
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Placeholder
      appId: "YOUR_APP_ID", // Placeholder
    };
  }
} else {
  console.warn("NEXT_PUBLIC_FIREBASE_CONFIG is not set. Using placeholder Firebase config.");
  // Provide default/empty config or throw error if critical
    firebaseConfigFromEnv = {
      apiKey: "YOUR_API_KEY", // Placeholder
      authDomain: "YOUR_AUTH_DOMAIN", // Placeholder
      projectId: "YOUR_PROJECT_ID", // Placeholder
      storageBucket: "YOUR_STORAGE_BUCKET", // Placeholder
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Placeholder
      appId: "YOUR_APP_ID", // Placeholder
    };
}

export const FIREBASE_CONFIG = firebaseConfigFromEnv;
export const CUSTOM_AUTH_TOKEN = process.env.NEXT_PUBLIC_INITIAL_AUTH_TOKEN || null;

// Game specific configurations
export const WORD_CATEGORIES: Record<string, string[]> = { 
    "Movie Titles": ["inception", "titanic", "avatar", "joker", "parasite", "interstellar", "gladiator", "casablanca", "psycho", "alien", "the matrix", "pulp fiction", "fight club", "forrest gump", "the godfather", "star wars", "jurassic park", "the lion king", "finding nemo", "toy story", "spirited away", "the dark knight", "schindlers list", "lord of the rings", "the silence of the lambs"],
    "Actor Names": ["tom hanks", "scarlett johansson", "leonardo dicaprio", "margot robbie", "denzel washington", "meryl streep", "brad pitt", "angelina jolie", "morgan freeman", "julia roberts"],
    "Music Titles": ["bohemian rhapsody", "stairway to heaven", "hotel california", "imagine", "like a rolling stone", "hey jude", "smells like teen spirit", "billie jean", "wonderwall", "yesterday"],
    "Musician Names": ["freddie mercury", "elvis presley", "michael jackson", "madonna", "bob dylan", "john lennon", "kurt cobain", "beyonce", "adele", "taylor swift"]
};
export const ROUND_LENGTH = 20;
export const MAX_INCORRECT_GUESSES_PER_WORD = 6;
