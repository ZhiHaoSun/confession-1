import crypto from 'node:crypto';

const DEFAULT_EXPIRES_SECONDS = 5 * 60;
const CONFIG_PREFIX = process.env.GCS_CONFIG_PREFIX || 'memorymaze/configs';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', status === 200 ? 'public, max-age=60' : 'no-store');
  res.end(JSON.stringify(body));
}

function encodePathSegment(segment) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeObjectPath(path) {
  return path.split('/').map(encodePathSegment).join('/');
}

function getPrivateKey() {
  let raw = process.env.GCS_PRIVATE_KEY || '';
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  raw = raw.replace(/\\n/g, '\n');
  const base64 = raw
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  if (!base64) return '';
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

function toQuery(params) {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function assertMazeId(id) {
  const value = String(id || '').trim();
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(value)) {
    throw new Error('Invalid maze id');
  }
  return value;
}

function createSignedGetUrl({ bucket, clientEmail, privateKey, objectName }) {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const encodedObject = encodeObjectPath(objectName);
  const credentialScope = `${yyyymmdd}/auto/storage/goog4_request`;
  const credential = `${clientEmail}/${credentialScope}`;
  const queryParams = {
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': credential,
    'X-Goog-Date': timestamp,
    'X-Goog-Expires': String(DEFAULT_EXPIRES_SECONDS),
    'X-Goog-SignedHeaders': 'host',
  };
  const canonicalQuery = toQuery(queryParams);
  const canonicalUri = `/${bucket}/${encodedObject}`;
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQuery,
    'host:storage.googleapis.com\n',
    'host',
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
  return `https://storage.googleapis.com${canonicalUri}?${canonicalQuery}&X-Goog-Signature=${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  const bucket = process.env.GCS_BUCKET;
  const clientEmail = process.env.GCS_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!bucket || !clientEmail || !privateKey) {
    json(res, 500, { error: 'Missing GCS environment variables.' });
    return;
  }

  try {
    const mazeId = assertMazeId(req.query?.id);
    const objectName = `${CONFIG_PREFIX.replace(/\/$/, '')}/${mazeId}.json`;
    const signedUrl = createSignedGetUrl({ bucket, clientEmail, privateKey, objectName });
    const configResponse = await fetch(signedUrl);

    if (!configResponse.ok) {
      json(res, configResponse.status === 404 ? 404 : 502, {
        error: configResponse.status === 404 ? 'Maze config not found.' : 'Failed to load maze config.',
      });
      return;
    }

    const config = await configResponse.json();
    json(res, 200, config);
  } catch (error) {
    json(res, 400, { error: error.message || 'Failed to load maze config.' });
  }
}
