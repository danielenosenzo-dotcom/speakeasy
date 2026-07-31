const SpeakEasyStorage = (() => {
  const COLLECTION = 'speakeasy';
  const LOCAL_KEY_PREFIX = 'speakeasy_';

  let firestoreDb = null;
  let firebaseReady = false;
  const DB = {}; // cache locale sincrona — le letture pubbliche leggono sempre da qui
  const updateCbs = [];

  function _isFirebaseConfigured() {
    return typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== '...';
  }

  function _loadLocal(key) {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY_PREFIX + key)) || [];
    } catch {
      return [];
    }
  }

  function _saveLocal(key, value) {
    try {
      localStorage.setItem(LOCAL_KEY_PREFIX + key, JSON.stringify(value));
    } catch {}
  }

  function _notifyUpdate(key) {
    updateCbs.forEach((cb) => { try { cb(key); } catch {} });
  }

  // Legge dalla cache locale (sincrono, come ls() in HACCP)
  function _read(key) {
    if (!(key in DB)) DB[key] = _loadLocal(key);
    return DB[key];
  }

  // Aggiorna cache + localStorage + Firestore (come lss() in HACCP)
  function _write(key, value) {
    DB[key] = value;
    _saveLocal(key, value);
    if (firestoreDb) {
      firestoreDb.collection(COLLECTION).doc(key).set({ data: value }).catch((e) => {
        console.error('SpeakEasy: Firestore write error [' + key + ']', e);
      });
    }
    _notifyUpdate(key);
  }

  const KEYS = ['sessions', 'grammatica_progress', 'esercizi_risultati', 'guidata_sessioni'];

  function init() {
    KEYS.forEach((k) => { DB[k] = _loadLocal(k); });

    if (!_isFirebaseConfigured() || typeof firebase === 'undefined') return;

    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      firestoreDb = firebase.firestore();
      firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(() => {});

      KEYS.forEach((key) => {
        firestoreDb.collection(COLLECTION).doc(key).onSnapshot((snap) => {
          DB[key] = snap.exists ? (snap.data().data || []) : [];
          _saveLocal(key, DB[key]);
          firebaseReady = true;
          _notifyUpdate(key);
        }, (err) => {
          console.error('SpeakEasy: Firestore sync error [' + key + ']', err);
        });
      });
    } catch (e) {
      console.error('SpeakEasy: Firebase init failed, uso solo localStorage', e);
      firestoreDb = null;
    }
  }

  function onUpdate(cb) {
    updateCbs.push(cb);
  }

  function isSynced() {
    return firebaseReady;
  }

  // --- Sessioni Speaking (chiamate con Zoe) ---
  function getSessions() {
    return _read('sessions');
  }

  function getSessionCount() {
    return getSessions().length;
  }

  function saveSession(sessionData) {
    const sessions = getSessions();
    sessions.push({ ...sessionData, date: new Date().toISOString() });
    _write('sessions', sessions);
    return sessions.length;
  }

  // --- Progressi Regole Grammaticali ---
  function getGrammaticaProgress() {
    return _read('grammatica_progress');
  }

  function saveGrammaticaLezione(record) {
    const list = getGrammaticaProgress();
    list.push({ ...record, date: new Date().toISOString() });
    _write('grammatica_progress', list);
  }

  // --- Risultati Esercizi Pratici ---
  function getEserciziRisultati() {
    return _read('esercizi_risultati');
  }

  function saveEserciziRisultato(record) {
    const list = getEserciziRisultati();
    list.push({ ...record, date: new Date().toISOString() });
    _write('esercizi_risultati', list);
  }

  // --- Sessioni Conversazione Guidata ---
  function getGuidataSessioni() {
    return _read('guidata_sessioni');
  }

  function saveGuidataSessione(record) {
    const list = getGuidataSessioni();
    list.push({ ...record, date: new Date().toISOString() });
    _write('guidata_sessioni', list);
  }

  init();

  return {
    onUpdate,
    isSynced,
    getSessions, getSessionCount, saveSession,
    getGrammaticaProgress, saveGrammaticaLezione,
    getEserciziRisultati, saveEserciziRisultato,
    getGuidataSessioni, saveGuidataSessione,
  };
})();
