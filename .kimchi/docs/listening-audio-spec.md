# ListeningComprehensionActivity Multi-Audio Spec

## Goal
Update `src/components/player/ListeningComprehensionActivity.tsx` so it can play three distinct audio sources identified by `ActivityMediaEntry.audioType`:
- `listening` — the main passage audio used for the activity
- `type` — a typed / read-along audio source
- `original` — the original/native audio source

## Current Behavior
The component currently uses `media.audio[0]` as the single passage audio:
```ts
const passageAudio = media.audio.length > 0 ? media.audio[0] : null;
```

## New Behavior
1. Select the main listening passage audio using `audioType === "listening"`. Fall back to the first audio entry if none is tagged.
2. Provide playback buttons for `type` and `original` audios when present in `media.audio`.
3. Keep existing auto-play of the listening passage on mount.
4. Keep the existing transcript toggle, image display, quiz flow, and results screen unchanged.
5. Stop any currently playing audio before starting another, including speech synthesis fallback.
6. Reuse the same audio playback helper/logic so all audio buttons report `isSpeaking`/playing state consistently.

## UI Changes
- In the listen phase, keep the main "Play Audio" button for the `listening` audio.
- Add a small row of secondary audio controls below the main Play Audio button (or near the transcript toggle) labeled:
  - "Type Audio" (when `type` audio exists)
  - "Original Audio" (when `original` audio exists)
- Each secondary button uses the same icon/style language as the main button but smaller.

## Acceptance Criteria
- [ ] `listening`, `type`, and `original` audios are looked up by `audioType`.
- [ ] Main play button uses the `listening` audio.
- [ ] Type and Original buttons only render when their audio exists.
- [ ] Clicking any audio button stops any currently playing audio before starting the new one.
- [ ] File compiles and TypeScript is happy (no `any` leakage beyond existing code).
