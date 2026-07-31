const AIContent = (() => {
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = (window.API_CONFIG && API_CONFIG.ANTHROPIC_MODEL) || 'claude-sonnet-5';

  async function ask(userPrompt, systemPrompt, maxTokens = 1000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let res;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': API_CONFIG.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Claude non ha risposto in tempo. Riprova.');
      throw new Error('Errore di rete — controlla la connessione internet.');
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      if (res.status === 401) throw new Error('Chiave Anthropic non valida — controlla api-config.js.');
      throw new Error(`Errore API Claude (${res.status}).`);
    }

    const data = await res.json();
    return data.content && data.content[0] ? data.content[0].text : '';
  }

  async function askJSON(userPrompt, systemPrompt, maxTokens = 1200) {
    const raw = await ask(userPrompt, systemPrompt, maxTokens);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error('Risposta di Claude non valida — riprova.');
    }
  }

  return { ask, askJSON };
})();
