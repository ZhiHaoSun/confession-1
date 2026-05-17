import crypto from 'node:crypto';

const DEFAULT_EXPIRES_SECONDS = 15 * 60;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

function encodePathSegment(segment) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeObjectPath(path) {
  return path.split('/').map(encodePathSegment).join('/');
}

function sanitizeFileName(fileName) {
  const safe = String(fileName || 'upload')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
  return safe || 'upload';
}

function sanitizeObjectName(objectName) {
  const cleaned = String(objectName || '')
    .split('/')
    .map(sanitizeFileName)
    .filter(Boolean)
    .join('/');
  if (!cleaned || cleaned.includes('..')) {
    throw new Error('Invalid objectName');
  }
  return cleaned;
}

function getPrivateKey() {
  let raw = process.env.GCS_PRIVATE_KEY || '';
  // Strip surrounding quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  // Convert literal \n sequences to real newlines
  raw = raw.replace(/\\n/g, '\n');
  // Strip PEM header/footer and all whitespace, then rebuild proper PEM
  const base64 = raw
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  if (!base64) return '';
  // Rebuild with proper 64-char line breaks
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

function toQuery(params) {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  const bucket = process.env.GCS_BUCKET;
  const clientEmail = process.env.GCS_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!bucket || !clientEmail || !privateKey) {
    json(res, 500, {
      error: 'Missing GCS_BUCKET, GCS_CLIENT_EMAIL, or GCS_PRIVATE_KEY environment variables.',
    });
    return;
  }

  try {
    const body = await readBody(req);
    const folder = sanitizeFileName(body.folder || 'memorymaze');
    const fileName = sanitizeFileName(body.fileName || 'upload');
    const contentType = String(body.contentType || 'application/octet-stream').toLowerCase();
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const randomId = crypto.randomBytes(8).toString('hex');
    const objectName = body.objectName
      ? sanitizeObjectName(body.objectName)
      : `${folder}/${yyyymmdd}/${randomId}-${fileName}`;
    const encodedObject = encodeObjectPath(objectName);

    const credentialScope = `${yyyymmdd}/auto/storage/goog4_request`;
    const credential = `${clientEmail}/${credentialScope}`;
    const queryParams = {
      'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
      'X-Goog-Credential': credential,
      'X-Goog-Date': timestamp,
      'X-Goog-Expires': String(DEFAULT_EXPIRES_SECONDS),
      'X-Goog-SignedHeaders': 'content-type;host',
    };

    const canonicalQuery = toQuery(queryParams);
    const canonicalUri = `/${bucket}/${encodedObject}`;
    const canonicalRequest = [
      'PUT',
      canonicalUri,
      canonicalQuery,
      `content-type:${contentType}\n` +
      'host:storage.googleapis.com\n',
      'content-type;host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const hashedRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = [
      'GOOG4-RSA-SHA256',
      timestamp,
      credentialScope,
      hashedRequest,
    ].join('\n');

    const signature = crypto.createSign('RSA-SHA256').update(stringToSign).sign(privateKey, 'hex');
    const signedUrl = `https://storage.googleapis.com${canonicalUri}?${canonicalQuery}&X-Goog-Signature=${signature}`;
    const publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL || `https://storage.googleapis.com/${bucket}`;
    const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${encodedObject}`;

    json(res, 200, {
      signedUrl,
      publicUrl,
      objectName,
      contentType,
      expiresIn: DEFAULT_EXPIRES_SECONDS,
    });
  } catch (error) {
    json(res, 500, { error: error.message || 'Failed to create signed upload URL.' });
  }
}
