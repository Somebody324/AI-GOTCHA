
import { initializeApp, getApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

// Check for the critical databaseURL and other essential configs
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    `\n[Firebase Setup Warning] Essential Firebase configuration (apiKey, projectId) is missing in your .env file.` +
    `\nPlease ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.` +
    `\nFirebase will not be initialized.\n`
  );
} else if (!firebaseConfig.databaseURL || 
             !(firebaseConfig.databaseURL.startsWith('https://') && 
               (firebaseConfig.databaseURL.includes('.firebaseio.com') || firebaseConfig.databaseURL.includes('.firebasedatabase.app')))
            ) {
  console.warn(
    `\n[Firebase Setup Warning] NEXT_PUBLIC_FIREBASE_DATABASE_URL is missing or malformed in your .env file.` +
    `\nPlease ensure it is set and in a valid Firebase Realtime Database URL format (e.g., https://<your-project-id>.firebaseio.com or https://<your-project-id>-default-rtdb.your-region.firebasedatabase.app).` +
    `\nCurrent value: "${firebaseConfig.databaseURL}"` +
    `\nFirebase Database features will not work.\n`
  );
  // Initialize app for other services if needed, but db will remain null
  try {
    app = getApp();
  } catch (e) {
    app = initializeApp(firebaseConfig);
  }
} else {
  // All essential configs seem present enough to attempt initialization
  try {
    try {
      app = getApp();
    } catch (e) {
      app = initializeApp(firebaseConfig);
    }
    db = getDatabase(app);
  } catch (error) {
    console.error("\n[Firebase Initialization Error] Failed to initialize Firebase. Please check your configuration and the error below:");
    console.error(error);
    console.error("Firebase features will likely not work.\n");
    // app might be partially initialized or null, db will be null
  }
}

export { app, db }; // db can be null, app can be null if critical config missing
