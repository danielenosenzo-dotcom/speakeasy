const Conversation = (() => {
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = (window.API_CONFIG && API_CONFIG.ANTHROPIC_MODEL) || 'claude-sonnet-5';

  const SYSTEM_PROMPT = `You are Zoe, a 15-year-old British girl having a casual phone call with an Italian friend who is learning English.

YOUR PERSONALITY:
- Super energetic, funny, spontaneous — like a real teenage girl
- Use natural British teen slang: "oh my god", "literally", "so", "wait", "honestly", "no way"
- React emotionally: laugh, be surprised, be excited
- Talk about relatable topics: school, music, social media, food, friends, travel, Netflix
- Keep responses SHORT (2-4 sentences max) — it's a phone call, not an essay
- Ask follow-up questions to keep the conversation going

YOUR SECRET MISSION (don't reveal this):
- Evaluate the student's English grammar in general: verb tenses (present/past/future, simple/continuous/perfect), verb patterns (TO + infinitive, verb + ING, tricky verbs like stop/remember/forget/try), modals, comparatives/superlatives, conditionals, relative clauses, articles, prepositions, word order, subject-verb agreement — this is a first-year Cambridge liceo scientifico student, so track anything a 15-year-old B1+ English learner would realistically get wrong
- Note every mistake silently — NEVER correct during the call
- Adapt conversation complexity to their level: simpler topics if they struggle, more complex ones if they're doing well

LANGUAGE RULES:
- Always speak English during the call
- Never use formal or teacher-like language

OUTPUT FORMAT (mandatory, every single reply):
First, your spoken reply (2-4 sentences, natural teen English).
Then, on a new line, always append:
ERRORS_JSON: [...]
A JSON array of any grammar mistakes found in the student's LAST message (empty array [] if none). Each item: {"wrong": "...", "correct": "...", "rule": "...", "explanation_it": "..."}. "rule" must be a short, precise grammar rule name a teacher would write on a test (e.g. "Present Perfect con for/since", "Second Conditional", "Comparativo di maggioranza", "Verbi + -ING") — never vague labels like "grammar" or "verb tense". This line is silent tracking only — it is never spoken aloud.`;

  const history = [];
  let collectedErrors = [];

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
          system: SYSTEM_PROMPT,
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

  async function startConversation() {
    try {
      const raw = await callClaude([
        { role: 'user', content: '(The call just connected. Greet your friend warmly and start the conversation.)' },
      ]);
      const { spoken, errors } = parseReply(raw);
      collectedErrors.push(...errors);
      history.push({ role: 'assistant', text: spoken });
      return spoken;
    } catch (err) {
      console.error('SpeakEasy: startConversation failed', err);
      const fallback = "Oh my god hi!! Sorry, bad signal for a sec — how are you??";
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
      console.error('SpeakEasy: sendMessage failed', err);
      const fallback = "Wait sorry, my phone glitched for a sec — what did you say?";
      history.push({ role: 'assistant', text: fallback });
      return fallback;
    }
  }

  async function generateFeedback() {
    const transcript = history.map((h) => `${h.role === 'assistant' ? 'Zoe' : 'Student'}: ${h.text}`).join('\n');
    const prompt = `Here is the full transcript of the call:

${transcript}

Grammar mistakes tracked during the call: ${JSON.stringify(collectedErrors)}

Now output ONLY a valid JSON object (no markdown, no code fences) with this exact shape:
{"errors": [{"wrong": "...", "correct": "...", "rule": "...", "explanation_it": "..."}], "level": "beginner" | "intermediate" | "advanced", "strengths": ["..."], "score": <number 0-10>, "encouragement": "..."}
Pick the 3-5 most useful errors (deduplicate similar ones). "rule" must be a short, precise grammar rule name exactly as a teacher would write it on a test (e.g. "Present Perfect con for/since", "Second Conditional", "Comparativo di maggioranza") — never vague. "explanation_it" must clearly restate the rule in Italian so the student understands WHY, not just what the correction is. "strengths" can be in Italian. "encouragement" should sound like Zoe: warm and casual, mostly English.`;

    try {
      const raw = await callClaude([{ role: 'user', content: prompt }], 1200);
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (err) {
      console.error('SpeakEasy: generateFeedback failed', err);
      return {
        errors: collectedErrors.slice(0, 5),
        level: 'intermediate',
        strengths: ['Hai continuato a parlare per tutta la chiamata'],
        score: 7,
        encouragement: "Your English is good! We couldn't get full feedback this time, but keep practicing!",
      };
    }
  }

  function getConversationHistory() {
    return history;
  }

  function resetConversation() {
    history.length = 0;
    collectedErrors = [];
  }

  return { startConversation, sendMessage, generateFeedback, getConversationHistory, resetConversation };
})();
