import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
};

export const app = initializeApp(firebaseConfig);

// Initialize Firestore with local persistence caching, useful for React apps
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export const auth = getAuth(app);

// Ensure user is authenticated anonymously to satisfy Firestore security rules
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export function ensureFirebaseAuth(): Promise<void> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve();
      } else {
        signInAnonymously(auth)
          .then(() => resolve())
          .catch((err) => {
            console.warn('Anonymous auth note (proceeding without crash):', err);
            resolve();
          });
      }
    });
  });
}

