const VoiceInput = (() => {
  const SILENCE_MS = 2500;
  const CONFIDENCE_THRESHOLD = 0.3;

  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognitionImpl;

  let recognition = null;
  let transcriptCb = null;
  let silenceCb = null;
  let errorCb = null;
  let silenceTimer = null;
  let finalTranscript = '';
  let listening = false;
  let stoppedByUser = false;
  let permissionStatus = 'prompt';

  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'microphone' }).then((status) => {
      permissionStatus = status.state;
      status.onchange = () => { permissionStatus = status.state; };
    }).catch(() => {});
  }

  function isSupported() {
    return supported;
  }

  function resetSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (!listening) return;
      stoppedByUser = false;
      try { recognition.stop(); } catch {}
    }, SILENCE_MS);
  }

  function buildRecognition() {
    const r = new SpeechRecognitionImpl();
    r.lang = 'en-US';
    r.continuous = true;
    r.interimResults = true;

    r.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const confidence = result[0].confidence;

        if (confidence && confidence > 0 && confidence < CONFIDENCE_THRESHOLD) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript += text + ' ';
        } else {
          interim += text;
        }
      }
      if (transcriptCb) transcriptCb((finalTranscript + interim).trim());
      resetSilenceTimer();
    };

    r.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        permissionStatus = 'denied';
        if (errorCb) errorCb({
          type: 'permission-denied',
          message: 'Microfono negato. Vai nelle impostazioni del browser e consenti l\'accesso al microfono per parlare con Zoe.',
        });
        listening = false;
        return;
      }
      if (event.error === 'no-speech') {
        return;
      }
      if (errorCb) errorCb({
        type: event.error,
        message: 'Problema con il microfono. Riprova.',
      });
    };

    r.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      listening = false;
      if (!stoppedByUser) {
        permissionStatus = 'granted';
        const text = finalTranscript.trim();
        if (silenceCb) silenceCb(text);
      }
    };

    return r;
  }

  function startListening() {
    if (!supported) {
      if (errorCb) errorCb({
        type: 'unsupported',
        message: 'Il tuo browser non supporta il riconoscimento vocale. Usa Chrome per parlare con Zoe.',
      });
      return;
    }

    finalTranscript = '';
    stoppedByUser = false;
    recognition = buildRecognition();

    try {
      recognition.start();
      listening = true;
      resetSilenceTimer();
    } catch (err) {
      if (errorCb) errorCb({ type: 'start-failed', message: 'Impossibile avviare il microfono. Riprova.' });
    }
  }

  function stopListening() {
    stoppedByUser = true;
    if (silenceTimer) clearTimeout(silenceTimer);
    if (recognition && listening) {
      try { recognition.stop(); } catch {}
    }
    listening = false;
  }

  // Come stopListening(), ma NON marca stoppedByUser: onend continua a
  // consegnare la trascrizione finale, esattamente come farebbe il timer
  // di silenzio — serve per lasciare all'utente il controllo manuale di
  // "ho finito di parlare" invece di aspettare il timeout automatico.
  function finishListening() {
    if (!listening) return;
    if (silenceTimer) clearTimeout(silenceTimer);
    try { recognition.stop(); } catch {}
  }

  function onTranscript(cb) { transcriptCb = cb; }
  function onSilence(cb) { silenceCb = cb; }
  function onError(cb) { errorCb = cb; }
  function getPermissionStatus() { return permissionStatus; }
  function isListening() { return listening; }

  return { startListening, stopListening, finishListening, onTranscript, onSilence, onError, getPermissionStatus, isSupported, isListening };
})();
