import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB-psPSH45hCnwRMbj6rSzxOf8_ITRXqhU",
  authDomain: "quiroapp-e9b0a.firebaseapp.com",
  projectId: "quiroapp-e9b0a",
  storageBucket: "quiroapp-e9b0a.firebasestorage.app",
  messagingSenderId: "478863836341",
  appId: "1:478863836341:web:fa72196635120ba1beaafc",
  measurementId: "G-YVG4XXKENW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'es';
let db;
try {
  // Persistencia offline REAL: la base se guarda en el dispositivo (IndexedDB)
  // y sincroniza sola al volver el internet.
  db = initializeFirestore(app, { experimentalForceLongPolling: true, localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  // Si el navegador no permite almacenamiento local, se sigue sin persistencia.
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
}
const appId = firebaseConfig.projectId;
const TRIAL_DAYS = 3;
const MAX_TRIAL_PATIENTS = 3;

export { auth, db, appId, TRIAL_DAYS, MAX_TRIAL_PATIENTS };
