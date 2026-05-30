/**
 * Shared audio utilities.
 *
 * Activities dispatch the STOP_AUDIO_EVENT when they detect it on window
 * to stop any playing speech synthesis or Audio elements.
 */
export const STOP_AUDIO_EVENT = 'engyup:stop-audio';

/**
 * Call from ActivityPlayer (parent) to stop all audio globally.
 */
export function stopAllAudio(): void {
  // Stop Web Speech API (TTS)
  speechSynthesis.cancel();
  // Pause any DOM-audio elements
  document.querySelectorAll('audio').forEach((a) => {
    a.pause();
    if (a.currentTime) a.currentTime = 0;
  });
  // Notify activity components so they can stop their own Audio refs
  window.dispatchEvent(new CustomEvent(STOP_AUDIO_EVENT));
}
