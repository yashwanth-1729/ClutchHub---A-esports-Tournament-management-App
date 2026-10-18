# Voidbyte

The portfolio of Yashwanth Raj Cherukuru, written as a monograph about falling into a black hole.

Scrolling is falling. The page ray-traces a Schwarzschild black hole in a fragment shader, bends the author's name around its photon ring, and keeps two clocks in the running foot: yours, and the one far away that time dilation leaves behind. Each project arrives as a piece of debris with a small working model of itself attached. SLDT, an encrypted sync architecture designed by the author, gets its own chapter and a live copy of its protocol to attack.

## What is real

- **The black hole.** Null geodesics integrated per pixel (`src/gl/blackhole.frag.glsl`), with Doppler beaming on the disk and a lensed name plate behind it. The running foot shows the camera's actual distance in Schwarzschild radii and two clocks that drift apart by the time-dilation factor.
- **The debris.** Four artifacts modelled in code with Three.js (`src/gl/Debris.ts`), lit by an environment built from the same warm light as the disk. The microphone's ring turns red when JARVIS locks in; the padlock's light turns red when you tamper with the ciphertext.
- **The cryptography.** The SLDT figures use the Web Crypto API and Argon2id (hash-wasm) in your browser. `src/sldt/mini.ts` is a faithful miniature of the real engine: padded AES-256-GCM envelopes, an HMAC-signed and hash-chained manifest, compare-and-swap writes with exponential backoff, and deterministic conflict resolution.
- **The sound.** A drone synthesized with the Web Audio API whose pitch and brightness fall as the time-dilation factor rises (`src/audio/VoidAudio.ts`). No audio files.

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # typecheck, then a static build in dist/
```

Any static host works. On Vercel, import the repository and keep the detected Vite settings.

## Changing things

- Copy, projects, links and the index all live in `src/content.ts`. Empty links (Instagram, LinkedIn, website) stay hidden until they are filled in.
- Camera framing per section lives in `FRAMES` in `src/engine/engine.ts`.
- The JARVIS figure's voice clips in `public/voice/` are made the way the app makes its own: Kokoro `af_sky` for English, Grok Voice `eve` for Telugu and Hindi, through OpenRouter at a pace of 1.15, then trimmed and levelled to -18 LUFS. The drone ducks while they play. Set `HAS_VOICE` to `false` in `src/components/demos/JarvisDemo.tsx` for text only.

## Accessibility

`prefers-reduced-motion` turns off smooth scrolling, freezes the shader's clock and the debris, skips the counting loader, the plunge and the self-playing figures, and only redraws the hole when something changes. Without WebGL the page falls back to a static drawing of the hole. Every control is a button or form control reachable from the keyboard; the Fig. 4 lens also drifts across the ciphertext on its own for anyone not using a pointer.

## Colophon

Set in Hubot Sans (display) and Mona Sans (text), with Monaspace Neon for anything a machine wrote: one family in three voices, on a single type scale defined in `src/styles/global.css`. Built with React, Vite, GSAP, Lenis, Three.js and raw WebGL2.
