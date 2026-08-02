const ZoeTTS = (() => {
  let onStartCb = null;
  let onEndCb = null;
  let onErrorCb = null;
  let currentAudio = null;
  let currentUtterance = null;
  let cancelWebSpeechSafety = null;

  async function zoeTTS(text) {
    const voiceId = API_CONFIG.ELEVENLABS_VOICE_ID;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY,
          accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.6,
            use_speaker_boost: true,
            speed: 1.05,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`);
      const blob = await res.blob();
      return { type: 'elevenlabs', blob };
    } catch (err) {
      console.error('SpeakEasy: ElevenLabs TTS failed, falling back to Web Speech', err);
      return { type: 'webspeech', text };
    } finally {
      clearTimeout(timeout);
    }
  }

  function playAudio(audioRef) {
    if (!audioRef) return;
    if (audioRef.type === 'elevenlabs') {
      playBlob(audioRef.blob);
    } else {
      playWebSpeech(audioRef.text);
    }
  }

  function playBlob(blob) {
    const url = URL.createObjectURL(blob);
    currentAudio = new Audio(url);

    currentAudio.addEventListener('playing', () => { if (onStartCb) onStartCb(); }, { once: true });
    currentAudio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      if (onEndCb) onEndCb();
    });
    currentAudio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      if (onErrorCb) onErrorCb({ type: 'playback', message: 'Errore nella riproduzione audio.' });
      if (onEndCb) onEndCb();
    });

    currentAudio.play().catch(() => {
      if (onErrorCb) onErrorCb({ type: 'playback', message: 'Impossibile riprodurre l\'audio.' });
      if (onEndCb) onEndCb();
    });
  }

  function playWebSpeech(text) {
    if (!('speechSynthesis' in window)) {
      if (onErrorCb) onErrorCb({ type: 'unsupported', message: 'Sintesi vocale non disponibile su questo browser.' });
      if (onEndCb) onEndCb();
      return;
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'en-GB';
    currentUtterance.pitch = 1.15;
    currentUtterance.rate = 1.0;

    const voices = speechSynthesis.getVoices();
    const britishVoice = voices.find((v) => v.lang === 'en-GB' && /female|woman/i.test(v.name))
      || voices.find((v) => v.lang === 'en-GB');
    if (britishVoice) currentUtterance.voice = britishVoice;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      cancelWebSpeechSafety = null;
      if (onEndCb) onEndCb();
    };

    currentUtterance.onstart = () => { if (onStartCb) onStartCb(); };
    currentUtterance.onend = finish;
    currentUtterance.onerror = () => {
      if (onErrorCb) onErrorCb({ type: 'playback', message: 'Errore nella sintesi vocale.' });
      finish();
    };

    // Chrome a volte non emette mai 'onend' per SpeechSynthesisUtterance (bug noto):
    // senza questo timeout la chiamata resterebbe bloccata per sempre in stato "speaking".
    const words = text.split(' ').length;
    const safetyTimer = setTimeout(finish, Math.min(10000, Math.max(1800, words * 380)));
    cancelWebSpeechSafety = () => { settled = true; clearTimeout(safetyTimer); cancelWebSpeechSafety = null; };

    speechSynthesis.speak(currentUtterance);
  }

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    if (cancelWebSpeechSafety) cancelWebSpeechSafety();
    currentUtterance = null;
  }

  function onStart(cb) { onStartCb = cb; }
  function onEnd(cb) { onEndCb = cb; }
  function onError(cb) { onErrorCb = cb; }

  async function testConnection() {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/voices/${API_CONFIG.ELEVENLABS_VOICE_ID}`, {
        headers: { 'xi-api-key': API_CONFIG.ELEVENLABS_API_KEY },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  return { zoeTTS, playAudio, stopAudio, onStart, onEnd, onError, testConnection };
})();
