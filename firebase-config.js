// ═══════════════════════════════════════════════════════
// CONFIGURAZIONE FIREBASE - SpeakEasy
// ═══════════════════════════════════════════════════════
// Serve un progetto Firebase DEDICATO a SpeakEasy — separato da
// "lancora-haccp" (quello è per il ristorante, questo è per l'app
// personale di tua figlia).
//
// 1. Vai su https://console.firebase.google.com
// 2. Crea un nuovo progetto (es. "speakeasy-app")
// 3. Aggiungi un'app Web (icona </> nella homepage del progetto)
// 4. Copia le credenziali qui sotto
// 5. Vai su Firestore Database → Crea database → Modalità produzione
// 6. Vai su Regole Firestore e incolla:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /speakeasy/{document=**} {
//          allow read, write: if true;
//        }
//      }
//    }
//
// Nota: come per l'app HACCP, la chiave qui sotto è pensata per stare
// pubblica — la protezione dei dati sta nelle regole Firestore sopra,
// non nella segretezza della chiave.
// ═══════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDvMnbLK6SiD_h3wHmPM2RL5SbbJT-F7JE",
  authDomain: "speakeasy-app-e5ab4.firebaseapp.com",
  projectId: "speakeasy-app-e5ab4",
  storageBucket: "speakeasy-app-e5ab4.firebasestorage.app",
  messagingSenderId: "301593553235",
  appId: "1:301593553235:web:081da1eaa38431535799a6"
};
