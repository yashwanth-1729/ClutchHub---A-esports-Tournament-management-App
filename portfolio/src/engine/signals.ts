// Small shared state so demos and the 3D debris can react to each other.
export const signals = {
  /** SLDT demo: ciphertext has been tampered with. */
  tampered: false,
  /** JARVIS demo: 0..1 loudness while the assistant is speaking. */
  voice: 0,
  /** Hospital demo: pulses when a lock is contested. */
  contention: 0,
  /** ClutchHub demo: pulses when the leaderboard reshuffles. */
  reshuffle: 0,
}
