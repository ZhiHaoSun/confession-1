const DEFAULT_MODEL = 'gpt-image-2';
const DEFAULT_QUALITY = 'high';
const DEFAULT_SIZE = '2048x1152';
const DEFAULT_JIGSAW_SIZE = '2048x2048';
const DEFAULT_FORMAT = 'webp';
const DEFAULT_COMPRESSION = 92;
const MAX_REFERENCE_PHOTOS = 3;

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

function compact(value, maxLength = 800) {
  return String(value || '').trim().slice(0, maxLength);
}

function allowedReferenceUrl(value) {
  const bucket = String(process.env.GCS_BUCKET || '').trim();
  const publicBaseUrl = String(process.env.GCS_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (!value || !bucket) return false;

  try {
    const url = new URL(value);
    const storagePrefix = `https://storage.googleapis.com/${bucket}/`;
    if (url.href.startsWith(storagePrefix)) return true;
    return !!publicBaseUrl && url.href.startsWith(`${publicBaseUrl}/`);
  } catch {
    return false;
  }
}

function buildPrompt(body, referenceGuide) {
  const memory = body.memory || {};
  const isSquare = body.imageShape === 'square';
  const details = [
    compact(memory.title) && `Title: ${compact(memory.title)}`,
    compact(memory.location) && `Location: ${compact(memory.location)}`,
    compact(memory.people) && `People: ${compact(memory.people)}`,
    compact(memory.description) && `Memory: ${compact(memory.description, 1200)}`,
    compact(memory.dialogue) && `Dialogue: ${compact(memory.dialogue)}`,
  ].filter(Boolean).join('\n');
  const objects = (Array.isArray(body.interactives) ? body.interactives : [])
    .slice(0, 5)
    .map(item => {
      const title = compact(item?.title, 80);
      const x = Number(item?.position?.x);
      const y = Number(item?.position?.y);
      if (!title) return '';
      return Number.isFinite(x) && Number.isFinite(y)
        ? `${title} near (${x.toFixed(2)}, ${y.toFixed(2)})`
        : title;
    })
    .filter(Boolean)
    .join(', ');

  return [
    isSquare
      ? 'Purpose: square scene artwork for a romantic 2 by 2 draggable jigsaw memory puzzle.'
      : 'Purpose: landscape background for a romantic interactive memory story.',
    'Visual medium: gentle manga-inspired hand-illustrated slice-of-life graphic novel; delicate ink outlines; soft flat colors with subtle watercolor paper texture; expressive but simple characters.',
    'Rendering quality: crisp high-resolution game artwork, clean linework, readable character silhouettes and meaningful objects, detailed enough for mobile and desktop fullscreen playback.',
    'Mood: light, affectionate, youthful, emotionally safe, quietly nostalgic.',
    'Palette: warm ivory, blush pink, peach and coral, pale sky blue, soft mint accents; gentle daylight or golden-hour light.',
    `Scene: ${compact(body.sceneDescription, 1200) || details || 'A tender shared everyday memory.'}`,
    details && `Memory details:\n${details}`,
    objects && `Important ordinary objects naturally present in the illustrated scene: ${objects}. Depict them as physical objects integrated into the environment and keep them near their stated positions.`,
    referenceGuide && `Reference images:\n${referenceGuide}`,
    'Reference handling: if scene photos are provided, reinterpret them as a manga memory scene while preserving recognizable setting, meaningful objects, clothing colors, and general pose and composition where visible.',
    'Character likeness handling: if creator or receiver portrait references are provided, use them only to guide the corresponding illustrated character appearance. Preserve recognizable facial shape, hairstyle, skin tone, glasses or distinctive visible features, and apparent build or clothing style where shown, translated softly into manga linework. Do not paste photographic faces into the illustration.',
    'Character presence: when portrait references are provided and the memory describes a shared couple moment, include the referenced couple naturally in the scene with their faces and silhouettes visible enough to feel personal. Respect the written memory if it clearly calls for only one person or an object-only setting.',
    isSquare
      ? 'Composition: square 1:1 image for a 2 by 2 jigsaw board; keep important faces and meaningful objects away from exact tile seams where possible; all 4 tiles should feel visually useful and readable.'
      : 'Composition: wide 16:9 scene for a mobile game canvas; clean negative space for overlays; foreground and background readable; no text embedded in the artwork.',
    'Interaction overlay rule: the game interface adds all interactive hotspots separately. Do not add UI icons, pink markers, glowing hotspot circles, pins, badges, arrows, buttons, labels, sparkles around objects, or any graphical indication that an object can be tapped.',
    'Avoid: photorealism, dark purple atmosphere, horror or suspense mood, harsh shadows, overlaid writing, logos, watermarks, copied branded game imagery, or embedded interface elements.',
  ].filter(Boolean).join('\n');
}

function imageOptions(prompt, body = {}) {
  const size = body.imageShape === 'square'
    ? (process.env.OPENAI_IMAGE_JIGSAW_SIZE || DEFAULT_JIGSAW_SIZE)
    : (process.env.OPENAI_IMAGE_SIZE || DEFAULT_SIZE);
  const compression = Number(process.env.OPENAI_IMAGE_OUTPUT_COMPRESSION || DEFAULT_COMPRESSION);

  return {
    model: process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL,
    prompt,
    size,
    quality: process.env.OPENAI_IMAGE_QUALITY || DEFAULT_QUALITY,
    output_format: process.env.OPENAI_IMAGE_OUTPUT_FORMAT || DEFAULT_FORMAT,
    output_compression: Number.isFinite(compression)
      ? Math.min(100, Math.max(0, compression))
      : DEFAULT_COMPRESSION,
    moderation: 'auto',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    json(res, 500, { error: 'Missing OPENAI_API_KEY for scene illustration generation.' });
    return;
  }

  try {
    const body = await readBody(req);
    const sceneReferences = (Array.isArray(body.referencePhotoUrls) ? body.referencePhotoUrls : [])
      .filter(allowedReferenceUrl)
      .slice(0, MAX_REFERENCE_PHOTOS);
    const characters = body.characters || {};
    const creatorPortrait = allowedReferenceUrl(characters.creator?.portraitUrl)
      ? characters.creator.portraitUrl
      : '';
    const receiverPortrait = allowedReferenceUrl(characters.receiver?.portraitUrl)
      ? characters.receiver.portraitUrl
      : '';
    const references = [...sceneReferences];
    const referenceGuide = sceneReferences.map((url, index) =>
      `Image ${index + 1}: memory scene reference photo; use for setting and shared moment composition.`
    );
    const characterReferencesUsed = [];

    if (creatorPortrait) {
      references.push(creatorPortrait);
      characterReferencesUsed.push('creator');
      referenceGuide.push(`Image ${references.length}: portrait reference for the creator (${compact(characters.creator?.name, 80) || 'boy'}); use only for his illustrated face and figure.`);
    }
    if (receiverPortrait) {
      references.push(receiverPortrait);
      characterReferencesUsed.push('receiver');
      referenceGuide.push(`Image ${references.length}: portrait reference for the receiver (${compact(characters.receiver?.name, 80) || 'girl'}); use only for her illustrated face and figure.`);
    }

    const prompt = buildPrompt(body, referenceGuide.join('\n'));
    const sourceMode = references.length ? 'reference' : 'text';
    const options = imageOptions(prompt, body);
    const endpoint = sourceMode === 'reference' ? 'edits' : 'generations';
    const requestBody = sourceMode === 'reference'
      ? { ...options, images: references.map(imageUrl => ({ image_url: imageUrl })) }
      : options;

    const response = await fetch(`https://api.openai.com/v1/images/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.data?.[0]?.b64_json) {
      const message = result.error?.message || `Image generation failed (${response.status}).`;
      json(res, response.ok ? 502 : response.status, { error: message });
      return;
    }

    json(res, 200, {
      imageBase64: result.data[0].b64_json,
      contentType: `image/${options.output_format}`,
      metadata: {
        model: options.model,
        style: 'romantic-manga',
        quality: options.quality,
        size: options.size,
        outputFormat: options.output_format,
        imageShape: body.imageShape === 'square' ? 'square' : 'landscape',
        sourceMode,
        characterReferencesUsed,
      },
    });
  } catch (error) {
    json(res, 500, { error: error.message || 'Unable to generate scene illustration.' });
  }
}
