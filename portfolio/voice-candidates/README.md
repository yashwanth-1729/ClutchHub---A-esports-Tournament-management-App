# Void voice candidates (not wired in yet)

Gemini TTS via OpenRouter (`google/gemini-3.1-flash-tts-preview`), same style direction for every clip:
"In a calm, low, unhurried voice, intimate and a little distant, like a ship's computer in a quiet space film, say: ..."

A three-model listening panel scored 20 English auditions (16 Gemini voices, 4 ElevenLabs) against a
"voice from the void" brief (`panel-english.json`). Winner: **Alnilam** 9/9/9; runner-up **Orus** 8.7.
Telugu, Hinglish and lock-in clips for both are here but were not yet checked by the panel.

To use Alnilam: copy `gem_alnilam_{en,te,hi,lock}.mp3` over `public/voice/{en,te,hi,lock}.mp3`,
then rebuild. Update the JARVIS caption in `src/content.ts` (it no longer uses the app's own voices).
