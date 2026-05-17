# Google Cloud media upload setup

MemoryMaze uploads photos, global scene music, and finale video to Google Cloud Storage before generating the game config. The generated config and OpenAI prompts then use HTTPS media URLs instead of base64 browser storage.

Generated maze configs are uploaded as:

```text
gs://YOUR_BUCKET/memorymaze/configs/<mazeId>.json
```

Players can open:

```text
https://your-domain.vercel.app/game.html?id=<mazeId>
```

The game loads the config through `/api/maze-config?id=<mazeId>`.

## Required environment variables

Set these in Vercel project settings:

- `GCS_BUCKET`
- `GCS_CLIENT_EMAIL`
- `GCS_PRIVATE_KEY`
- `GCS_PUBLIC_BASE_URL` optional
- `GCS_CONFIG_PREFIX` optional, defaults to `memorymaze/configs`

The service account needs permission to create objects in the bucket, for example `roles/storage.objectCreator`.

## Bucket access

The generated game needs to read the uploaded media URLs. Use one of these:

- Make the bucket or uploaded objects publicly readable.
- Or set `GCS_PUBLIC_BASE_URL` to a CDN/public proxy URL that can serve the objects.

## CORS

Browser uploads use signed `PUT` URLs, so the bucket must allow CORS from your app origin.

Example CORS config:

```json
[
  {
    "origin": ["http://127.0.0.1:5173", "https://your-domain.vercel.app"],
    "method": ["PUT", "GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply it with:

```bash
gcloud storage buckets update gs://YOUR_BUCKET --cors-file=cors.json
```
