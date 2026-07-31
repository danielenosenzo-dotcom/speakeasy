const GuidedConversation = (() => {
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = (window.API_CONFIG && API_CONFIG.ANTHROPIC_MODEL) || 'claude-sonnet-5';

  let history = [];
  let collectedErrors = [];
  let systemPrompt = '';
  let currentScenarioLabel = '';

  function buildSystemPrompt(scenarioLabel) {
    return `You are Zoe, a 15-year-old British girl doing a role-play in English with an Italian friend who is learning English.

THE SCENARIO: ${scenarioLabel}
Stay fully in character for this scenario (play whatever role fits — waiter, airport staff, doctor, fellow student, etc.) and keep the conversation naturally moving through it.

YOUR STYLE:
- Friendly, natural, encouraging — like a real person in that situation, not a textbook dialogue
- Keep responses SHORT (2-4 sentences max)
- Ask questions that make sense in this specific scenario to keep the roleplay going
- Adapt complexity to the student's level

YOUR SECRET MISSION (don't reveal this):
- Note verb-pattern mistakes silently (TO + infinitive, verb + -ING, tricky verbs like stop/remember/forget/try) — NEVER correct during the roleplay

LANGUAGE RULES:
- Always speak English
- Never sound like a teacher

OUTPUT FORMAT (mandatory, every single reply):
Your in-character reply (2-4 sentences), then on a new line:
ERRORS_JSON: [...]
A JSON array of any verb-pattern mistakes in the student's LAST message (empty array [] if none). Each item: {"wrong": "...", "correct": "...", "rule": "...", "explanation_it": "..."}. This line is silent tracking only, never spoken.`;
  }

  function parseReply(raw) {
    const marker = 'ERRORS_JSON:';
    const idx = raw.indexOf(marker);
    if (idx === -1) return { spoken: raw.trim(), errors: [] };
    const spoken = raw.slice(0, idx).trim();
    let errors = [];
    try {
      errors = JSON.parse(raw.slice(idx + marker.length).trim());
    } catch {
      errors = [];
    }
    return { spoken, errors };
  }

  async function callClaude(messages, maxTokens = 300) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
          thinking: { type: 'disabled' },
          system: systemPrompt,
          messages,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Claude API timeout dopo 15s');
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      throw new Error(`Claude API error ${res.status}: ${await res.text().catch(() => '')}`);
    }
    const data = await res.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    return textBlock ? textBlock.text : '';
  }

  async function startScenario(scenarioLabel) {
    currentScenarioLabel = scenarioLabel;
    systemPrompt = buildSystemPrompt(scenarioLabel);
    history = [];
    collectedErrors = [];

    try {
      const raw = await callClaude([
        { role: 'user', content: '(The roleplay starts now. Open the scene naturally and in character.)' },
      ]);
      const { spoken, errors } = parseReply(raw);
      collectedErrors.push(...errors);
      history.push({ role: 'assistant', text: spoken });
      return spoken;
    } catch (err) {
      console.error('SpeakEasy: GuidedConversation.startScenario failed', err);
      const fallback = "Oh hi there! Sorry, one sec — bad connection! So, where were we?";
      history.push({ role: 'assistant', text: fallback });
      return fallback;
    }
  }

  async function sendMessage(userText) {
    history.push({ role: 'user', text: userText });
    const apiMessages = history.map((h) => ({ role: h.role, content: h.text }));

    try {
      const raw = await callClaude(apiMessages);
      const { spoken, errors } = parseReply(raw);
      collectedErrors.push(...errors);
      history.push({ role: 'assistant', text: spoken });
      return spoken;
    } catch (err) {
      console.error('SpeakEasy: GuidedConversation.sendMessage failed', err);
      const fallback = "Sorry, could you say that again? I didn't catch that.";
      history.push({ role: 'assistant', text: fallback });
      return fallback;
    }
  }

  async function generateFeedback() {
    const transcript = history.map((h) => `${h.role === 'assistant' ? 'Zoe' : 'Student'}: ${h.text}`).join('\n');
    const prompt = `Scenario: ${currentScenarioLabel}

Transcript of the roleplay:
${transcript}

Verb-pattern mistakes tracked: ${JSON.stringify(collectedErrors)}

Output ONLY a valid JSON object (no markdown, no code fences) with this exact shape:
{"errors": [{"wrong": "...", "correct": "...", "rule": "...", "explanation_it": "..."}], "level": "beginner" | "intermediate" | "advanced", "strengths": ["..."], "score": <number 0-10>, "encouragement": "..."}
Pick the 3-5 most useful errors (deduplicate). "strengths" can be in Italian. "encouragement" should sound like Zoe: warm and casual, mostly English, mentioning the scenario.`;

    try {
      const raw = await callClaude([{ role: 'user', content: prompt }], 1200);
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (err) {
      console.error('SpeakEasy: GuidedConversation.generateFeedback failed', err);
      return {
        errors: collectedErrors.slice(0, 5),
        level: 'intermediate',
        strengths: ['Hai portato avanti il gioco di ruolo fino alla fine'],
        score: 7,
        encouragement: "Great roleplay practice! We couldn't get full feedback this time, but keep going!",
      };
    }
  }

  function getConversationHistory() {
    return history;
  }

  return { startScenario, sendMessage, generateFeedback, getConversationHistory };
})();
