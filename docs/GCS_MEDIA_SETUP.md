# Google Cloud media upload setup

MemoryMaze uploads memory photos, couple portrait references, global scene music, finale video, creator voice samples, generated scene illustrations, and narration MP3s to Google Cloud Storage before generating the game config. The generated config and OpenAI prompts then use HTTPS media URLs instead of base64 browser storage.

Generated maze configs are uploaded as:

```text
gs://YOUR_BUCKET/memorymaze/configs/<mazeId>.json
```

Players can open:

```text
https://traeconfessionmljh.vercel.app/game.html?id=<mazeId>
```

The game loads the config through `/api/maze-config?id=<mazeId>`.

## Local development

Use `npx vercel dev --listen 5173` for the generation and playback workflow.
Plain `npm run dev` starts Vite only; it does not serve `/api/narration`,
`/api/scene-image`, `/api/gcs-upload-url`, or `/api/maze-config`, so voice
narration and cloud-backed shared games cannot be created from that server.

## Required environment variables

Set these in Vercel project settings:

- `GCS_BUCKET`
- `GCS_CLIENT_EMAIL`
- `GCS_PRIVATE_KEY`
- `GCS_PUBLIC_BASE_URL` optional
- `GCS_CONFIG_PREFIX` optional, defaults to `memorymaze/configs`
- `OPENAI_API_KEY` server-only key used by `/api/scene-image` and `/api/narration`
- `OPENAI_IMAGE_MODEL` optional, defaults to `gpt-image-2`
- `OPENAI_IMAGE_QUALITY` optional, defaults to `high`
- `OPENAI_IMAGE_SIZE` optional, defaults to `2048x1152`
- `OPENAI_IMAGE_JIGSAW_SIZE` optional, defaults to `2048x2048`
- `OPENAI_IMAGE_OUTPUT_FORMAT` optional, defaults to `webp`
- `OPENAI_IMAGE_OUTPUT_COMPRESSION` optional, defaults to `92`
- `OPENAI_TTS_MODEL` optional, defaults to `gpt-4o-mini-tts`
- `OPENAI_TTS_VOICE` optional, defaults to `cedar`
- `OPENAI_CUSTOM_VOICE_ID` optional, an already-created custom voice ID
- `OPENAI_VOICE_CONSENT_ID` optional; when present, the uploaded creator sample is used to create a custom voice

The service account needs permission to create objects and overwrite saved maze configs during edits or artwork regeneration, for example `roles/storage.objectUser`.

## Romantic Manga scene artwork

New mazes use the Romantic Manga Diary visual direction. After memory text and hotspots are prepared, `/api/scene-image` calls OpenAI `gpt-image-2` once per scene:

- With uploaded GCS photos, it uses the Image API edits workflow to reinterpret those photos as a light, pastel manga memory.
- Without photos, it generates an illustration from the written memory and visible hotspot objects.
- With optional boy/girl portrait references, it supplies those as separately labelled character references so their facial features, hair, and visible figure can guide the illustrated couple without being treated as scenery.

Uploaded portrait references are stored under `memorymaze/portraits/` and saved in `characters.creator.portraitUrl` and `characters.receiver.portraitUrl`. Generated WebP backgrounds are stored under `memorymaze/generated-scenes/`, while original memory photos remain in `level.photos`. If illustration generation cannot complete, the maze is still generated with its original or procedural background. The result page lets the creator regenerate a single background and saves the updated config under the same maze ID.

OpenAI may require API organization verification before GPT Image models can be used in a deployed project.

## Voice narration

When voice narration is selected, `/api/narration` uses `gpt-4o-mini-tts` to generate:

- One spoken MP3 for the final confession letter.
- One spoken hint MP3 for each chapter that has a puzzle hint.

Without custom voice configuration, narration uses the built-in `cedar` voice with warm confession-style speaking instructions. If `OPENAI_VOICE_CONSENT_ID` is configured, `/api/voice-profile` uses the uploaded creator sample to create the custom voice used for the narration. You may alternatively configure an already-created `OPENAI_CUSTOM_VOICE_ID`.

Using the boy's actual voice likeness requires an OpenAI custom voice that has already been created in an eligible API organization. The OpenAI custom voice API requires a separate consent recording; ChatGPT Plus does not remove that API requirement or include API billing.

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
    "origin": ["http://127.0.0.1:5173", "https://traeconfessionmljh.vercel.app"],
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
