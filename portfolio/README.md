# Voidbyte

The portfolio of Yashwanth Raj Cherukuru, written as a monograph about falling into a black hole.

Scrolling is falling. The page ray-traces a Schwarzschild black hole in a fragment shader, bends the author's name around its photon ring, and keeps two clocks in the running foot: yours, and the one far away that time dilation leaves behind. Each project arrives as a piece of debris with a working part of itself attached. SLDT, an encrypted sync architecture designed by the author, gets its own chapter and a live copy of its protocol to attack.

## What is real

- **The black hole.** Null geodesics integrated per pixel (`src/gl/blackhole.frag.glsl`), with Doppler beaming on the disk and a lensed name plate behind it. The running foot shows the camera's actual distance in Schwarzschild radii and the matching time-dilation factor.
- **The debris.** Four artifacts modelled in code with Three.js (`src/gl/Debris.ts`), lit by an environment built from the same warm light as the disk. The microphone's ring turns red when JARVIS locks in; the padlock's light turns red when you tamper with the ciphertext.
- **The cryptography.** The SLDT figures use the Web Crypto API and Argon2id (hash-wasm) in your browser. `src/sldt/mini.ts` is a faithful miniature of the real engine: padded AES-256-GCM envelopes, an HMAC-signed and hash-chained manifest, compare-and-swap writes with exponential backoff, and deterministic conflict resolution.
- **The sound.** A drone synthesized with the Web Audio API that drops in pitch with the same dilation factor as you fall (`src/audio/VoidAudio.ts`). No audio files.

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
- To give the JARVIS figure a voice, drop `en.mp3`, `te.mp3`, `hi.mp3` and `lock.mp3` into `public/voice/`. The figure plays them when sound is on and stays silent without them.

## Accessibility

`prefers-reduced-motion` turns off smooth scrolling, freezes the shader's clock and skips the counting loader. Without WebGL the page falls back to a static drawing of the hole. Every interactive figure is a button or a form control reachable from the keyboard.

## Colophon

Set in Newsreader, with IBM Plex Mono for anything a machine wrote. Built with React, Vite, GSAP, Lenis, Three.js and raw WebGL2.
