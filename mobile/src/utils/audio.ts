import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { getMediaUrl } from '@/api/supabase';

let currentSound: Audio.Sound | null = null;

export async function stopAllAudio(): Promise<void> {
  try {
    Speech.stop();
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (e) {
    // Ignore audio cleanup errors
  }
}

export async function playCurriculumAudio(
  audioPathOrUrl?: string | null,
  fallbackText?: string,
  onFinish?: () => void
): Promise<void> {
  await stopAllAudio();

  // Try playing recorded CDN MP3 first
  if (audioPathOrUrl) {
    const fullUrl = getMediaUrl(audioPathOrUrl);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            currentSound = null;
            if (onFinish) onFinish();
          }
        }
      );
      currentSound = sound;
      return;
    } catch (e) {
      console.warn('Failed to play CDN audio, falling back to TTS:', e);
    }
  }

  // Fallback to text-to-speech
  if (fallbackText) {
    Speech.speak(fallbackText, {
      language: 'en-US',
      rate: 0.9,
      onDone: onFinish,
      onStopped: onFinish,
      onError: onFinish,
    });
  } else if (onFinish) {
    onFinish();
  }
}
