# Code Review: ListeningComprehensionActivity Multi-Audio

**File reviewed:** `/home/harby/projects/engyup/src/components/player/ListeningComprehensionActivity.tsx`
**Spec:** `/home/harby/projects/engyup/.kimchi/docs/listening-audio-spec.md`

## Verification Summary

| Acceptance Criterion | Status |
|---|---|
| `listening`, `type`, and `original` audios looked up by `audioType` | Met |
| Main play button uses the `listening` audio | Met |
| Type and Original buttons only render when their audio exists | Met |
| Clicking any audio button stops currently playing audio before starting new one | **Not met via UI** |
| File compiles and TypeScript is happy | Met (no errors in this file) |

## TypeScript / Lint

- `npx tsc --noEmit` reports many pre-existing errors across the codebase (Next.js imports, missing DB members, unrelated components), but **no errors originate from `ListeningComprehensionActivity.tsx`**.
- `npm run lint` is defined as `tsc --noEmit`; filtering the output for `ListeningComprehensionActivity` or `Audio` yields no matches.
- No test suite exists for this component.

## Verdict

NEEDS_FIXES

## Issues

### 1. Audio buttons are disabled while any audio is playing, preventing audio switching

**File:** `/home/harby/projects/engyup/src/components/player/ListeningComprehensionActivity.tsx`
**Lines:** 240, 260, 277

The main and secondary buttons all use `disabled={isSpeaking}`. Because `isSpeaking` is a single global flag shared by all audio sources, clicking a different audio button while any audio is playing is impossible. This contradicts the spec's acceptance criterion:

> "Clicking any audio button stops any currently playing audio before starting the new one."

The shared `playAudio` helper (lines 82–121) correctly pauses the previous `<audio>` element and calls `speechSynthesis.cancel()` before starting a new source, so the stop-before-start logic is already implemented. The `disabled` prop prevents users from exercising it.

**Suggested fix:** Remove `disabled={isSpeaking}` from all audio playback buttons. Rely on `playAudio` to stop the previous source. If rapid double-clicks are a concern, guard against re-triggering the *same* source rather than disabling every button:

```tsx
// Track which source is currently active instead of a global boolean
const [activeAudio, setActiveAudio] = useState<'listening' | 'type' | 'original' | null>(null);
const isSpeaking = activeAudio !== null;

const playAudio = useCallback((source: ActivityMediaEntry | null, key: 'listening' | 'type' | 'original') => {
  // existing stop logic ...
  setActiveAudio(key);
  // ...onended/onerror set activeAudio(null)
}, []);
```

Then each button can be disabled only when `activeAudio === 'listening'` (etc.), allowing the user to click a different source to switch playback.

### 2. Global `isSpeaking` state makes every button appear to be the "playing" one

**File:** `/home/harby/projects/engyup/src/components/player/ListeningComprehensionActivity.tsx`
**Lines:** 82–121, 232–287

Because `isSpeaking` is not scoped to a specific audio source, all three buttons pulse/change appearance whenever any source is active. For example, while the "Type Audio" source is playing, the main "Play Audio" button reads "Playing..." with an indigo active style, even though the listening source is not the one currently playing. This is confusing UX and conflicts with the spirit of the spec requirement to report playing state consistently per source.

**Suggested fix:** Track the active source (as shown in issue 1) and derive the visual state per button from `activeAudio === 'listening' | 'type' | 'original'`.
