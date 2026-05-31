# confession

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the frontend only

```bash
npm run dev
```

The frontend will be available at http://localhost:5173. This mode does not run
the `/api/*` functions, so generated illustrations, narration audio, Google
Cloud uploads, and saved maze links are unavailable.

### Run the full MemoryMaze flow locally

Use Vercel's local runtime when creating or editing a playable shared maze:

```bash
npx vercel dev --listen 5173
```

The full app will be available at http://localhost:5173 with the API functions
needed for scene artwork, male-voice narration, uploads, and saved maze links.
