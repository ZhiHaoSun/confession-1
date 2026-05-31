function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function isAllowedMediaUrl(value) {
  try {
    const url = new URL(String(value || ''));
    const bucketUrl = process.env.GCS_BUCKET
      ? `https://storage.googleapis.com/${process.env.GCS_BUCKET}/`
      : '';
    const publicBaseUrl = (process.env.GCS_PUBLIC_BASE_URL || '').replace(/\/$/, '') + '/';
    return (bucketUrl && url.href.startsWith(bucketUrl))
      || (process.env.GCS_PUBLIC_BASE_URL && url.href.startsWith(publicBaseUrl));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  const existingVoiceId = process.env.OPENAI_CUSTOM_VOICE_ID || '';
  const consentId = process.env.OPENAI_VOICE_CONSENT_ID || '';
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const body = await readBody(req);
    const sampleUrl = String(body.audioSampleUrl || '');

    if (!consentId || !sampleUrl) {
      json(res, 200, existingVoiceId
        ? { voiceId: existingVoiceId, voiceMode: 'custom-configured' }
        : { voiceId: '', voiceMode: 'built-in' });
      return;
    }

    if (!apiKey) {
      json(res, 500, { error: 'Missing OPENAI_API_KEY for custom voice creation.' });
      return;
    }
    if (!isAllowedMediaUrl(sampleUrl)) {
      json(res, 400, { error: 'Voice sample must be an uploaded Google Cloud media URL.' });
      return;
    }

    const sampleResponse = await fetch(sampleUrl);
    if (!sampleResponse.ok) {
      json(res, 502, { error: 'Unable to fetch uploaded voice sample.' });
      return;
    }

    const contentType = sampleResponse.headers.get('content-type') || 'audio/webm';
    const sampleBytes = await sampleResponse.arrayBuffer();
    const form = new FormData();
    form.append('name', String(body.name || 'MemoryMaze creator voice').slice(0, 100));
    form.append('consent', consentId);
    form.append('audio_sample', new Blob([sampleBytes], { type: contentType }), 'creator-voice-sample');

    const voiceResponse = await fetch('https://api.openai.com/v1/audio/voices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const voice = await voiceResponse.json().catch(() => ({}));
    if (!voiceResponse.ok || !voice.id) {
      json(res, 200, existingVoiceId
        ? {
          voiceId: existingVoiceId,
          voiceMode: 'custom-configured',
          warning: voice.error?.message || 'Unable to create new custom voice from sample.',
        }
        : {
          voiceId: '',
          voiceMode: 'built-in',
          warning: voice.error?.message || 'Unable to create custom voice; using built-in narration.',
        });
      return;
    }

    json(res, 200, { voiceId: voice.id, voiceMode: 'custom-from-upload' });
  } catch (error) {
    json(res, 500, { error: error.message || 'Unable to prepare voice profile.' });
  }
}
