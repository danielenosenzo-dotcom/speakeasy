# SpeakEasy 🎤

App educativa di inglese con un tutor AI, Zoe: una ragazza inglese di 15 anni. Quattro sezioni:

- **Speaking** — chiamata libera di 5 minuti con Zoe, valuta il livello in modo naturale e dà correzioni grammaticali solo alla fine
- **Conversazione Guidata** — scegli uno scenario (ristorante, aeroporto, dal dottore, fare amicizia), consulti un pannello di frasi utili, poi fai pratica vocale con Zoe nel contesto scelto
- **Regole Grammaticali** — scegli un argomento sui Verb Patterns, Claude genera una lezione con esempi ed errori comuni
- **Esercizi Pratici** — Claude genera un quiz di 5 esercizi (multiple choice + fill-in-blank), correzione istantanea locale

## Stack

- HTML + CSS + JavaScript vanilla (no framework)
- **ElevenLabs** per la voce di Zoe (fallback automatico a Web Speech API del browser se non configurato/fallisce)
- **Web Speech API** per il riconoscimento vocale
- **Claude API** per conversazione, lezioni di grammatica ed esercizi
- **Firebase Firestore** per sincronizzare progressi tra dispositivi (fallback a `localStorage` se non configurato)

## Struttura

```
speakeasy/
├── index.html            Home — menu a 4 sezioni + progressi
├── call.html              Speaking — chiamata libera
├── guidata.html            Conversazione Guidata — scenari a tema
├── grammatica.html         Regole Grammaticali
├── esercizi.html           Esercizi Pratici
├── feedback.html           Schermata feedback (condivisa da Speaking e Guidata)
├── test.html                Pannello di test per ogni componente
├── css/
│   ├── main.css             Stili globali, dark theme, variabili
│   ├── avatar.css           Stili avatar e animazioni
│   └── call.css             Stili schermata chiamata (riusato da Guidata)
├── js/
│   ├── zoe-avatar.js        SVG avatar + animazioni
│   ├── voice-input.js       Microfono + Speech Recognition
│   ├── elevenlabs.js        TTS con ElevenLabs API + fallback
│   ├── conversation.js      Conversazione libera (Speaking) con Claude
│   ├── guided-conversation.js  Conversazione a scenario (Guidata) con Claude
│   ├── ai-content.js        Chiamate Claude generiche (Grammatica, Esercizi)
│   ├── session.js           Timer/stato chiamata
│   └── storage.js           Firestore + fallback localStorage per progressi
├── assets/icon.svg
├── manifest.json / sw.js    PWA
├── api-config.js            Chiavi ElevenLabs + Anthropic
└── firebase-config.js       Config Firebase (sync multi-dispositivo)
```

## Setup

**1. Chiavi AI** — apri `api-config.js`:
- `ANTHROPIC_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID` (scegli una voce da [elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library) cercando "young british female" o "teenage girl")

**Nota sicurezza**: chiavi segrete a tutti gli effetti — chiunque ispezioni il sito con F12 può copiarle. Imposta uno spending/usage limit su entrambi i dashboard e non condividere il link dell'app pubblicamente.

**2. Firebase (sync multi-dispositivo)** — apri `firebase-config.js`, segui le istruzioni nel commento in cima al file per creare un progetto Firebase dedicato (separato da quello del ristorante). Senza configurarlo, l'app funziona comunque ma i progressi restano solo sul dispositivo (localStorage).

## Sviluppo

Aprire i file HTML direttamente nel browser (Chrome consigliato, anche su Android) o servirli con un semplice server locale.
