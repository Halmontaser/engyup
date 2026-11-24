import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { getMediaUrl } from '@/api/supabase';

let currentSound: Audio.Sound | null = null;

export async function stopAllAudio(): Promise<void> {
  try {
    Speech.stop();
    if (currentSound) {
      const soundToUnload = currentSound;
      currentSound = null;
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
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

  const playTTS = (text: string) => {
    const isArabic = /[\u0600-\u06FF]/.test(text);
    Speech.speak(text, {
      language: isArabic ? 'ar-SA' : 'en-US',
      rate: isArabic ? 0.95 : 0.9,
      onDone: onFinish,
      onStopped: onFinish,
      onError: onFinish,
    });
  };

  // Try playing recorded CDN MP3 first
  if (audioPathOrUrl) {
    const fullUrl = getMediaUrl(audioPathOrUrl);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { shouldPlay: true },
        async (status) => {
          if (!status.isLoaded) {
            if (status.error) {
              console.warn('Audio playback error:', status.error);
              currentSound = null;
              if (fallbackText) {
                playTTS(fallbackText);
              } else if (onFinish) {
                onFinish();
              }
            }
            return;
          }

          if (status.didJustFinish) {
            try {
              await sound.unloadAsync();
            } catch (err) {
              // Ignore unload errors
            }
            currentSound = null;
            if (onFinish) onFinish();
          }
        }
      );
      currentSound = sound;
      return;
    } catch (e) {
      console.warn('Failed to load CDN audio, falling back to TTS:', e);
    }
  }

  // Fallback to text-to-speech
  if (fallbackText) {
    playTTS(fallbackText);
  } else if (onFinish) {
    onFinish();
  }
}
