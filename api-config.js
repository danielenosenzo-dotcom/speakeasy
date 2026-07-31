// ═══════════════════════════════════════════════════════
// CONFIGURAZIONE API - SpeakEasy
// ═══════════════════════════════════════════════════════
// 1. ANTHROPIC_API_KEY: da https://console.anthropic.com/settings/keys
//    Imposta anche uno spending limit su console.anthropic.com (Settings → Limits)
// 2. ELEVENLABS_API_KEY: da https://elevenlabs.io/app/settings/api-keys
//    Imposta un usage limit su elevenlabs.io (Settings → Usage)
// 3. ELEVENLABS_VOICE_ID: scegli una voce da
//    https://elevenlabs.io/app/voice-library cercando "young british female"
//    o "teenage girl", poi copia il Voice ID qui
//
// ATTENZIONE: a differenza della chiave Firebase, queste chiavi sono
// segrete a tutti gli effetti. Non condividere il link dell'app
// pubblicamente e tieni sempre attivo un limite di spesa su entrambi
// i servizi.
// ═══════════════════════════════════════════════════════

const API_CONFIG = {
  ANTHROPIC_API_KEY: "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",
  ANTHROPIC_MODEL: "claude-sonnet-5",
  ELEVENLABS_API_KEY: "sk_a998688a0b8a426c1636012a3bd80122bbe069879d0fc34a",
  ELEVENLABS_VOICE_ID: "EST9Ui6982FZPSi7gCHi"
};
