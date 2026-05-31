# MemoryMaze

MemoryMaze turns shared couple memories into a romantic AI-generated puzzle game that can be shared as a private web link or QR code.

It is designed as a heartfelt confession-gift generator: the creator uploads memories, photos, music, optional couple portraits, a voice sample, and a final confession video; AI turns those inputs into illustrated manga-style game scenes, interactive memory reveals, gentle puzzles, spoken narration, and a final love-letter moment.

## What It Does

- Guides the creator through a multi-step wizard for relationship details, memories, puzzle setup, and finale assets.
- Uploads media to Google Cloud Storage so generated games use durable HTTPS URLs instead of oversized browser storage.
- Generates romantic manga scene artwork with OpenAI image generation.
- Supports optional portrait references for the boy and girl so generated scenes feel more personal.
- Generates interactive playable Phaser.js scenes from config JSON.
- Supports memory hotspots, quiz/password/hidden-object puzzles, and a simplified 2x2 jigsaw memory challenge.
- Uses one shared scene music file across generated scenes.
- Generates optional spoken narration for puzzle hints and the final confession letter.
- Saves each generated maze config to Google Cloud Storage with a unique maze ID.
- Opens games directly from `/game.html?id=<mazeId>`.
- Shows a QR code for the generated share link.
- Allows editing an existing maze by loading the stored config, reusing the creation flow, and saving over the cloud config.

## Creator Flow

1. Enter basic relationship details such as names, birthdays, anniversaries, and nicknames.
2. Optionally upload one portrait photo for each person.
3. Add memory scenes with photos, dates, locations, people, dialogue, and emotional descriptions.
4. Upload one shared music file that loops across scenes.
5. Pick a puzzle mechanic for each scene:
   - Memory quiz
   - Password lock
   - Hidden object
   - 2x2 jigsaw memory puzzle
6. Upload a final confession video.
7. Optionally upload a voice recording and enable narration.
8. Generate the maze, review illustrated scene artwork, regenerate individual scenes if needed, and share the final link or QR code.

## Recipient Game Flow

1. The recipient opens the shared link or scans the QR code.
2. The game loads the stored cloud config by maze ID.
3. Each chapter presents a romantic memory scene.
4. Normal scenes show clickable memory points and puzzle interactions.
5. Jigsaw scenes show a clean 2x2 board and four draggable pieces in a bottom tray.
6. Solving a chapter reveals a memory card with emotional copy and rewards.
7. After all chapters are complete, the final confession scene shows the love letter, optional spoken narration, and optional video.

## Tech Stack

- Frontend: Vite, vanilla JavaScript, CSS
- Game engine: Phaser.js
- AI text generation: OpenAI ChatGPT-compatible API through `VITE_OPENAI_API_KEY`
- Scene artwork: OpenAI Image API via server endpoint `/api/scene-image`
- Voice narration: OpenAI TTS via `/api/narration`
- Optional custom voice profile preparation: `/api/voice-profile`
- Media and config storage: Google Cloud Storage
- Serverless API runtime: Vercel Functions
- Sharing: cloud config loaded through `/api/maze-config?id=<mazeId>`

## Project Structure

```text
api/
  gcs-upload-url.js    Signed upload URLs for Google Cloud Storage
  maze-config.js       Load saved game configs by maze ID
  narration.js         Generate spoken hint/finale narration
  scene-image.js       Generate romantic manga scene artwork
  voice-profile.js     Optional custom voice profile preparation

src/
  ai/                  Config, artwork, and narration services
  game/                Phaser game boot and scenes
  wizard/              Creator wizard steps
  i18n/                English/Chinese UI strings
  styles/              Wizard and app styling

docs/
  GCS_MEDIA_SETUP.md
  RECIPIENT_GAME_DISPLAY_FLOW.md
```

## Environment Variables

Create `.env` from `.env.example`.

```bash
cp .env.example .env
```

Important variables:

```env
# Client-side text generation used by the wizard.
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_MODEL=gpt-5.5

# Server-only key for artwork and narration endpoints.
OPENAI_API_KEY=your_openai_api_key
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_QUALITY=medium
OPENAI_IMAGE_SIZE=1536x864
OPENAI_IMAGE_JIGSAW_SIZE=1024x1024
OPENAI_IMAGE_OUTPUT_FORMAT=webp
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=cedar

# Google Cloud Storage.
GCS_BUCKET=your-bucket-name
GCS_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
GCS_PRIVATE_KEY=your_service_account_private_key_with_escaped_newlines
GCS_PUBLIC_BASE_URL=
GCS_CONFIG_PREFIX=memorymaze/configs
```

Notes:

- `OPENAI_API_KEY` is server-only and must not use a `VITE_` prefix.
- `VITE_OPENAI_API_KEY` is exposed to the browser by design in the current demo flow.
- ChatGPT Plus does not include API credits; OpenAI API billing and model access are separate.
- Google Cloud Storage must allow public or CDN-backed reads for generated media URLs used by the game.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the frontend only:

```bash
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173). This mode does not run the `/api/*` functions, so generated illustrations, narration audio, Google Cloud uploads, and saved maze links are unavailable.

Run the full MemoryMaze flow locally:

```bash
npx vercel dev --listen 5173
```

The full app will be available at [http://localhost:5173](http://localhost:5173) with the API functions needed for scene artwork, narration, uploads, saved maze links, edit mode, and QR-backed sharing.

Build for production:

```bash
npm run build
```

## Game Config Model

Generated games are driven by a config JSON object containing:

- `meta`: title, style, maze ID, share URL, timestamps
- `characters`: creator and recipient names plus optional portrait references
- `levels`: playable memory chapters
- `levels[].background`: generated artwork URL or fallback image
- `levels[].interactives`: clickable memory/puzzle points for normal scenes
- `levels[].challenge`: scene-level challenge data, such as `type: "jigsaw"`
- `finale`: love letter, video URL, narration URL, and background music choice
- `narration`: narration settings and generated voice mode metadata

Jigsaw levels use:

```json
{
  "challenge": {
    "type": "jigsaw",
    "rows": 2,
    "cols": 2,
    "pieces": 4,
    "source": "background",
    "prompt": "Put this memory back together"
  },
  "interactives": []
}
```

## Deployment

The intended deployment target is Vercel:

1. Configure the environment variables above in Vercel.
2. Ensure the Google Cloud service account can create and overwrite objects in the target bucket.
3. Ensure generated media/config objects are readable through `https://storage.googleapis.com/<bucket>/...` or `GCS_PUBLIC_BASE_URL`.
4. Deploy the Vite frontend and Vercel API functions together.

Generated share links look like:

```text
https://traeconfessionmljh.vercel.app/game.html?id=<mazeId>
```

## Current Product Direction

New creations use the Romantic Manga Diary visual direction by default: soft manga linework, warm ivory and blush tones, gentle everyday romance, and light emotional storytelling. Legacy stored configs can still play older style values, but the creator flow now focuses on this single romantic style.

The game renderer is mobile-first and viewport-filling, with a landscape play mode and compact jigsaw layout for short mobile screens.
