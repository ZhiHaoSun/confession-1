const MAX_INPUT_LENGTH = 4096;
const DEFAULT_MODEL = 'gpt-4o-mini-tts';
const DEFAULT_VOICE = 'cedar';
const FINALE_INSTRUCTIONS = [
  'Perform this final confession letter in a gentle, attractive adult male voice.',
  'Sound warm, calm, sincere, and slightly vulnerable, as if speaking privately to someone deeply loved.',
  'Use a slow, natural pace with soft pauses after emotional sentences and names.',
  'Keep the emotion tender and intimate, never theatrical, sales-like, overly breathy, or exaggerated.',
  'Speak naturally in Mandarin or English according to the input text.',
].join(' ');
const HINT_INSTRUCTIONS = [
  'Speak in a warm, gentle adult male voice, as a caring boyfriend offering a small clue.',
  'Use a natural conversational pace and a light smile in the tone.',
  'Keep it clear and reassuring, never dramatic or teasing.',
  'Speak naturally in Mandarin or English according to the input text.',
].join(' ');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    json(res, 500, { error: 'Missing OPENAI_API_KEY for voice narration.' });
    return;
  }

  try {
    const body = await readBody(req);
    const input = String(body.text || '').trim();
    if (!input) {
      json(res, 400, { error: 'Narration text is required.' });
      return;
    }
    if (input.length > MAX_INPUT_LENGTH) {
      json(res, 400, { error: `Narration text exceeds ${MAX_INPUT_LENGTH} characters.` });
      return;
    }

    const requestedVoiceId = String(body.voiceId || '');
    const customVoiceId = /^voice_[a-zA-Z0-9_-]+$/.test(requestedVoiceId)
      ? requestedVoiceId
      : process.env.OPENAI_CUSTOM_VOICE_ID;
    const voice = customVoiceId
      ? { id: customVoiceId }
      : (process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE);
    const model = process.env.OPENAI_TTS_MODEL || DEFAULT_MODEL;
    const narrationType = body.narrationType === 'finale' ? 'finale' : 'hint';
    const instructions = String(
      narrationType === 'finale' ? FINALE_INSTRUCTIONS : HINT_INSTRUCTIONS
    ).slice(0, 1000);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        input,
        instructions,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      json(res, response.status, { error: `OpenAI narration failed: ${error}` });
      return;
    }

    const audio = Buffer.from(await response.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Narration-Model', model);
    res.setHeader('X-Narration-Voice-Mode', customVoiceId ? 'custom' : 'built-in');
    res.setHeader('X-Narration-Type', narrationType);
    res.end(audio);
  } catch (error) {
    json(res, 500, { error: error.message || 'Unable to generate narration.' });
  }
}
