import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '@/config/appConfig';

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  firebaseApp = initializeApp(FIREBASE_CONFIG);
} else {
  firebaseApp = getApps()[0];
}

auth = getAuth(firebaseApp);
db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
