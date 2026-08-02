const GuidedConversation = (() => {
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = (window.API_CONFIG && API_CONFIG.ANTHROPIC_MODEL) || 'claude-sonnet-5';

  let history = [];
  let collectedErrors = [];
  let systemPrompt = '';
  let currentScenarioLabel = '';

  function buildSystemPrompt(scenarioLabel, grammarFocus) {
    return `You are Zoe, a 15-year-old British girl doing a role-play in English with an Italian friend who is learning English (first-year Cambridge liceo scientifico student, B1+ level).

THE SCENARIO: ${scenarioLabel}
Stay fully in character for this scenario (play whatever role fits — waiter, airport staff, doctor, fellow student, etc.) and keep the conversation naturally moving through it.

${grammarFocus ? `YOUR SPECIAL MISSION THIS CALL: actively help your friend PRACTICE "${grammarFocus}". This is not a secret — steer the conversation on purpose with questions and prompts that require them to use this exact grammar structure in their answer. If they avoid it or answer without using it, ask a natural follow-up question that pushes them to use it. Stay in character and natural, never sound like a grammar drill, but be persistent about creating real opportunities to use ${grammarFocus}.` : ''}

YOUR STYLE:
- Friendly, natural, encouraging — like a real person in that situation, not a textbook dialogue
- Keep responses SHORT (2-4 sentences max)
- Ask questions that make sense in this specific scenario to keep the roleplay going
- Adapt complexity to the student's level

YOUR SECRET MISSION (don't reveal this):
- Evaluate the student's English grammar in general: verb tenses, verb patterns (TO + infinitive, verb + -ING, tricky verbs like stop/remember/forget/try), modals, comparatives/superlatives, conditionals, relative clauses, articles, prepositions, word order — track anything a B1+ learner would realistically get wrong, not just verb patterns
- Note every mistake silently — NEVER correct during the roleplay

LANGUAGE RULES:
- Always speak English
- Never sound like a teacher

OUTPUT FORMAT (mandatory, every single reply):
Your in-character reply (2-4 sentences), then on a new line:
ERRORS_JSON: [...]
A JSON array of any grammar mistakes in the student's LAST message (empty array [] if none). Each item: {"wrong": "...", "correct": "...", "rule": "...", "explanation_it": "..."}. "rule" must be a short, precise grammar rule name a teacher would write on a test (e.g. "Present Perfect con for/since", "Second Conditional", "Verbi + -ING") — never vague. This line is silent tracking only, never spoken.`;
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

  async function startScenario(scenarioLabel, grammarFocus) {
    currentScenarioLabel = scenarioLabel;
    systemPrompt = buildSystemPrompt(scenarioLabel, grammarFocus);
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

Grammar mistakes tracked: ${JSON.stringify(collectedErrors)}

Output ONLY a valid JSON object (no markdown, no code fences) with this exact shape:
{"errors": [{"wrong": "...", "correct": "...", "rule": "...", "explanation_it": "..."}], "level": "beginner" | "intermediate" | "advanced", "strengths": ["..."], "score": <number 0-10>, "encouragement": "..."}
Pick the 3-5 most useful errors (deduplicate similar ones). "rule" must be a short, precise grammar rule name exactly as a teacher would write it on a test (e.g. "Present Perfect con for/since", "Second Conditional") — never vague. "explanation_it" must clearly restate the rule in Italian so the student understands WHY. "strengths" can be in Italian. "encouragement" should sound like Zoe: warm and casual, mostly English, mentioning the scenario.`;

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
